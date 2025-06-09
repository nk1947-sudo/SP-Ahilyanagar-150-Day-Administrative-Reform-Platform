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
import { Plus, Search, Filter, Edit2, Trash2, Calendar, User, Target, AlertCircle, Upload, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  description?: string;
  teamId?: number;
  assignedTo?: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  progress: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: number;
  name: string;
  code: string;
  description: string;
  focusArea: string;
}

export default function TaskManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("details");

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

  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      await apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setIsCreateDialogOpen(false);
      setAttachments([]);
      setActiveTab("details");
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
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: any) => {
      await apiRequest("PUT", `/api/tasks/${id}`, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setEditingTask(null);
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
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: async ({ taskId, assignmentData }: any) => {
      await apiRequest("POST", `/api/tasks/${taskId}/assign`, assignmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task assigned successfully",
      });
      setIsAssignDialogOpen(false);
      setAssigningTask(null);
      setAttachments([]);
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
        description: "Failed to assign task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
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
        description: "Failed to delete task",
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

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesTeam = teamFilter === "all" || task.teamId?.toString() === teamFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTeam;
  });

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

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (priority) {
      case "critical":
        return <Badge className={cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>Critical</Badge>;
      case "high":
        return <Badge className={cn(baseClasses, "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400")}>High</Badge>;
      case "medium":
        return <Badge className={cn(baseClasses, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400")}>Medium</Badge>;
      case "low":
        return <Badge className={cn(baseClasses, "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400")}>Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTeamName = (teamId?: number) => {
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : "Unassigned";
  };

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const taskData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      teamId: formData.get("teamId") ? parseInt(formData.get("teamId") as string) : null,
      priority: formData.get("priority") as string,
      status: "pending",
      startDate: formData.get("startDate") as string,
      dueDate: formData.get("dueDate") as string,
      progress: 0,
      tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map(tag => tag.trim()) : [],
      attachments: attachments,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const newAttachment = {
        id: Date.now() + Math.random(),
        title: file.name,
        description: `Uploaded file: ${file.name}`,
        filePath: `/uploads/${file.name}`,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments(prev => [...prev, newAttachment]);
    });
    
    // Clear the input
    e.target.value = '';
  };

  const removeAttachment = (id: number) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpdateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    const formData = new FormData(e.currentTarget);
    
    const taskData = {
      id: editingTask.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      teamId: formData.get("teamId") ? parseInt(formData.get("teamId") as string) : null,
      priority: formData.get("priority") as string,
      status: formData.get("status") as string,
      startDate: formData.get("startDate") as string,
      dueDate: formData.get("dueDate") as string,
      progress: parseInt(formData.get("progress") as string),
      tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map(tag => tag.trim()) : [],
    };

    updateTaskMutation.mutate(taskData);
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: Task) => task.status === "completed").length;
  const inProgressTasks = tasks.filter((task: Task) => task.status === "in_progress").length;
  const overdueTasks = tasks.filter((task: Task) => task.status === "overdue").length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create, assign, and track tasks across all teams in the 150-day program
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 gap-4 items-center">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
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
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden">
                    <form onSubmit={handleCreateTask}>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                          Add a new task to track progress in the 150-day program.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="details">Task Details</TabsTrigger>
                          <TabsTrigger value="attachments">
                            Attachments ({attachments.length})
                          </TabsTrigger>
                        </TabsList>
                        
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          <TabsContent value="details" className="space-y-4 mt-4">
                            <div className="grid gap-2">
                              <Label htmlFor="title">Title</Label>
                              <Input id="title" name="title" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea id="description" name="description" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="teamId">Team</Label>
                                <Select name="teamId">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(teams as Team[]).map((team: Team) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select name="priority" defaultValue="medium">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input id="startDate" name="startDate" type="date" />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input id="dueDate" name="dueDate" type="date" />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="tags">Tags (comma separated)</Label>
                              <Input id="tags" name="tags" placeholder="e.g. urgent, development, testing" />
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="attachments" className="space-y-4 mt-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                              <div className="text-center">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  Upload Documents
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                  Select multiple files to attach to this task
                                </p>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="file-upload"
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.png,.xlsx,.ppt,.pptx"
                                />
                                <Button 
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose Files
                                </Button>
                              </div>
                            </div>
                            
                            {attachments.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Attached Files ({attachments.length})
                                </h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                  {attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-white">
                                            {attachment.title}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeAttachment(attachment.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TabsContent>
                        </div>
                      </Tabs>
                      
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={createTaskMutation.isPending}>
                          {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
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
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || teamFilter !== "all"
                      ? "Try adjusting your filters or search terms."
                      : "Get started by creating your first task."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task: Task) => (
                    <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {task.title}
                            </h3>
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{getTeamName(task.teamId)}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                              </div>
                            )}
                          </div>

                          {task.progress > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-medium">{task.progress}%</span>
                              </div>
                              <Progress value={task.progress} className="h-2" />
                            </div>
                          )}

                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Only show assign button for senior officers */}
                          {user && ['sp', 'dysp', 'pi', 'team_lead'].includes(user.role || 'member') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssigningTask(task);
                                setIsAssignDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Task Dialog */}
          <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleUpdateTask}>
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                  <DialogDescription>
                    Update task details and progress.
                  </DialogDescription>
                </DialogHeader>
                {editingTask && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input 
                        id="edit-title" 
                        name="title" 
                        defaultValue={editingTask.title} 
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea 
                        id="edit-description" 
                        name="description" 
                        defaultValue={editingTask.description || ""} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-teamId">Team</Label>
                        <Select name="teamId" defaultValue={editingTask.teamId?.toString()}>
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
                      <div className="grid gap-2">
                        <Label htmlFor="edit-priority">Priority</Label>
                        <Select name="priority" defaultValue={editingTask.priority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select name="status" defaultValue={editingTask.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-progress">Progress (%)</Label>
                        <Input 
                          id="edit-progress" 
                          name="progress" 
                          type="number" 
                          min="0" 
                          max="100" 
                          defaultValue={editingTask.progress} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-startDate">Start Date</Label>
                        <Input 
                          id="edit-startDate" 
                          name="startDate" 
                          type="date" 
                          defaultValue={editingTask.startDate || ""} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-dueDate">Due Date</Label>
                        <Input 
                          id="edit-dueDate" 
                          name="dueDate" 
                          type="date" 
                          defaultValue={editingTask.dueDate || ""} 
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                      <Input 
                        id="edit-tags" 
                        name="tags" 
                        defaultValue={editingTask.tags?.join(", ") || ""} 
                        placeholder="e.g. urgent, development, testing" 
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={updateTaskMutation.isPending}>
                    {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Task Assignment Dialog */}
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const assignmentData = {
                  assignedTo: formData.get('assignedTo'),
                  priority: formData.get('priority'),
                  dueDate: formData.get('dueDate'),
                  attachments: attachments
                };
                assignTaskMutation.mutate({ taskId: assigningTask?.id, assignmentData });
              }}>
                <DialogHeader>
                  <DialogTitle>Assign Task</DialogTitle>
                  <DialogDescription>
                    Assign "{assigningTask?.title}" to a team member with optional document attachments.
                  </DialogDescription>
                </DialogHeader>
                {assigningTask && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="assignedTo">Assign To (User ID)</Label>
                      <Input 
                        id="assignedTo" 
                        name="assignedTo" 
                        placeholder="Enter user ID or email" 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="assign-priority">Priority</Label>
                        <Select name="priority" defaultValue={assigningTask.priority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="assign-dueDate">Due Date</Label>
                        <Input 
                          id="assign-dueDate" 
                          name="dueDate" 
                          type="date" 
                          defaultValue={assigningTask.dueDate || ""} 
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Document Attachments</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Simulate file attachment
                            const newAttachment = {
                              title: `Attachment ${attachments.length + 1}`,
                              description: "Task related document",
                              filePath: `/documents/task_${assigningTask.id}_attachment_${Date.now()}.pdf`,
                              fileSize: Math.floor(Math.random() * 1000000) + 100000
                            };
                            setAttachments([...attachments, newAttachment]);
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Document Attachment
                        </Button>
                        {attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{attachment.title}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAttachments(attachments.filter((_, i) => i !== index));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Only senior officers (SP, DYSP, PI, Team Lead) can assign tasks with attachments.
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={assignTaskMutation.isPending}>
                    {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
