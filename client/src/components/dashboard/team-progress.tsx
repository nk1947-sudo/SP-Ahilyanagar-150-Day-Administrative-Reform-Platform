import { Card, CardContent } from "@/components/ui/card";
import { Laptop, ClipboardList, Telescope } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Team {
  id: number;
  name: string;
  code: string;
  description: string;
  focusArea: string;
  leaderId?: string;
}

interface TeamProgressProps {
  teams?: Team[];
  isLoading: boolean;
}

export default function TeamProgress({ teams, isLoading }: TeamProgressProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="ml-3 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Mock progress data for teams
  const teamProgressData = {
    alpha: {
      progress: 72,
      tasks: [
        { name: "Website Development", status: "completed" },
        { name: "Aaple Sarkar Integration", status: "in_progress" },
        { name: "Mobile App Development", status: "planning" },
      ],
      leader: "IT Cell In-charge",
    },
    bravo: {
      progress: 65,
      tasks: [
        { name: "Akrutibandh Review", status: "completed" },
        { name: "Service Book Digitization", status: "in_progress" },
        { name: "iGOT Karmayogi Setup", status: "planning" },
      ],
      leader: "DySP (HQ)",
    },
    charlie: {
      progress: 58,
      tasks: [
        { name: "Security Landscape Analysis", status: "completed" },
        { name: "Strategic Framework", status: "in_progress" },
        { name: "Implementation Roadmap", status: "pending" },
      ],
      leader: "SP (Direct)",
    },
  };

  const getTeamIcon = (code: string) => {
    switch (code) {
      case "alpha":
        return <Laptop className="text-blue-600 h-6 w-6" />;
      case "bravo":
        return <ClipboardList className="text-green-600 h-6 w-6" />;
      case "charlie":
        return <Telescope className="text-orange-600 h-6 w-6" />;
      default:
        return <Laptop className="text-gray-600 h-6 w-6" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">In Progress</Badge>;
      case "planning":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">Planning</Badge>;
      case "pending":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "text-blue-600";
    if (progress >= 60) return "text-green-600";
    return "text-orange-600";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Team Progress Overview
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {["alpha", "bravo", "charlie"].map((teamCode) => {
          const team = teams?.find(t => t.code === teamCode);
          const progressData = teamProgressData[teamCode as keyof typeof teamProgressData];
          
          return (
            <Card key={teamCode} className="hover:shadow-lg transition-shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {getTeamIcon(teamCode)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Team {teamCode.charAt(0).toUpperCase() + teamCode.slice(1)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {team?.focusArea || `${teamCode} Implementation`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${getProgressColor(progressData.progress)}`}>
                      {progressData.progress}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Progress</div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {progressData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{task.name}</span>
                      {getStatusBadge(task.status)}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Team Leader: <span className="font-medium">{progressData.leader}</span>
                    </span>
                  </div>
                  <Progress 
                    value={progressData.progress} 
                    className="h-2"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
