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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users, Laptop, ClipboardList, Telescope, Crown, User, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: number;
  name: string;
  code: string;
  description: string;
  focusArea: string;
  leaderId?: string;
  createdAt: string;
}

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  team?: string;
  designation?: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  teamId?: number;
  assignedTo?: string;
  dueDate?: string;
  progress: number;
}

export default function TeamCollaboration() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      await apiRequest("POST", "/api/teams", teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Success",
        description: "Team created successfully",
      });
      setIsCreateTeamDialogOpen(false);
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
        description: "Failed to create team",
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

  const getTeamIcon = (code: string) => {
    switch (code) {
      case "alpha":
        return <Laptop className="h-6 w-6 text-blue-600" />;
      case "bravo":
        return <ClipboardList className="h-6 w-6 text-green-600" />;
      case "charlie":
        return <Telescope className="h-6 w-6 text-orange-600" />;
      default:
        return <Users className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTeamTasks = (teamId: number) => {
    return tasks.filter((task: Task) => task.teamId === teamId);
  };

  const getTeamProgress = (teamId: number) => {
    const teamTasks = getTeamTasks(teamId);
    if (teamTasks.length === 0) return 0;
    
    const totalProgress = teamTasks.reduce((sum: number, task: Task) => sum + task.progress, 0);
    return Math.round(totalProgress / teamTasks.length);
  };

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const teamData = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      description: formData.get("description") as string,
      focusArea: formData.get("focusArea") as string,
    };

    createTeamMutation.mutate(teamData);
  };

  const getUserInitials = (user?: User) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "completed":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Completed</Badge>;
      case "in_progress":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>In Progress</Badge>;
      case "pending":
        return <Badge className={cn(baseClasses, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400")}>Pending</Badge>;
      case "overdue":
        return <Badge className={cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Mock team members data (in real app, this would come from API)
  const mockTeamMembers = {
    1: [ // Team Alpha
      { id: "1", firstName: "IT", lastName: "Cell", role: "team_leader", designation: "IT Cell In-charge" },
      { id: "2", firstName: "Public Relations", lastName: "Officer", role: "member", designation: "PRO" },
      { id: "3", firstName: "Admin", lastName: "Officer", role: "member", designation: "Admin Officer" },
    ],
    2: [ // Team Bravo
      { id: "4", firstName: "Deputy SP", lastName: "HQ", role: "team_leader", designation: "DySP (HQ)" },
      { id: "5", firstName: "Admin", lastName: "Officer", role: "member", designation: "Admin Officer" },
      { id: "6", firstName: "Training", lastName: "In-charge", role: "member", designation: "Training Officer" },
    ],
    3: [ // Team Charlie
      { id: "7", firstName: "SP", lastName: "Ahilyanagar", role: "team_leader", designation: "Superintendent of Police" },
      { id: "8", firstName: "Deputy SP", lastName: "Crime", role: "member", designation: "DySP (Crime)" },
      { id: "9", firstName: "Special Branch", lastName: "In-charge", role: "member", designation: "SB In-charge" },
    ],
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Collaboration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Coordinate with teams and track collaborative progress across the 150-day program
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Team Progress Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {teams.map((team: Team) => {
                  const teamTasks = getTeamTasks(team.id);
                  const progress = getTeamProgress(team.id);
                  const completedTasks = teamTasks.filter((task: Task) => task.status === "completed").length;
                  
                  return (
                    <Card key={team.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTeam(team)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              {getTeamIcon(team.code)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{team.name}</CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{team.focusArea}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{progress}%</div>
                            <div className="text-xs text-gray-500">Progress</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Tasks Completed</span>
                            <span className="font-medium">{completedTasks}/{teamTasks.length}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {mockTeamMembers[team.id as keyof typeof mockTeamMembers]?.length || 0} members
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teams</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Object.values(mockTeamMembers).flat().length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {tasks.filter((task: Task) => task.status === "in_progress").length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <MessageSquare className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Communications</p>
                        <p className="text-2xl font-bold text-purple-600">24</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Teams Management</h2>
                {user?.role === "sp" && (
                  <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handleCreateTeam}>
                        <DialogHeader>
                          <DialogTitle>Create New Team</DialogTitle>
                          <DialogDescription>
                            Add a new team to the 150-day program.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Team Name</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="code">Team Code</Label>
                            <Input id="code" name="code" placeholder="e.g. alpha, bravo, charlie" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="focusArea">Focus Area</Label>
                            <Input id="focusArea" name="focusArea" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={createTeamMutation.isPending}>
                            {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {teams.map((team: Team) => {
                  const teamTasks = getTeamTasks(team.id);
                  const members = mockTeamMembers[team.id as keyof typeof mockTeamMembers] || [];
                  const leader = members.find(member => member.role === "team_leader");
                  
                  return (
                    <Card key={team.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              {getTeamIcon(team.code)}
                            </div>
                            <div>
                              <CardTitle>{team.name}</CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{team.focusArea}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.description}
                          </p>
                          
                          {leader && (
                            <div className="flex items-center space-x-2">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">
                                Team Leader: {leader.firstName} {leader.lastName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Members: {members.length}</span>
                            <span className="text-gray-600 dark:text-gray-400">Tasks: {teamTasks.length}</span>
                          </div>

                          <div className="flex -space-x-2">
                            {members.slice(0, 5).map((member, index) => (
                              <Avatar key={member.id} className="border-2 border-white dark:border-gray-800">
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(member)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {members.length > 5 && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  +{members.length - 5}
                                </span>
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

            <TabsContent value="members" className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
              
              <div className="space-y-6">
                {teams.map((team: Team) => {
                  const members = mockTeamMembers[team.id as keyof typeof mockTeamMembers] || [];
                  
                  return (
                    <Card key={team.id}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            {getTeamIcon(team.code)}
                          </div>
                          <CardTitle>{team.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {getUserInitials(member)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {member.firstName} {member.lastName}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {member.designation}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {member.role === "team_leader" && (
                                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Leader
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {member.role === "team_leader" ? "Team Leader" : "Member"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="communication" className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Communication</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Communications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          team: "Team Alpha",
                          message: "Website development phase 1 completed successfully",
                          time: "2 hours ago",
                          type: "update"
                        },
                        {
                          team: "Team Bravo",
                          message: "Service book digitization meeting scheduled for tomorrow",
                          time: "4 hours ago",
                          type: "meeting"
                        },
                        {
                          team: "Team Charlie",
                          message: "Strategic framework document review in progress",
                          time: "6 hours ago",
                          type: "update"
                        },
                      ].map((comm, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-blue-600">{comm.team}</span>
                              <span className="text-xs text-gray-500">{comm.time}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {comm.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Communication Channels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teams.map((team: Team) => (
                        <div key={team.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              {getTeamIcon(team.code)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {team.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {mockTeamMembers[team.id as keyof typeof mockTeamMembers]?.length || 0} members
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
