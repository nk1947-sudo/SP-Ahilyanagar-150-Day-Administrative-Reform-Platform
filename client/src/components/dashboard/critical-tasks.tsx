import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: number;
  title: string;
  description?: string;
  teamId?: number;
  status: string;
  priority: string;
  dueDate?: string;
}

interface CriticalTasksProps {
  tasks?: Task[];
  isLoading: boolean;
}

export default function CriticalTasks({ tasks, isLoading }: CriticalTasksProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <CardContent className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  <th className="pb-3">Task</th>
                  <th className="pb-3">Team</th>
                  <th className="pb-3">Deadline</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </td>
                    <td className="py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="py-3"><Skeleton className="h-6 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTeamName = (teamId?: number) => {
    switch (teamId) {
      case 1:
        return "Team Alpha";
      case 2:
        return "Team Bravo";
      case 3:
        return "Team Charlie";
      default:
        return "General";
    }
  };

  // Mock critical tasks if none provided
  const mockTasks = [
    {
      id: 1,
      title: "Aaple Sarkar Integration Testing",
      description: "Complete integration testing with government portal",
      teamId: 1,
      status: "in_progress",
      priority: "high",
      dueDate: "2025-05-15",
    },
    {
      id: 2,
      title: "Service Book Digitization",
      description: "Complete digitization of all personnel records",
      teamId: 2,
      status: "in_progress",
      priority: "medium",
      dueDate: "2025-05-20",
    },
    {
      id: 3,
      title: "Strategic Framework Documentation",
      description: "Prepare comprehensive Vision 2047 framework",
      teamId: 3,
      status: "planning",
      priority: "high",
      dueDate: "2025-05-25",
    },
  ];

  const displayTasks = tasks && tasks.length > 0 ? tasks : mockTasks;
  const criticalTasks = displayTasks.filter(task => 
    task.priority === "critical" || task.priority === "high"
  ).slice(0, 5);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Critical Tasks & Upcoming Deadlines
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              High priority items requiring immediate attention
            </p>
          </div>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
            View All Tasks
          </Button>
        </div>
      </div>
      <CardContent className="px-6 py-4">
        {criticalTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No critical tasks at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  <th className="pb-3">Task</th>
                  <th className="pb-3">Team</th>
                  <th className="pb-3">Deadline</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {criticalTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {getTeamName(task.teamId)}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : "No deadline"}
                    </td>
                    <td className="py-3">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="py-3">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
