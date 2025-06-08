import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import twilio from "twilio";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Password hashing utilities
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// OTP utilities
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Twilio client for SMS OTP
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Email transporter for email OTP
const emailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null;

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; userId?: string }>();

export async function setupMultiAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy (username/password)
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value);
        
        if (!user) {
          // Create new user from Google profile
          user = await storage.createUser({
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            username: profile.emails?.[0]?.value || `google_${profile.id}`,
            password: await hashPassword(randomBytes(32).toString('hex')), // Random password
            role: 'member',
            isActive: true,
            lastLoginAt: new Date(),
            googleId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value
          });
        } else {
          // Update last login
          await storage.updateUserLastLogin(user.id);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Local authentication routes
  app.post("/api/auth/local/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, phone } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'member',
        isActive: true,
        lastLoginAt: new Date()
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.status(201).json({ message: "Registration successful", user });
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/auth/local/login", passport.authenticate("local"), async (req, res) => {
    await storage.updateUserLastLogin(req.user.id);
    res.json({ message: "Login successful", user: req.user });
  });

  // Google OAuth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google_failed" }),
    (req, res) => {
      res.redirect("/"); // Redirect to dashboard on success
    }
  );

  // OTP Authentication routes
  app.post("/api/auth/otp/request", async (req, res) => {
    try {
      const { identifier, method } = req.body; // identifier can be email or phone
      
      if (!identifier || !method) {
        return res.status(400).json({ message: "Identifier and method required" });
      }

      const otp = generateOTP();
      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

      // Store OTP
      otpStore.set(identifier, { otp, expires });

      if (method === 'sms' && twilioClient) {
        // Send SMS OTP
        await twilioClient.messages.create({
          body: `Your SP Ahilyanagar login code: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: identifier
        });
        res.json({ message: "OTP sent via SMS" });
      } else if (method === 'email' && emailTransporter) {
        // Send Email OTP
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: identifier,
          subject: "SP Ahilyanagar - Login Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #FF6B35;">SP Ahilyanagar Administrative Reform</h2>
              <p>Your verification code is:</p>
              <h1 style="background: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
              <p>This code will expire in 5 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          `
        });
        res.json({ message: "OTP sent via email" });
      } else {
        res.status(400).json({ message: "OTP service not configured" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP", error: error.message });
    }
  });

  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { identifier, otp, userData } = req.body;
      
      const storedOtpData = otpStore.get(identifier);
      if (!storedOtpData) {
        return res.status(400).json({ message: "OTP not found" });
      }

      if (Date.now() > storedOtpData.expires) {
        otpStore.delete(identifier);
        return res.status(400).json({ message: "OTP expired" });
      }

      if (storedOtpData.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // OTP verified, clean up
      otpStore.delete(identifier);

      // Check if user exists
      let user = await storage.getUserByEmail(identifier) || await storage.getUserByPhone(identifier);
      
      if (!user && userData) {
        // Create new user if registration data provided
        user = await storage.createUser({
          ...userData,
          email: identifier.includes('@') ? identifier : userData.email,
          phone: identifier.includes('@') ? userData.phone : identifier,
          password: await hashPassword(randomBytes(32).toString('hex')), // Random password for OTP users
          role: 'member',
          isActive: true,
          lastLoginAt: new Date()
        });
      } else if (user) {
        // Update last login for existing user
        await storage.updateUserLastLogin(user.id);
      } else {
        return res.status(400).json({ message: "User not found. Please provide registration details." });
      }

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.json({ message: "Login successful", user });
      });
    } catch (error) {
      res.status(500).json({ message: "OTP verification failed", error: error.message });
    }
  });

  // Common logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logout successful" });
    });
  });

  // User endpoint is handled in routes.ts for unified authentication
}