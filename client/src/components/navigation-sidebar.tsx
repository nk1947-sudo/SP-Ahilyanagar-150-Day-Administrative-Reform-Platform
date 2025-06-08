import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FileText, 
  FolderOpen, 
  IndianRupee, 
  MessageSquare, 
  Calendar,
  Target,
  TrendingUp,
  Clock
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview and analytics"
  },
  {
    title: "Task Management",
    href: "/tasks",
    icon: CheckSquare,
    description: "Track and manage tasks"
  },
  {
    title: "Team Collaboration",
    href: "/team",
    icon: Users,
    description: "Team coordination"
  },
  {
    title: "Progress Reports",
    href: "/reports",
    icon: FileText,
    description: "Daily progress tracking"
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FolderOpen,
    description: "Document repository"
  },
  {
    title: "Budget Tracking",
    href: "/budget",
    icon: IndianRupee,
    description: "Financial monitoring"
  },
  {
    title: "Feedback System",
    href: "/feedback",
    icon: MessageSquare,
    description: "Stakeholder feedback"
  },
  {
    title: "Timeline View",
    href: "/timeline",
    icon: Calendar,
    description: "150-day program timeline"
  }
];

export function NavigationSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border h-[calc(100vh-120px)] sticky top-0">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary mb-2">Program Navigation</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>150-Day Reform Program</span>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{item.title}</div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Quick Status */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium text-sm mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Program Status
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Days Elapsed</span>
              <span className="font-medium">33/150</span>
            </div>
            <div className="flex justify-between">
              <span>Overall Progress</span>
              <span className="font-medium text-primary">68%</span>
            </div>
            <div className="flex justify-between">
              <span>Active Tasks</span>
              <span className="font-medium">6</span>
            </div>
          </div>
        </div>

        {/* Next Report Timer */}
        <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-center text-xs">
            <Clock className="h-3 w-3 mr-2 text-accent" />
            <span className="text-accent font-medium">Next Report: 22:00 IST</span>
          </div>
        </div>
      </div>
    </aside>
  );
}