import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText, Clock, CheckCircle, XCircle, Edit, Trash2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface AdministrativeForm {
  id: number;
  title: string;
  formType: string;
  description: string | null;
  content: any;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedBy: string;
  submittedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
  sopReference: string;
  teamId: number | null;
  priority: "low" | "medium" | "high";
  createdAt: Date | null;
  updatedAt: Date | null;
}

const FORM_TYPES = [
  { value: "team-formation", label: "Team Formation Form", sop: "SOP-A1" },
  { value: "progress-report", label: "Progress Report", sop: "SOP-A2" },
  { value: "meeting-minutes", label: "Meeting Minutes", sop: "SOP-A3" },
  { value: "task-assignment", label: "Task Assignment Form", sop: "SOP-A4" },
  { value: "risk-assessment", label: "Risk Assessment Form", sop: "SOP-A5" },
  { value: "budget-request", label: "Budget Request Form", sop: "SOP-A6" },
  { value: "resource-allocation", label: "Resource Allocation", sop: "SOP-A7" },
  { value: "performance-review", label: "Performance Review", sop: "SOP-A8" }
];

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800", 
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800"
};

export default function FormsPage() {
  const [selectedFormType, setSelectedFormType] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<AdministrativeForm | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();

  // Form creation state
  const [newForm, setNewForm] = useState({
    title: "",
    formType: "",
    description: "",
    content: {},
    priority: "medium" as const,
    teamId: null as number | null
  });

  // Fetch forms with filters
  const { data: forms = [], isLoading } = useQuery<AdministrativeForm[]>({
    queryKey: ["/api/forms", selectedFormType, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFormType && selectedFormType !== "all") params.append("formType", selectedFormType);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`/api/forms?${params}`);
      if (!response.ok) throw new Error("Failed to fetch forms");
      return response.json();
    }
  });

  // Fetch teams for dropdown
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    }
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData: typeof newForm) => {
      const response = await apiRequest("POST", "/api/forms", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Administrative form created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Approve/Reject mutations
  const approveFormMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: number; reviewNotes?: string }) => {
      await apiRequest("POST", `/api/forms/${id}/approve`, { reviewNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form approved successfully"
      });
    }
  });

  const rejectFormMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: number; rejectionReason: string }) => {
      await apiRequest("POST", `/api/forms/${id}/reject`, { rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success", 
        description: "Form rejected successfully"
      });
    }
  });

  const resetForm = () => {
    setNewForm({
      title: "",
      formType: "",
      description: "",
      content: {},
      priority: "medium",
      teamId: null
    });
  };

  const handleCreateForm = () => {
    if (!newForm.formType || !newForm.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    createFormMutation.mutate(newForm);
  };

  const handleViewForm = (form: AdministrativeForm) => {
    setSelectedForm(form);
    setIsViewModalOpen(true);
  };

  const getFormTypeLabel = (type: string) => {
    return FORM_TYPES.find(ft => ft.value === type)?.label || type;
  };

  const getSopReference = (type: string) => {
    return FORM_TYPES.find(ft => ft.value === type)?.sop || "SOP-A0";
  };

  const filteredForms = forms.filter(form => {
    if (selectedFormType && selectedFormType !== "all" && form.formType !== selectedFormType) return false;
    if (statusFilter && statusFilter !== "all" && form.status !== statusFilter) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: forms.length,
    draft: forms.filter(f => f.status === "draft").length,
    submitted: forms.filter(f => f.status === "submitted").length,
    approved: forms.filter(f => f.status === "approved").length,
    rejected: forms.filter(f => f.status === "rejected").length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Administrative Forms & SOPs</h1>
          <p className="text-muted-foreground mt-2">
            Manage administrative forms and Standard Operating Procedures for SP Ahilyanagar
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Administrative Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-type">Form Type *</Label>
                  <Select value={newForm.formType} onValueChange={(value) => 
                    setNewForm(prev => ({ ...prev, formType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select form type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} ({type.sop})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newForm.priority} onValueChange={(value: "low" | "medium" | "high") => 
                    setNewForm(prev => ({ ...prev, priority: value }))
                  }>
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
              
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newForm.title}
                  onChange={(e) => setNewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter form title"
                />
              </div>

              <div>
                <Label htmlFor="team">Assigned Team</Label>
                <Select value={newForm.teamId?.toString() || ""} onValueChange={(value) => 
                  setNewForm(prev => ({ ...prev, teamId: value ? parseInt(value) : null }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No team assigned</SelectItem>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newForm.description}
                  onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter form description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateForm} disabled={createFormMutation.isPending}>
                  {createFormMutation.isPending ? "Creating..." : "Create Form"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.submitted}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label>Form Type</Label>
              <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="All form types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Form Types</SelectItem>
                  {FORM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Forms</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>SOP Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell>{getFormTypeLabel(form.formType)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{form.sopReference}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[form.status]}>
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[form.priority]}>
                        {form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {form.submittedAt ? format(new Date(form.submittedAt), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewForm(form)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {form.status === "submitted" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveFormMutation.mutate({ id: form.id })}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectFormMutation.mutate({ 
                                id: form.id, 
                                rejectionReason: "Form requires revision" 
                              })}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {form.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFormMutation.mutate(form.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Form Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Form Details</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <p className="font-medium">{selectedForm.title}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{getFormTypeLabel(selectedForm.formType)}</p>
                </div>
                <div>
                  <Label>SOP Reference</Label>
                  <Badge variant="outline">{selectedForm.sopReference}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={STATUS_COLORS[selectedForm.status]}>
                    {selectedForm.status.charAt(0).toUpperCase() + selectedForm.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={PRIORITY_COLORS[selectedForm.priority]}>
                    {selectedForm.priority.charAt(0).toUpperCase() + selectedForm.priority.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p>{selectedForm.submittedAt ? format(new Date(selectedForm.submittedAt), "PPp") : "Not submitted"}</p>
                </div>
              </div>
              
              {selectedForm.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedForm.description}</p>
                </div>
              )}

              {selectedForm.reviewNotes && (
                <div>
                  <Label>Review Notes</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedForm.reviewNotes}</p>
                </div>
              )}

              {selectedForm.rejectionReason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <p className="mt-1 text-red-600 whitespace-pre-wrap">{selectedForm.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}