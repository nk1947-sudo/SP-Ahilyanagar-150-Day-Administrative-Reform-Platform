import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Upload, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: number;
  action: string;
  description: string;
  userId?: string;
  createdAt: string;
}

interface RecentActivitiesProps {
  activities?: Activity[];
  isLoading: boolean;
}

export default function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <CardContent className="px-6 py-4">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "task_completed":
      case "task_created":
        return <CheckCircle className="text-green-600" />;
      case "report_submitted":
        return <Upload className="text-blue-600" />;
      case "meeting_scheduled":
        return <Clock className="text-yellow-600" />;
      case "team_created":
        return <Users className="text-indigo-600" />;
      default:
        return <CheckCircle className="text-gray-600" />;
    }
  };

  // Mock activities if none provided
  const mockActivities = [
    {
      id: 1,
      action: "task_completed",
      description: "Website Development Phase 1 Completed",
      userId: "team_alpha",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: 2,
      action: "meeting_scheduled",
      description: "Budget Review Meeting Scheduled",
      userId: "admin_team",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
    {
      id: 3,
      action: "report_submitted",
      description: "GAD Assessment Report Submitted",
      userId: "team_bravo",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    },
    {
      id: 4,
      action: "team_created",
      description: "Team Meeting Concluded Successfully",
      userId: "all_teams",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  ];

  const displayActivities = activities && activities.length > 0 ? activities : mockActivities;

  const formatUserId = (userId?: string) => {
    if (!userId) return "System";
    
    switch (userId) {
      case "team_alpha":
        return "Team Alpha";
      case "team_bravo":
        return "Team Bravo";
      case "team_charlie":
        return "Team Charlie";
      case "admin_team":
        return "Admin Team";
      case "all_teams":
        return "All Teams";
      default:
        return "User";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activities
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Latest updates and achievements
        </p>
      </div>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {displayActivities.slice(0, 4).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {formatUserId(activity.userId)} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
