import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Phone, 
  Lock, 
  User, 
  Shield, 
  Chrome,
  MessageSquare,
  Clock,
  CheckCircle
} from "lucide-react";

interface AuthFormData {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  otp?: string;
}

export default function EnhancedAuth() {
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | null>(null);
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email');
  const [formData, setFormData] = useState<AuthFormData>({});

  // Local login mutation
  const localLoginMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      const res = await apiRequest("POST", "/api/auth/local/login", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to SP Ahilyanagar Administrative Reform System",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Local registration mutation
  const localRegisterMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      const res = await apiRequest("POST", "/api/auth/local/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Welcome to SP Ahilyanagar Administrative Reform System",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // OTP request mutation
  const otpRequestMutation = useMutation({
    mutationFn: async ({ identifier, method }: { identifier: string; method: 'email' | 'sms' }) => {
      const res = await apiRequest("POST", "/api/auth/otp/request", { identifier, method });
      return res.json();
    },
    onSuccess: () => {
      setOtpStep('verify');
      toast({
        title: "OTP Sent",
        description: `Verification code sent to your ${otpMethod}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send OTP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // OTP verification mutation
  const otpVerifyMutation = useMutation({
    mutationFn: async ({ identifier, otp, userData }: { identifier: string; otp: string; userData?: AuthFormData }) => {
      const res = await apiRequest("POST", "/api/auth/otp/verify", { identifier, otp, userData });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to SP Ahilyanagar Administrative Reform System",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLocalAuth = () => {
    if (authMode === 'login') {
      localLoginMutation.mutate(formData);
    } else {
      localRegisterMutation.mutate(formData);
    }
  };

  const handleOtpRequest = () => {
    const identifier = otpMethod === 'email' ? formData.email : formData.phone;
    if (!identifier) {
      toast({
        title: "Missing Information",
        description: `Please provide your ${otpMethod}`,
        variant: "destructive",
      });
      return;
    }
    otpRequestMutation.mutate({ identifier, method: otpMethod });
  };

  const handleOtpVerify = () => {
    const identifier = otpMethod === 'email' ? formData.email : formData.phone;
    if (!identifier || !formData.otp) {
      toast({
        title: "Missing Information",
        description: "Please provide both identifier and OTP",
        variant: "destructive",
      });
      return;
    }
    otpVerifyMutation.mutate({ 
      identifier, 
      otp: formData.otp,
      userData: authMode === 'register' ? formData : undefined
    });
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SP Ahilyanagar</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Administrative Reform Program</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Vision 2047 Initiative
          </Badge>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Secure Access Portal</CardTitle>
            <CardDescription>
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="local" className="text-xs">
                  <Lock className="h-4 w-4 mr-1" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="otp" className="text-xs">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  OTP
                </TabsTrigger>
                <TabsTrigger value="social" className="text-xs">
                  <Chrome className="h-4 w-4 mr-1" />
                  Google
                </TabsTrigger>
              </TabsList>

              {/* Local Authentication */}
              <TabsContent value="local" className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <Button
                      variant={authMode === 'login' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAuthMode('login')}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={authMode === 'register' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAuthMode('register')}
                    >
                      Register
                    </Button>
                  </div>
                </div>

                {authMode === 'register' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>

                {authMode === 'register' && (
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>

                <Button 
                  onClick={handleLocalAuth}
                  className="w-full"
                  disabled={localLoginMutation.isPending || localRegisterMutation.isPending}
                >
                  {(localLoginMutation.isPending || localRegisterMutation.isPending) ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <User className="h-4 w-4 mr-2" />
                  )}
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </TabsContent>

              {/* OTP Authentication */}
              <TabsContent value="otp" className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <Button
                      variant={otpMethod === 'email' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setOtpMethod('email')}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant={otpMethod === 'sms' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setOtpMethod('sms')}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      SMS
                    </Button>
                  </div>
                </div>

                {otpStep !== 'verify' ? (
                  <>
                    {authMode === 'register' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="otpFirstName">First Name</Label>
                          <Input
                            id="otpFirstName"
                            value={formData.firstName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="otpLastName">Last Name</Label>
                          <Input
                            id="otpLastName"
                            value={formData.lastName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="identifier">
                        {otpMethod === 'email' ? 'Email Address' : 'Phone Number'}
                      </Label>
                      <Input
                        id="identifier"
                        type={otpMethod === 'email' ? 'email' : 'tel'}
                        value={otpMethod === 'email' ? (formData.email || '') : (formData.phone || '')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          [otpMethod === 'email' ? 'email' : 'phone']: e.target.value 
                        }))}
                        placeholder={otpMethod === 'email' ? 'your@email.com' : '+91 9876543210'}
                      />
                    </div>

                    <div className="flex justify-center mb-4">
                      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <Button
                          variant={authMode === 'login' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setAuthMode('login')}
                        >
                          Login
                        </Button>
                        <Button
                          variant={authMode === 'register' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setAuthMode('register')}
                        >
                          Register
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={handleOtpRequest}
                      className="w-full"
                      disabled={otpRequestMutation.isPending}
                    >
                      {otpRequestMutation.isPending ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Send Verification Code
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Verification code sent to your {otpMethod}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="otp">Enter Verification Code</Label>
                      <Input
                        id="otp"
                        value={formData.otp || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="text-center text-lg tracking-wider"
                      />
                    </div>

                    <Button 
                      onClick={handleOtpVerify}
                      className="w-full"
                      disabled={otpVerifyMutation.isPending}
                    >
                      {otpVerifyMutation.isPending ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Verify & Sign In
                    </Button>

                    <Button 
                      onClick={() => setOtpStep(null)}
                      variant="outline"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </>
                )}
              </TabsContent>

              {/* Social Authentication */}
              <TabsContent value="social" className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sign in with your Google account
                  </p>
                </div>

                <Button 
                  onClick={handleGoogleAuth}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  Continue with Google
                </Button>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your Google account will be securely linked to the SP Ahilyanagar administrative system. 
                    This provides single sign-on access to all program management features.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to the administrative reform program guidelines and data protection policies.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secured by Maharashtra Police IT Division
          </p>
        </div>
      </div>
    </div>
  );
}