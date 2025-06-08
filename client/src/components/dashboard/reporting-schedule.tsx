import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ReportingSchedule() {
  const now = new Date();
  const currentHour = now.getHours();

  const reportingSchedule = [
    {
      time: "08:00 hrs",
      title: "Morning Status",
      description: "Previous day completion status",
      status: currentHour > 8 ? "completed" : currentHour === 8 ? "current" : "pending",
    },
    {
      time: "14:00 hrs",
      title: "Midday Progress",
      description: "Morning progress and afternoon targets",
      status: currentHour > 14 ? "completed" : currentHour >= 13 && currentHour <= 14 ? "current" : "pending",
    },
    {
      time: "18:00 hrs",
      title: "Evening Summary",
      description: "Day's achievements and next-day planning",
      status: currentHour > 18 ? "completed" : currentHour >= 17 && currentHour <= 18 ? "current" : "pending",
    },
    {
      time: "22:00 hrs",
      title: "Final Status",
      description: "Final status and issue escalation",
      status: currentHour > 22 || currentHour < 6 ? "completed" : currentHour >= 21 ? "current" : "pending",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "current":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>;
      case "current":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Current</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCardClasses = (status: string) => {
    const baseClasses = "p-3 rounded-lg transition-colors";
    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-50 dark:bg-green-900/10`;
      case "current":
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600`;
      default:
        return `${baseClasses} bg-gray-50 dark:bg-gray-800/50`;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Today's Reporting Schedule
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Daily status update timeline</p>
      </div>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {reportingSchedule.map((report, index) => (
            <div key={index} className={getCardClasses(report.status)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(report.status)}
                  <div className="ml-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {report.time} - {report.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {report.description}
                    </div>
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
