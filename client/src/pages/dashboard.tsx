import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProgressCards from "@/components/dashboard/progress-cards";
import TeamProgress from "@/components/dashboard/team-progress";
import ReportingSchedule from "@/components/dashboard/reporting-schedule";
import RecentActivities from "@/components/dashboard/recent-activities";
import CriticalTasks from "@/components/dashboard/critical-tasks";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities", 10],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Progress Overview Cards */}
          <ProgressCards 
            stats={dashboardStats} 
            isLoading={statsLoading} 
          />

          {/* Team Progress Section */}
          <div className="mb-8">
            <TeamProgress 
              teams={teams} 
              isLoading={teamsLoading} 
            />
          </div>

          {/* Daily Reporting Schedule and Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ReportingSchedule />
            <RecentActivities 
              activities={activities} 
              isLoading={activitiesLoading} 
            />
          </div>

          {/* Critical Tasks and Deadlines */}
          <CriticalTasks 
            tasks={tasks} 
            isLoading={tasksLoading} 
          />
        </main>
      </div>
    </div>
  );
}
