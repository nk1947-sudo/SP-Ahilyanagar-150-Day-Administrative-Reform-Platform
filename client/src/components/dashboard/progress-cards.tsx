import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, CheckCircle, IndianRupee, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressCardsProps {
  stats?: {
    overallProgress: number;
    tasksCompleted: number;
    totalTasks: number;
    budgetUtilized: number;
    budgetAllocated: number;
    teamPerformance: string;
  };
  isLoading: boolean;
}

export default function ProgressCards({ stats, isLoading }: ProgressCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const completionRate = stats?.totalTasks 
    ? ((stats.tasksCompleted / stats.totalTasks) * 100).toFixed(0)
    : "0";

  const budgetUtilizationRate = stats?.budgetAllocated
    ? ((stats.budgetUtilized / stats.budgetAllocated) * 100).toFixed(0)
    : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Overall Progress */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overall Progress
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {stats?.overallProgress || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-blue-600 h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last week</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Completed */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasks Completed
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {stats?.tasksCompleted || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600 h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>of {stats?.totalTasks || 0} total tasks ({completionRate}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Utilized */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Budget Utilized
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(stats?.budgetUtilized || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <IndianRupee className="text-orange-600 h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>of {formatCurrency(stats?.budgetAllocated || 0)} allocated ({budgetUtilizationRate}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Team Performance
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {stats?.teamPerformance || "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
              <Users className="text-indigo-600 h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Excellent rating</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
