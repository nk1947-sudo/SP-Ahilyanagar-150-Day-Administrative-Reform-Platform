import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle, Clock, AlertCircle, Target, Users, Laptop, ClipboardList, Telescope, Filter, Download } from "lucide-react";
import { format, addDays, differenceInDays, isAfter, isBefore, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  description?: string;
  teamId?: number;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  code: string;
  focusArea: string;
}

interface TimelinePhase {
  name: string;
  startDate: Date;
  endDate: Date;
  description: string;
  color: string;
  milestones: TimelineMilestone[];
}

interface TimelineMilestone {
  id: string;
  title: string;
  date: Date;
  description: string;
  team?: string;
  status: "completed" | "in_progress" | "upcoming" | "overdue";
  progress?: number;
}

export default function TimelineView() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [viewMode, setViewMode] = useState("timeline");

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

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Program dates
  const programStartDate = new Date("2025-05-06");
  const programEndDate = new Date("2025-10-02");
  const today = new Date();
  const daysPassed = Math.max(0, differenceInDays(today, programStartDate));
  const totalDays = differenceInDays(programEndDate, programStartDate);
  const overallProgress = Math.min(100, (daysPassed / totalDays) * 100);

  // Define program phases
  const phases: TimelinePhase[] = [
    {
      name: "Emergency Foundation Phase",
      startDate: programStartDate,
      endDate: addDays(programStartDate, 7),
      description: "Initial setup, team formation, and emergency protocols",
      color: "bg-red-500",
      milestones: [
        {
          id: "foundation-1",
          title: "SP's Emergency Meeting",
          date: programStartDate,
          description: "All-hands emergency meeting and team formation",
          team: "All Teams",
          status: "completed",
          progress: 100,
        },
        {
          id: "foundation-2",
          title: "Command Structure Activation",
          date: addDays(programStartDate, 1),
          description: "Setup command & control room, reporting protocols",
          team: "All Teams",
          status: "completed",
          progress: 100,
        },
        {
          id: "foundation-3",
          title: "Initial Assessment Complete",
          date: addDays(programStartDate, 7),
          description: "Complete initial assessment of all focus areas",
          team: "All Teams",
          status: "completed",
          progress: 100,
        },
      ],
    },
    {
      name: "Deep Dive Assessment Phase",
      startDate: addDays(programStartDate, 8),
      endDate: addDays(programStartDate, 30),
      description: "Detailed analysis and vendor engagement",
      color: "bg-orange-500",
      milestones: [
        {
          id: "assessment-1",
          title: "Vendor Selection Complete",
          date: addDays(programStartDate, 15),
          description: "e-Governance vendor selection and contracts",
          team: "Team Alpha",
          status: "completed",
          progress: 100,
        },
        {
          id: "assessment-2",
          title: "GAD Reform Gap Analysis",
          date: addDays(programStartDate, 20),
          description: "Complete gap analysis for administrative reforms",
          team: "Team Bravo",
          status: "completed",
          progress: 100,
        },
        {
          id: "assessment-3",
          title: "Vision 2047 Framework Draft",
          date: addDays(programStartDate, 25),
          description: "Initial strategic framework documentation",
          team: "Team Charlie",
          status: "in_progress",
          progress: 75,
        },
      ],
    },
    {
      name: "Core Implementation Phase",
      startDate: addDays(programStartDate, 31),
      endDate: addDays(programStartDate, 120),
      description: "Primary development and implementation activities",
      color: "bg-blue-500",
      milestones: [
        {
          id: "implementation-1",
          title: "Website Development Complete",
          date: addDays(programStartDate, 45),
          description: "New police website with accessibility compliance",
          team: "Team Alpha",
          status: "completed",
          progress: 100,
        },
        {
          id: "implementation-2",
          title: "Aaple Sarkar Integration",
          date: addDays(programStartDate, 60),
          description: "Integration with government portal services",
          team: "Team Alpha",
          status: "in_progress",
          progress: 60,
        },
        {
          id: "implementation-3",
          title: "Service Book Digitization",
          date: addDays(programStartDate, 75),
          description: "Complete digitization of personnel records",
          team: "Team Bravo",
          status: "in_progress",
          progress: 45,
        },
        {
          id: "implementation-4",
          title: "Mobile App Development",
          date: addDays(programStartDate, 90),
          description: "Citizen services mobile application",
          team: "Team Alpha",
          status: "upcoming",
          progress: 15,
        },
        {
          id: "implementation-5",
          title: "iGOT Karmayogi Setup",
          date: addDays(programStartDate, 105),
          description: "Training platform implementation",
          team: "Team Bravo",
          status: "upcoming",
          progress: 10,
        },
      ],
    },
    {
      name: "Testing & Refinement Phase",
      startDate: addDays(programStartDate, 121),
      endDate: addDays(programStartDate, 140),
      description: "Testing, bug fixes, and performance optimization",
      color: "bg-purple-500",
      milestones: [
        {
          id: "testing-1",
          title: "System Integration Testing",
          date: addDays(programStartDate, 125),
          description: "Complete testing of all integrated systems",
          team: "Team Alpha",
          status: "upcoming",
          progress: 0,
        },
        {
          id: "testing-2",
          title: "User Acceptance Testing",
          date: addDays(programStartDate, 135),
          description: "Stakeholder testing and feedback incorporation",
          team: "All Teams",
          status: "upcoming",
          progress: 0,
        },
      ],
    },
    {
      name: "Final Evaluation Phase",
      startDate: addDays(programStartDate, 141),
      endDate: programEndDate,
      description: "Third-party evaluation and final documentation",
      color: "bg-green-500",
      milestones: [
        {
          id: "evaluation-1",
          title: "Third-Party Assessment",
          date: addDays(programStartDate, 145),
          description: "External evaluation of all deliverables",
          team: "All Teams",
          status: "upcoming",
          progress: 0,
        },
        {
          id: "evaluation-2",
          title: "Program Completion",
          date: programEndDate,
          description: "Final documentation and handover",
          team: "All Teams",
          status: "upcoming",
          progress: 0,
        },
      ],
    },
  ];

  const getMilestoneStatus = (milestone: TimelineMilestone) => {
    if (milestone.status === "completed") return milestone.status;
    if (isAfter(today, milestone.date)) return "overdue";
    if (isToday(milestone.date) || (milestone.status === "in_progress")) return "in_progress";
    return "upcoming";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "completed":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Completed</Badge>;
      case "in_progress":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>In Progress</Badge>;
      case "overdue":
        return <Badge className={cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>Overdue</Badge>;
      case "upcoming":
        return <Badge className={cn(baseClasses, "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400")}>Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTeamIcon = (code: string) => {
    switch (code) {
      case "alpha":
        return <Laptop className="h-5 w-5 text-blue-600" />;
      case "bravo":
        return <ClipboardList className="h-5 w-5 text-green-600" />;
      case "charlie":
        return <Telescope className="h-5 w-5 text-orange-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  // Filter milestones based on selected filters
  const filteredMilestones = phases.reduce((acc: TimelineMilestone[], phase) => {
    if (selectedPhase !== "all" && phase.name !== selectedPhase) return acc;
    
    const phaseMilestones = phase.milestones.filter(milestone => {
      if (selectedTeam === "all") return true;
      const team = teams.find((t: Team) => t.name === milestone.team);
      return team?.code === selectedTeam;
    });
    
    return [...acc, ...phaseMilestones];
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timeline View</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Visualize the entire 150-day program timeline with phases and milestones
            </p>
          </div>

          {/* Program Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>150-Day Program Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Start Date</div>
                    <div className="font-medium">{format(programStartDate, "MMM dd, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">End Date</div>
                    <div className="font-medium">{format(programEndDate, "MMM dd, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Days Elapsed</div>
                    <div className="font-medium">{daysPassed} of {totalDays}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Overall Progress</div>
                    <div className="font-medium">{overallProgress.toFixed(1)}%</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Program Timeline</span>
                    <span className="font-medium">{overallProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="phases">Phases View</TabsTrigger>
                <TabsTrigger value="milestones">Milestones View</TabsTrigger>
              </TabsList>

              <div className="flex gap-4 items-center">
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phases.map((phase) => (
                      <SelectItem key={phase.name} value={phase.name}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team: Team) => (
                      <SelectItem key={team.id} value={team.code}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Program Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                    
                    <div className="space-y-8">
                      {phases.map((phase, phaseIndex) => (
                        <div key={phase.name} className="relative">
                          {/* Phase header */}
                          <div className="flex items-center space-x-4 mb-4">
                            <div className={cn("w-4 h-4 rounded-full", phase.color, "relative z-10")}></div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {phase.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {format(phase.startDate, "MMM dd")} - {format(phase.endDate, "MMM dd, yyyy")} • {phase.description}
                              </p>
                            </div>
                          </div>

                          {/* Phase milestones */}
                          <div className="ml-12 space-y-4">
                            {phase.milestones
                              .filter(milestone => selectedTeam === "all" || milestone.team?.includes(selectedTeam))
                              .map((milestone) => {
                                const status = getMilestoneStatus(milestone);
                                return (
                                  <div key={milestone.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex-shrink-0 mt-1">
                                      {getStatusIcon(status)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                          {milestone.title}
                                        </h4>
                                        <div className="flex items-center space-x-2">
                                          {getStatusBadge(status)}
                                          <span className="text-xs text-gray-500">
                                            {format(milestone.date, "MMM dd")}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {milestone.description}
                                      </p>
                                      {milestone.team && (
                                        <div className="flex items-center space-x-1 mt-2">
                                          <Users className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">{milestone.team}</span>
                                        </div>
                                      )}
                                      {milestone.progress !== undefined && milestone.progress > 0 && (
                                        <div className="mt-2">
                                          <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                            <span className="font-medium">{milestone.progress}%</span>
                                          </div>
                                          <Progress value={milestone.progress} className="h-1.5" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="phases" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {phases.map((phase) => {
                  const phaseProgress = phase.milestones.reduce((acc, milestone) => 
                    acc + (milestone.progress || 0), 0) / phase.milestones.length;
                  const completedMilestones = phase.milestones.filter(m => 
                    getMilestoneStatus(m) === "completed").length;
                  
                  const isCurrentPhase = today >= phase.startDate && today <= phase.endDate;
                  
                  return (
                    <Card key={phase.name} className={cn(
                      "hover:shadow-lg transition-shadow",
                      isCurrentPhase && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10"
                    )}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn("w-4 h-4 rounded-full", phase.color)}></div>
                            <CardTitle className="text-lg">{phase.name}</CardTitle>
                          </div>
                          {isCurrentPhase && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              Current Phase
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {phase.description}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Duration</div>
                              <div className="font-medium">
                                {format(phase.startDate, "MMM dd")} - {format(phase.endDate, "MMM dd")}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Milestones</div>
                              <div className="font-medium">
                                {completedMilestones}/{phase.milestones.length} completed
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Phase Progress</span>
                              <span className="font-medium">{phaseProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={phaseProgress} className="h-2" />
                          </div>

                          <div className="space-y-2">
                            {phase.milestones.slice(0, 3).map((milestone) => {
                              const status = getMilestoneStatus(milestone);
                              return (
                                <div key={milestone.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(status)}
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {milestone.title}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {format(milestone.date, "MMM dd")}
                                  </span>
                                </div>
                              );
                            })}
                            {phase.milestones.length > 3 && (
                              <div className="text-xs text-gray-500 text-center pt-1">
                                +{phase.milestones.length - 3} more milestones
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Milestones ({filteredMilestones.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredMilestones.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No milestones found</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your filters to see more milestones.
                        </p>
                      </div>
                    ) : (
                      filteredMilestones
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map((milestone) => {
                          const status = getMilestoneStatus(milestone);
                          const team = teams.find((t: Team) => t.name === milestone.team);
                          
                          return (
                            <div key={milestone.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(status)}
                                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {milestone.title}
                                      </h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {getStatusBadge(status)}
                                      {team && (
                                        <Badge variant="outline" className="flex items-center space-x-1">
                                          {getTeamIcon(team.code)}
                                          <span>{team.name}</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    {milestone.description}
                                  </p>

                                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Due: {format(milestone.date, "MMM dd, yyyy")}</span>
                                      </div>
                                      {milestone.team && (
                                        <div className="flex items-center space-x-1">
                                          <Users className="h-4 w-4" />
                                          <span>{milestone.team}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {milestone.progress !== undefined && milestone.progress > 0 && (
                                    <div>
                                      <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                        <span className="font-medium">{milestone.progress}%</span>
                                      </div>
                                      <Progress value={milestone.progress} className="h-2" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
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
