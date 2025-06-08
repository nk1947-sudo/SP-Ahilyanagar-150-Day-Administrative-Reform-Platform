import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, FileText, Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DailyReport {
  id: number;
  reportDate: string;
  reportTime: string;
  teamId?: number;
  submittedBy?: string;
  content: string;
  achievements?: string[];
  challenges?: string[];
  nextDayPlans?: string[];
  status: string;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  code: string;
  focusArea: string;
}

export default function ProgressReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState(false);
  const [reportTimeFilter, setReportTimeFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect to login if not authenticated
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

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      await apiRequest("POST", "/api/reports", reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "Report submitted successfully",
      });
      setIsCreateReportDialogOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get current time and determine which report should be active
  const now = new Date();
  const currentHour = now.getHours();
  const getCurrentReportTime = () => {
    if (currentHour >= 6 && currentHour < 12) return "08:00";
    if (currentHour >= 12 && currentHour < 16) return "14:00";
    if (currentHour >= 16 && currentHour < 20) return "18:00";
    return "22:00";
  };

  const reportingSchedule = [
    { time: "08:00", title: "Morning Status", description: "Previous day completion status", icon: Clock },
    { time: "14:00", title: "Midday Progress", description: "Morning progress and afternoon targets", icon: Clock },
    { time: "18:00", title: "Evening Summary", description: "Day's achievements and next-day planning", icon: Clock },
    { time: "22:00", title: "Final Status", description: "Final status and issue escalation", icon: Clock },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "submitted":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Submitted</Badge>;
      case "reviewed":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>Reviewed</Badge>;
      case "draft":
        return <Badge className={cn(baseClasses, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400")}>Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTeamName = (teamId?: number) => {
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : "General";
  };

  const handleCreateReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const reportData = {
      reportDate: formData.get("reportDate") as string,
      reportTime: formData.get("reportTime") as string,
      teamId: formData.get("teamId") ? parseInt(formData.get("teamId") as string) : null,
      content: formData.get("content") as string,
      achievements: formData.get("achievements") 
        ? (formData.get("achievements") as string).split("\n").filter(item => item.trim())
        : [],
      challenges: formData.get("challenges")
        ? (formData.get("challenges") as string).split("\n").filter(item => item.trim())
        : [],
      nextDayPlans: formData.get("nextDayPlans")
        ? (formData.get("nextDayPlans") as string).split("\n").filter(item => item.trim())
        : [],
      status: "submitted",
    };

    createReportMutation.mutate(reportData);
  };

  // Filter reports
  const filteredReports = reports.filter((report: DailyReport) => {
    const matchesTime = reportTimeFilter === "all" || report.reportTime === reportTimeFilter;
    const matchesTeam = teamFilter === "all" || report.teamId?.toString() === teamFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesDate = !selectedDate || report.reportDate === format(selectedDate, "yyyy-MM-dd");
    
    return matchesTime && matchesTeam && matchesStatus && matchesDate;
  });

  // Calculate statistics
  const todayReports = reports.filter((report: DailyReport) => 
    report.reportDate === format(new Date(), "yyyy-MM-dd")
  );
  const submittedToday = todayReports.filter((report: DailyReport) => 
    report.status === "submitted" || report.status === "reviewed"
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Submit and track daily progress reports across the 150-day program
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="submit">Submit Report</TabsTrigger>
              <TabsTrigger value="reports">All Reports</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Reports</p>
                        <p className="text-2xl font-bold text-green-600">{submittedToday}/4</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Report</p>
                        <p className="text-2xl font-bold text-orange-600">{getCurrentReportTime()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                        <p className="text-2xl font-bold text-red-600">{4 - submittedToday}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Reporting Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Reporting Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reportingSchedule.map((schedule) => {
                      const hasReport = todayReports.some(report => report.reportTime === schedule.time);
                      const isCurrentTime = getCurrentReportTime() === schedule.time;
                      
                      return (
                        <div
                          key={schedule.time}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-colors",
                            hasReport
                              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                              : isCurrentTime
                              ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-lg">{schedule.time}</span>
                            {hasReport ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isCurrentTime ? (
                              <Clock className="h-5 w-5 text-blue-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{schedule.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{schedule.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.slice(0, 5).map((report: DailyReport) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {getTeamName(report.teamId)} - {report.reportTime} Report
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(report.reportDate), "MMM dd, yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(report.status)}
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Progress Report</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Submit your progress report for the current reporting cycle
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateReport} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reportDate">Report Date</Label>
                        <Input
                          id="reportDate"
                          name="reportDate"
                          type="date"
                          defaultValue={format(new Date(), "yyyy-MM-dd")}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reportTime">Report Time</Label>
                        <Select name="reportTime" defaultValue={getCurrentReportTime()}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="08:00">08:00 - Morning Status</SelectItem>
                            <SelectItem value="14:00">14:00 - Midday Progress</SelectItem>
                            <SelectItem value="18:00">18:00 - Evening Summary</SelectItem>
                            <SelectItem value="22:00">22:00 - Final Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="teamId">Team</Label>
                        <Select name="teamId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team: Team) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="content">Report Content</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Describe the progress, activities, and updates for this reporting period..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="achievements">Achievements (one per line)</Label>
                      <Textarea
                        id="achievements"
                        name="achievements"
                        placeholder="List key achievements and completed tasks..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="challenges">Challenges (one per line)</Label>
                      <Textarea
                        id="challenges"
                        name="challenges"
                        placeholder="List any challenges or obstacles encountered..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="nextDayPlans">Next Day Plans (one per line)</Label>
                      <Textarea
                        id="nextDayPlans"
                        name="nextDayPlans"
                        placeholder="List plans and priorities for the next reporting period..."
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={createReportMutation.isPending}
                    >
                      {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex gap-4 items-center flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-64 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Select value={reportTimeFilter} onValueChange={setReportTimeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Report Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Times</SelectItem>
                          <SelectItem value="08:00">08:00</SelectItem>
                          <SelectItem value="14:00">14:00</SelectItem>
                          <SelectItem value="18:00">18:00</SelectItem>
                          <SelectItem value="22:00">22:00</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={teamFilter} onValueChange={setTeamFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teams</SelectItem>
                          {teams.map((team: Team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedDate(undefined)}>
                        Clear Filters
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports List */}
              <Card>
                <CardHeader>
                  <CardTitle>Reports ({filteredReports.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                          <div className="flex justify-between items-center">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedDate || reportTimeFilter !== "all" || teamFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your filters."
                          : "Start by submitting your first report."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredReports.map((report: DailyReport) => (
                        <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {getTeamName(report.teamId)} - {report.reportTime} Report
                                </h3>
                                {getStatusBadge(report.status)}
                              </div>
                              
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Date: {format(new Date(report.reportDate), "MMM dd, yyyy")} • 
                                Submitted: {format(new Date(report.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                              </div>

                              <p className="text-gray-700 dark:text-gray-300 mb-3">
                                {report.content}
                              </p>

                              {report.achievements && report.achievements.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Achievements:</h4>
                                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                    {report.achievements.map((achievement, index) => (
                                      <li key={index}>{achievement}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.challenges && report.challenges.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-1">Challenges:</h4>
                                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                    {report.challenges.map((challenge, index) => (
                                      <li key={index}>{challenge}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.nextDayPlans && report.nextDayPlans.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">Next Day Plans:</h4>
                                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                    {report.nextDayPlans.map((plan, index) => (
                                      <li key={index}>{plan}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 ml-4">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                View Details
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Reporting Schedule</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Four daily reporting cycles to track progress throughout the day
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportingSchedule.map((schedule) => (
                      <div key={schedule.time} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <schedule.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {schedule.time} - {schedule.title}
                            </h3>
                            <Badge variant="outline">{schedule.time}</Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {schedule.description}
                          </p>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Expected content: Progress updates, achievements, challenges, and next steps
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
