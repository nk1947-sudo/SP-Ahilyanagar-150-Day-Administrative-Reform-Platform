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
import { Plus, IndianRupee, TrendingUp, TrendingDown, AlertTriangle, Calculator, PieChart, BarChart3, Download, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BudgetItem {
  id: number;
  category: string;
  description?: string;
  allocatedAmount: number;
  utilizedAmount: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  code: string;
  focusArea: string;
}

export default function BudgetTracking() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isCreateBudgetDialogOpen, setIsCreateBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
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

  const { data: budgetItems = [], isLoading: budgetLoading } = useQuery({
    queryKey: ["/api/budget"],
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      await apiRequest("POST", "/api/budget", budgetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      toast({
        title: "Success",
        description: "Budget item created successfully",
      });
      setIsCreateBudgetDialogOpen(false);
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
        description: "Failed to create budget item",
        variant: "destructive",
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: any) => {
      await apiRequest("PUT", `/api/budget/${id}`, budgetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      toast({
        title: "Success",
        description: "Budget item updated successfully",
      });
      setEditingBudget(null);
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
        description: "Failed to update budget item",
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

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "active":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Active</Badge>;
      case "completed":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>Completed</Badge>;
      case "cancelled":
        return <Badge className={cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTeamName = (teamId?: number) => {
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : "General";
  };

  const getUtilizationPercentage = (allocated: number, utilized: number) => {
    if (allocated === 0) return 0;
    return Math.round((utilized / allocated) * 100);
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) return { color: "text-red-600", icon: AlertTriangle };
    if (percentage >= 70) return { color: "text-yellow-600", icon: TrendingUp };
    return { color: "text-green-600", icon: TrendingUp };
  };

  // Filter budget items
  const filteredBudgetItems = budgetItems.filter((item: BudgetItem) => {
    const matchesTeam = teamFilter === "all" || item.teamId?.toString() === teamFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesTeam && matchesStatus;
  });

  // Calculate totals
  const totalAllocated = budgetItems.reduce((sum: number, item: BudgetItem) => sum + item.allocatedAmount, 0);
  const totalUtilized = budgetItems.reduce((sum: number, item: BudgetItem) => sum + item.utilizedAmount, 0);
  const overallUtilization = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

  // Group by teams
  const budgetByTeam = teams.map((team: Team) => {
    const teamItems = budgetItems.filter((item: BudgetItem) => item.teamId === team.id);
    const allocated = teamItems.reduce((sum: number, item: BudgetItem) => sum + item.allocatedAmount, 0);
    const utilized = teamItems.reduce((sum: number, item: BudgetItem) => sum + item.utilizedAmount, 0);
    return {
      team,
      allocated,
      utilized,
      utilization: allocated > 0 ? (utilized / allocated) * 100 : 0,
      items: teamItems.length,
    };
  });

  // Group by categories
  const budgetByCategory = budgetItems.reduce((acc: any, item: BudgetItem) => {
    if (!acc[item.category]) {
      acc[item.category] = { allocated: 0, utilized: 0, items: [] };
    }
    acc[item.category].allocated += item.allocatedAmount;
    acc[item.category].utilized += item.utilizedAmount;
    acc[item.category].items.push(item);
    return acc;
  }, {});

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const budgetData = {
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      allocatedAmount: parseFloat(formData.get("allocatedAmount") as string),
      utilizedAmount: parseFloat(formData.get("utilizedAmount") as string) || 0,
      teamId: formData.get("teamId") ? parseInt(formData.get("teamId") as string) : null,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      status: "active",
    };

    createBudgetMutation.mutate(budgetData);
  };

  const handleUpdateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBudget) return;

    const formData = new FormData(e.currentTarget);
    
    const budgetData = {
      id: editingBudget.id,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      allocatedAmount: parseFloat(formData.get("allocatedAmount") as string),
      utilizedAmount: parseFloat(formData.get("utilizedAmount") as string),
      teamId: formData.get("teamId") ? parseInt(formData.get("teamId") as string) : null,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      status: formData.get("status") as string,
    };

    updateBudgetMutation.mutate(budgetData);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget Tracking</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor financial allocation and utilization across the 150-day program
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">By Teams</TabsTrigger>
              <TabsTrigger value="categories">By Categories</TabsTrigger>
              <TabsTrigger value="manage">Manage Budget</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <IndianRupee className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Allocated</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAllocated)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calculator className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Utilized</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalUtilized)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilization Rate</p>
                        <p className="text-2xl font-bold text-orange-600">{overallUtilization.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalAllocated - totalUtilized)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Budget Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(totalUtilized)} of {formatCurrency(totalAllocated)} utilized
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {overallUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={overallUtilization} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>₹0</span>
                      <span>{formatCurrency(totalAllocated)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Distribution by Teams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budgetByTeam.map(({ team, allocated, utilized, utilization }) => (
                        <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(utilized)} / {formatCurrency(allocated)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">{utilization.toFixed(1)}%</div>
                            <Progress value={utilization} className="w-20 h-2 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Budget Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budgetItems.slice(0, 5).map((item: BudgetItem) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <IndianRupee className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.category}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {getTeamName(item.teamId)} • {formatCurrency(item.allocatedAmount)}
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {budgetByTeam.map(({ team, allocated, utilized, utilization, items }) => {
                  const utilizationStatus = getUtilizationStatus(utilization);
                  const StatusIcon = utilizationStatus.icon;
                  
                  return (
                    <Card key={team.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <StatusIcon className={cn("h-5 w-5", utilizationStatus.color)} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Allocated</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(allocated)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Utilized</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(utilized)}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Utilization</span>
                              <span className={cn("font-medium", utilizationStatus.color)}>{utilization.toFixed(1)}%</span>
                            </div>
                            <Progress value={utilization} className="h-2" />
                          </div>

                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {items} budget items • {formatCurrency(allocated - utilized)} remaining
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(budgetByCategory).map(([category, data]: [string, any]) => {
                  const utilization = data.allocated > 0 ? (data.utilized / data.allocated) * 100 : 0;
                  const utilizationStatus = getUtilizationStatus(utilization);
                  const StatusIcon = utilizationStatus.icon;
                  
                  return (
                    <Card key={category} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg capitalize">{category}</CardTitle>
                          <StatusIcon className={cn("h-5 w-5", utilizationStatus.color)} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Allocated</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.allocated)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Utilized</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.utilized)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Items</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{data.items.length}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Utilization</span>
                              <span className={cn("font-medium", utilizationStatus.color)}>{utilization.toFixed(1)}%</span>
                            </div>
                            <Progress value={utilization} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  {user?.role === "sp" && (
                    <Dialog open={isCreateBudgetDialogOpen} onOpenChange={setIsCreateBudgetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Budget Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <form onSubmit={handleCreateBudget}>
                          <DialogHeader>
                            <DialogTitle>Add Budget Item</DialogTitle>
                            <DialogDescription>
                              Create a new budget allocation for the program.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="category">Category</Label>
                              <Input id="category" name="category" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea id="description" name="description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="allocatedAmount">Allocated Amount (₹)</Label>
                                <Input
                                  id="allocatedAmount"
                                  name="allocatedAmount"
                                  type="number"
                                  step="0.01"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="utilizedAmount">Utilized Amount (₹)</Label>
                                <Input
                                  id="utilizedAmount"
                                  name="utilizedAmount"
                                  type="number"
                                  step="0.01"
                                  defaultValue="0"
                                />
                              </div>
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
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input id="startDate" name="startDate" type="date" />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" name="endDate" type="date" />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={createBudgetMutation.isPending}>
                              {createBudgetMutation.isPending ? "Creating..." : "Create Budget Item"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Budget Items List */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Items ({filteredBudgetItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {budgetLoading ? (
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
                  ) : filteredBudgetItems.length === 0 ? (
                    <div className="text-center py-8">
                      <IndianRupee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No budget items found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {teamFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your filters."
                          : "Start by adding your first budget item."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBudgetItems.map((item: BudgetItem) => {
                        const utilization = getUtilizationPercentage(item.allocatedAmount, item.utilizedAmount);
                        const utilizationStatus = getUtilizationStatus(utilization);
                        
                        return (
                          <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {item.category}
                                  </h3>
                                  {getStatusBadge(item.status)}
                                </div>
                                
                                {item.description && (
                                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    {item.description}
                                  </p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                  <div>
                                    <div className="text-gray-600 dark:text-gray-400">Team</div>
                                    <div className="font-medium">{getTeamName(item.teamId)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600 dark:text-gray-400">Allocated</div>
                                    <div className="font-medium">{formatCurrency(item.allocatedAmount)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600 dark:text-gray-400">Utilized</div>
                                    <div className="font-medium">{formatCurrency(item.utilizedAmount)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600 dark:text-gray-400">Remaining</div>
                                    <div className="font-medium">{formatCurrency(item.allocatedAmount - item.utilizedAmount)}</div>
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Utilization</span>
                                    <span className={cn("font-medium", utilizationStatus.color)}>
                                      {utilization}%
                                    </span>
                                  </div>
                                  <Progress value={utilization} className="h-2" />
                                </div>

                                {(item.startDate || item.endDate) && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.startDate && `Start: ${format(new Date(item.startDate), "MMM dd, yyyy")}`}
                                    {item.startDate && item.endDate && " • "}
                                    {item.endDate && `End: ${format(new Date(item.endDate), "MMM dd, yyyy")}`}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingBudget(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Budget Dialog */}
              <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
                <DialogContent className="sm:max-w-[525px]">
                  <form onSubmit={handleUpdateBudget}>
                    <DialogHeader>
                      <DialogTitle>Edit Budget Item</DialogTitle>
                      <DialogDescription>
                        Update budget allocation and utilization details.
                      </DialogDescription>
                    </DialogHeader>
                    {editingBudget && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-category">Category</Label>
                          <Input 
                            id="edit-category" 
                            name="category" 
                            defaultValue={editingBudget.category} 
                            required 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea 
                            id="edit-description" 
                            name="description" 
                            defaultValue={editingBudget.description || ""} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-allocatedAmount">Allocated Amount (₹)</Label>
                            <Input
                              id="edit-allocatedAmount"
                              name="allocatedAmount"
                              type="number"
                              step="0.01"
                              defaultValue={editingBudget.allocatedAmount}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-utilizedAmount">Utilized Amount (₹)</Label>
                            <Input
                              id="edit-utilizedAmount"
                              name="utilizedAmount"
                              type="number"
                              step="0.01"
                              defaultValue={editingBudget.utilizedAmount}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-teamId">Team</Label>
                            <Select name="teamId" defaultValue={editingBudget.teamId?.toString()}>
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
                            <Label htmlFor="edit-status">Status</Label>
                            <Select name="status" defaultValue={editingBudget.status}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-startDate">Start Date</Label>
                            <Input 
                              id="edit-startDate" 
                              name="startDate" 
                              type="date" 
                              defaultValue={editingBudget.startDate || ""} 
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-endDate">End Date</Label>
                            <Input 
                              id="edit-endDate" 
                              name="endDate" 
                              type="date" 
                              defaultValue={editingBudget.endDate || ""} 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button type="submit" disabled={updateBudgetMutation.isPending}>
                        {updateBudgetMutation.isPending ? "Updating..." : "Update Budget Item"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
