import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextReportTime, setNextReportTime] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    let nextReport;

    if (currentHour < 8) nextReport = "08:00 hrs";
    else if (currentHour < 14) nextReport = "14:00 hrs";
    else if (currentHour < 18) nextReport = "18:00 hrs";
    else if (currentHour < 22) nextReport = "22:00 hrs";
    else nextReport = "08:00 hrs (Next Day)";

    setNextReportTime(nextReport);
  }, [currentTime]);

  // Calculate current day of 150-day program
  const startDate = new Date("2025-05-06");
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = Math.max(1, Math.min(150, daysDiff + 1));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }) + " hrs";
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-4 md:ml-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Implementation Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              150-Day Transformation Program • Day{" "}
              <span className="font-medium text-blue-600">{currentDay}</span> of 150
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Current Time Display */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium">{formatTime(currentTime)}</div>
            <div className="text-xs">Next Report: {nextReportTime}</div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Quick Actions */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Quick Report
          </Button>
        </div>
      </div>
    </header>
  );
}
