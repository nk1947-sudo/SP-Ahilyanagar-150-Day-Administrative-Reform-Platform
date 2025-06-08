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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageSquare, ThumbsUp, AlertCircle, Lightbulb, Star, TrendingUp, Filter, Search, Reply, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Feedback {
  id: number;
  type: string;
  subject: string;
  content: string;
  category?: string;
  submittedBy?: string;
  assignedTo?: string;
  status: string;
  priority: string;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function FeedbackSystem() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isSubmitFeedbackDialogOpen, setIsSubmitFeedbackDialogOpen] = useState(false);
  const [respondingFeedback, setRespondingFeedback] = useState<Feedback | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

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

  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/feedback"],
    retry: false,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      await apiRequest("POST", "/api/feedback", feedbackData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
      setIsSubmitFeedbackDialogOpen(false);
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
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const respondToFeedbackMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => {
      await apiRequest("PUT", `/api/feedback/${id}`, {
        response,
        status: "resolved",
        respondedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({
        title: "Success",
        description: "Response submitted successfully",
      });
      setRespondingFeedback(null);
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
        description: "Failed to submit response",
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case "issue":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "improvement":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "praise":
        return <ThumbsUp className="h-5 w-5 text-purple-600" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (type) {
      case "suggestion":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>Suggestion</Badge>;
      case "issue":
        return <Badge className={cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>Issue</Badge>;
      case "improvement":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Improvement</Badge>;
      case "praise":
        return <Badge className={cn(baseClasses, "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400")}>Praise</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "open":
        return <Badge className={cn(baseClasses, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400")}>Open</Badge>;
      case "in_review":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>In Review</Badge>;
      case "resolved":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Resolved</Badge>;
      case "closed":
        return <Badge className={cn(baseClasses, "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400")}>Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (priority) {
      case "high":
        return <Badge className={cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>High</Badge>;
      case "medium":
        return <Badge className={cn(baseClasses, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400")}>Medium</Badge>;
      case "low":
        return <Badge className={cn(baseClasses, "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400")}>Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getUserInitials = (userId?: string) => {
    if (userId === user?.id) return "You";
    return userId?.substring(0, 2).toUpperCase() || "U";
  };

  const handleSubmitFeedback = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const feedbackData = {
      type: formData.get("type") as string,
      subject: formData.get("subject") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
      priority: formData.get("priority") as string,
    };

    submitFeedbackMutation.mutate(feedbackData);
  };

  const handleRespondToFeedback = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!respondingFeedback) return;

    const formData = new FormData(e.currentTarget);
    const response = formData.get("response") as string;

    respondToFeedbackMutation.mutate({
      id: respondingFeedback.id,
      response,
    });
  };

  // Filter feedback
  const filteredFeedback = feedback.filter((item: Feedback) => {
    const matchesSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Calculate statistics
  const totalFeedback = feedback.length;
  const openFeedback = feedback.filter((item: Feedback) => item.status === "open").length;
  const resolvedFeedback = feedback.filter((item: Feedback) => item.status === "resolved").length;
  const myFeedback = feedback.filter((item: Feedback) => item.submittedBy === user?.id).length;

  // Group by type
  const feedbackByType = feedback.reduce((acc: any, item: Feedback) => {
    if (!acc[item.type]) acc[item.type] = 0;
    acc[item.type]++;
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback System</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Collect and manage feedback for continuous improvement in the 150-day program
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
              <TabsTrigger value="all">All Feedback</TabsTrigger>
              <TabsTrigger value="my">My Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalFeedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Items</p>
                        <p className="text-2xl font-bold text-yellow-600">{openFeedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                        <p className="text-2xl font-bold text-green-600">{resolvedFeedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Star className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Submissions</p>
                        <p className="text-2xl font-bold text-purple-600">{myFeedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Distribution by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(feedbackByType).map(([type, count]: [string, any]) => (
                      <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-center mb-2">
                          {getTypeIcon(type)}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback.slice(0, 5).map((item: Feedback) => (
                      <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">{item.subject}</h4>
                            <div className="flex items-center space-x-2">
                              {getTypeBadge(item.type)}
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {format(new Date(item.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </div>
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
                  <CardTitle>Submit New Feedback</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share your suggestions, report issues, or provide feedback for improvement
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitFeedback} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Feedback Type</Label>
                        <Select name="type" defaultValue="suggestion">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suggestion">Suggestion</SelectItem>
                            <SelectItem value="issue">Issue</SelectItem>
                            <SelectItem value="improvement">Improvement</SelectItem>
                            <SelectItem value="praise">Praise</SelectItem>
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="process">Process</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="communication">Communication</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Brief description of your feedback"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="content">Details</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Provide detailed information about your feedback, suggestions, or issues..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={submitFeedbackMutation.isPending}
                    >
                      {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search feedback..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="suggestion">Suggestion</SelectItem>
                          <SelectItem value="issue">Issue</SelectItem>
                          <SelectItem value="improvement">Improvement</SelectItem>
                          <SelectItem value="praise">Praise</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Feedback ({filteredFeedback.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {feedbackLoading ? (
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
                  ) : filteredFeedback.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No feedback found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm || typeFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all"
                          ? "Try adjusting your filters."
                          : "Be the first to submit feedback."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFeedback.map((item: Feedback) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                  {getTypeIcon(item.type)}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {item.subject}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {getTypeBadge(item.type)}
                                  {getStatusBadge(item.status)}
                                  {getPriorityBadge(item.priority)}
                                </div>
                              </div>
                              
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {item.content}
                              </p>

                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                                <div className="flex items-center space-x-4">
                                  <span>Submitted: {format(new Date(item.createdAt), "MMM dd, yyyy 'at' HH:mm")}</span>
                                  {item.category && <span>Category: {item.category}</span>}
                                </div>
                              </div>

                              {item.response && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Reply className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-400">Response</span>
                                    {item.respondedAt && (
                                      <span className="text-xs text-blue-700 dark:text-blue-500">
                                        {format(new Date(item.respondedAt), "MMM dd, yyyy 'at' HH:mm")}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-blue-800 dark:text-blue-300">{item.response}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 ml-4">
                              {item.status === "open" && user?.role === "sp" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRespondingFeedback(item)}
                                >
                                  <Reply className="h-4 w-4 mr-1" />
                                  Respond
                                </Button>
                              )}
                              <div className="flex items-center space-x-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getUserInitials(item.submittedBy)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-500">
                                  {item.submittedBy === user?.id ? "You" : "User"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Respond to Feedback Dialog */}
              <Dialog open={!!respondingFeedback} onOpenChange={() => setRespondingFeedback(null)}>
                <DialogContent className="sm:max-w-[525px]">
                  <form onSubmit={handleRespondToFeedback}>
                    <DialogHeader>
                      <DialogTitle>Respond to Feedback</DialogTitle>
                      <DialogDescription>
                        Provide a response to this feedback item.
                      </DialogDescription>
                    </DialogHeader>
                    {respondingFeedback && (
                      <div className="grid gap-4 py-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {respondingFeedback.subject}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {respondingFeedback.content}
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="response">Your Response</Label>
                          <Textarea
                            id="response"
                            name="response"
                            placeholder="Provide a detailed response to this feedback..."
                            rows={4}
                            required
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button type="submit" disabled={respondToFeedbackMutation.isPending}>
                        {respondToFeedbackMutation.isPending ? "Submitting..." : "Submit Response"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="my" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Feedback ({myFeedback})</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track the status of your submitted feedback
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback
                      .filter((item: Feedback) => item.submittedBy === user?.id)
                      .map((item: Feedback) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                  {getTypeIcon(item.type)}
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {item.subject}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  {getTypeBadge(item.type)}
                                  {getStatusBadge(item.status)}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {item.content}
                              </p>

                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Submitted: {format(new Date(item.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                              </div>

                              {item.response && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-600">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-900 dark:text-green-400">Response Received</span>
                                  </div>
                                  <p className="text-sm text-green-800 dark:text-green-300">{item.response}</p>
                                  {item.respondedAt && (
                                    <div className="text-xs text-green-700 dark:text-green-500 mt-1">
                                      Responded: {format(new Date(item.respondedAt), "MMM dd, yyyy 'at' HH:mm")}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {myFeedback === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No feedback submitted yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Share your thoughts and help improve the program.
                        </p>
                        <Button onClick={() => setIsSubmitFeedbackDialogOpen(true)}>
                          Submit Your First Feedback
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Feedback Dialog */}
          <Dialog open={isSubmitFeedbackDialogOpen} onOpenChange={setIsSubmitFeedbackDialogOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSubmitFeedback}>
                <DialogHeader>
                  <DialogTitle>Submit Feedback</DialogTitle>
                  <DialogDescription>
                    Share your suggestions, report issues, or provide feedback.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dialog-type">Type</Label>
                      <Select name="type" defaultValue="suggestion">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suggestion">Suggestion</SelectItem>
                          <SelectItem value="issue">Issue</SelectItem>
                          <SelectItem value="improvement">Improvement</SelectItem>
                          <SelectItem value="praise">Praise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dialog-priority">Priority</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dialog-category">Category</Label>
                    <Select name="category">
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="process">Process</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dialog-subject">Subject</Label>
                    <Input id="dialog-subject" name="subject" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dialog-content">Details</Label>
                    <Textarea id="dialog-content" name="content" rows={4} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitFeedbackMutation.isPending}>
                    {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
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
