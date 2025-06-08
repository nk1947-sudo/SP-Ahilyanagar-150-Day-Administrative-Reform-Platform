import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  BarChart3, 
  FileText, 
  IndianRupee, 
  MessageSquare, 
  Calendar,
  Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Task Management", href: "/tasks", icon: ListTodo },
  { name: "Team Collaboration", href: "/team", icon: Users },
  { name: "Progress Reports", href: "/reports", icon: BarChart3 },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Budget Tracking", href: "/budget", icon: IndianRupee },
  { name: "Feedback System", href: "/feedback", icon: MessageSquare },
  { name: "Timeline View", href: "/timeline", icon: Calendar },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
        {/* Logo and Title */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white text-lg" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">SP Ahilyanagar</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">150-Day Program</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.firstName?.charAt(0) || "U"}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || "User"
                }
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {user?.designation || "Team Member"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
