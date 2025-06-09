import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import vision2047Logo from "@/assets/vision-2047-logo.svg";

export function VisionHeader() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="bg-gradient-to-r from-secondary via-primary to-accent text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between min-h-[80px]">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
            <div className="flex-shrink-0 flex items-center justify-center">
              <img 
                src={vision2047Logo} 
                alt="Vision 2047 Maharashtra" 
                className="h-16 lg:h-20 w-auto object-contain"
              />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h1 className="text-lg lg:text-2xl font-bold leading-tight">
                SP Ahilyanagar - Administrative Reform Program
              </h1>
              <p className="text-xs lg:text-sm opacity-90 mt-1">
                150-Day Implementation Strategy | विकसित महाराष्ट्र 2047
              </p>
              <p className="text-xs opacity-75 mt-0.5 hidden sm:block">
                May 6, 2025 - October 2, 2025 | भविष्यातील मार्गचाल
              </p>
            </div>
          </div>

          {/* Navigation and User Info */}
          <div className="flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium truncate max-w-[150px]">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </p>
                  <p className="text-xs opacity-75 truncate max-w-[150px]">{(user as any)?.email}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
                onClick={() => window.location.href = '/api/login'}
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        {isAuthenticated && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex space-x-8">
                <div className="text-center">
                  <span className="block font-semibold">150</span>
                  <span className="text-xs opacity-75">Total Days</span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold">3</span>
                  <span className="text-xs opacity-75">Active Teams</span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold">₹74L</span>
                  <span className="text-xs opacity-75">Budget Allocated</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">
                  Next Report Due: {new Date().toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Asia/Kolkata'
                  })} IST
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}