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
import { EGovernanceFormTemplate } from "@/components/e-governance-form-templates";
import { GADReformFormTemplate } from "@/components/gad-reform-form-templates";
import { DynamicFieldRenderer } from "@/components/dynamic-field-renderer";

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
  // Administrative Forms (Section A)
  { value: "team-formation", label: "Team Formation Form", sop: "SOP-A1", category: "Administrative" },
  { value: "progress-report", label: "Progress Report", sop: "SOP-A2", category: "Administrative" },
  { value: "meeting-minutes", label: "Meeting Minutes", sop: "SOP-A3", category: "Administrative" },
  { value: "task-assignment", label: "Task Assignment Form", sop: "SOP-A4", category: "Administrative" },
  { value: "risk-assessment", label: "Risk Assessment Form", sop: "SOP-A5", category: "Administrative" },
  { value: "budget-request", label: "Budget Request Form", sop: "SOP-A6", category: "Administrative" },
  { value: "resource-allocation", label: "Resource Allocation", sop: "SOP-A7", category: "Administrative" },
  { value: "performance-review", label: "Performance Review", sop: "SOP-A8", category: "Administrative" },
  
  // E-Governance Forms (Section C)
  { value: "aaple-sarkar-integration", label: "Aaple Sarkar Service Integration", sop: "SOP-C1", category: "E-Governance" },
  { value: "gpr-analysis", label: "GPR (Government Process Re-engineering)", sop: "SOP-C2", category: "E-Governance" },
  { value: "e-office-tracker", label: "E-Office Implementation Tracker", sop: "SOP-C3", category: "E-Governance" },
  { value: "digital-signature", label: "Digital Signature Implementation", sop: "SOP-C4", category: "E-Governance" },
  { value: "api-integration", label: "API Integration Form", sop: "SOP-C5", category: "E-Governance" },
  { value: "citizen-service", label: "Citizen Service Digitization", sop: "SOP-C6", category: "E-Governance" },
  { value: "data-migration", label: "Data Migration Plan", sop: "SOP-C7", category: "E-Governance" },
  { value: "system-integration", label: "System Integration Form", sop: "SOP-C8", category: "E-Governance" },
  
  // GAD Reform Forms (Section D)
  { value: "org-structure-review", label: "Organizational Structure Review", sop: "SOP-D1", category: "GAD Reform" },
  { value: "promotion-pending-db", label: "Promotion Pending Database", sop: "SOP-D2", category: "GAD Reform" },
  { value: "acr-digitization", label: "ACR Digitization Tracker", sop: "SOP-D3", category: "GAD Reform" }
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

const CATEGORY_COLORS = {
  "Administrative": "bg-blue-100 text-blue-800",
  "E-Governance": "bg-green-100 text-green-800", 
  "GAD Reform": "bg-purple-100 text-purple-800"
};

export default function FormsPage() {
  const [selectedFormType, setSelectedFormType] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<AdministrativeForm | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();

  // Form creation state
  const [newForm, setNewForm] = useState<{
    title: string;
    formType: string;
    description: string;
    content: any;
    priority: "low" | "medium" | "high";
    teamId: number | null;
  }>({
    title: "",
    formType: "",
    description: "",
    content: {},
    priority: "medium",
    teamId: null
  });

  // Custom field values state
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});

  // Fetch forms with filters
  const { data: forms = [], isLoading } = useQuery<AdministrativeForm[]>({
    queryKey: ["/api/forms", selectedFormType, categoryFilter, statusFilter],
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
      const response = await apiRequest("POST", "/api/forms", {
        ...formData,
        customFieldValues
      });
      return response.json();
    },
    onSuccess: async (result) => {
      // Save custom field values if form was created successfully
      if (Object.keys(customFieldValues).length > 0) {
        try {
          await apiRequest("POST", "/api/custom-field-values", {
            entityType: "administrative_form",
            entityId: result.id,
            values: Object.entries(customFieldValues).map(([fieldId, value]) => ({
              fieldDefinitionId: parseInt(fieldId),
              value: typeof value === "object" ? JSON.stringify(value) : String(value)
            }))
          });
        } catch (error) {
          console.error("Error saving custom field values:", error);
        }
      }
      
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
    setCustomFieldValues({});
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
    const formType = FORM_TYPES.find(type => type.value === form.formType);
    if (categoryFilter && categoryFilter !== "all" && formType?.category !== categoryFilter) return false;
    if (selectedFormType && selectedFormType !== "all" && form.formType !== selectedFormType) return false;
    if (statusFilter && statusFilter !== "all" && form.status !== statusFilter) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: filteredForms.length,
    draft: filteredForms.filter(f => f.status === "draft").length,
    submitted: filteredForms.filter(f => f.status === "submitted").length,
    approved: filteredForms.filter(f => f.status === "approved").length,
    rejected: filteredForms.filter(f => f.status === "rejected").length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Forms & SOPs Management</h1>
          <p className="text-muted-foreground mt-2">
            Administrative, E-Governance, and GAD Reform forms with Standard Operating Procedures for SP Ahilyanagar
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
                          {type.label} ({type.sop}) - {type.category}
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

              {/* E-Governance Form Templates */}
              {newForm.formType && FORM_TYPES.find(type => type.value === newForm.formType)?.category === "E-Governance" && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">E-Governance Form Template</Label>
                  <EGovernanceFormTemplate
                    formType={newForm.formType}
                    content={newForm.content}
                    onContentChange={(content) => setNewForm(prev => ({ ...prev, content }))}
                  />
                </div>
              )}

              {/* GAD Reform Form Templates */}
              {newForm.formType && FORM_TYPES.find(type => type.value === newForm.formType)?.category === "GAD Reform" && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">GAD Reform Form Template</Label>
                  <GADReformFormTemplate
                    formType={newForm.formType}
                    formData={newForm.content}
                    onDataChange={(content) => setNewForm(prev => ({ ...prev, content }))}
                  />
                </div>
              )}

              {/* Dynamic Custom Fields */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold">Custom Fields</Label>
                <DynamicFieldRenderer
                  section="forms"
                  onFieldChange={(fieldId, value) => {
                    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
                  }}
                  values={customFieldValues}
                  className="mt-2"
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
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Administrative">Administrative Forms</SelectItem>
                  <SelectItem value="E-Governance">E-Governance Forms</SelectItem>
                  <SelectItem value="GAD Reform">GAD Reform Forms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Form Type</Label>
              <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="All form types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Form Types</SelectItem>
                  {FORM_TYPES
                    .filter(type => categoryFilter === "all" || type.category === categoryFilter)
                    .map(type => (
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
          <CardTitle>
            {categoryFilter === "Administrative" ? "Administrative Forms" :
             categoryFilter === "E-Governance" ? "E-Governance Forms" :
             "All Forms"}
          </CardTitle>
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
                    <TableCell>
                      <div className="space-y-1">
                        <div>{getFormTypeLabel(form.formType)}</div>
                        <Badge 
                          className={`text-xs ${CATEGORY_COLORS[FORM_TYPES.find(type => type.value === form.formType)?.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS["Administrative"]}`}
                        >
                          {FORM_TYPES.find(type => type.value === form.formType)?.category || "Administrative"}
                        </Badge>
                      </div>
                    </TableCell>
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

              {/* E-Governance Form Data Display */}
              {FORM_TYPES.find(type => type.value === selectedForm.formType)?.category === "E-Governance" && selectedForm.content && Object.keys(selectedForm.content).length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Form Data</Label>
                  <div className="mt-2 space-y-4">
                    {selectedForm.formType === "aaple-sarkar-integration" && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Service Name:</strong> {selectedForm.content.serviceName || "N/A"}</div>
                        <div><strong>Service Code:</strong> {selectedForm.content.serviceCode || "N/A"}</div>
                        <div><strong>Integration Lead:</strong> {selectedForm.content.integrationLead || "N/A"}</div>
                        <div><strong>Target Go-Live:</strong> {selectedForm.content.targetGoLive || "N/A"}</div>
                        <div><strong>Delivery Mode:</strong> {selectedForm.content.deliveryMode || "N/A"}</div>
                        <div><strong>Annual Volume:</strong> {selectedForm.content.annualVolume || "N/A"}</div>
                        <div><strong>Processing Time:</strong> {selectedForm.content.processingTime || "N/A"}</div>
                        <div><strong>Revenue Generated:</strong> ₹{selectedForm.content.revenueGenerated || "N/A"}</div>
                        {selectedForm.content.painPoints && (
                          <div className="col-span-2"><strong>Pain Points:</strong> {selectedForm.content.painPoints}</div>
                        )}
                      </div>
                    )}
                    
                    {selectedForm.formType === "gpr-analysis" && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Process Name:</strong> {selectedForm.content.processName || "N/A"}</div>
                        <div><strong>Service Priority:</strong> {selectedForm.content.servicePriority || "N/A"}</div>
                        <div><strong>Total Steps:</strong> {selectedForm.content.totalSteps || "N/A"}</div>
                        <div><strong>Value-Adding Steps:</strong> {selectedForm.content.valueSteps || "N/A"}</div>
                        <div><strong>Current Processing Time:</strong> {selectedForm.content.totalTime || "N/A"} days</div>
                        <div><strong>Target Processing Time:</strong> {selectedForm.content.targetTime || "N/A"} days</div>
                        <div><strong>Expected Improvement:</strong> {selectedForm.content.improvement || "N/A"}%</div>
                        <div><strong>Touch Points:</strong> {selectedForm.content.touchPoints || "N/A"}</div>
                        {selectedForm.content.why5 && (
                          <div className="col-span-2"><strong>Root Cause:</strong> {selectedForm.content.why5}</div>
                        )}
                      </div>
                    )}
                    
                    {selectedForm.formType === "e-office-tracker" && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Reporting Week:</strong> {selectedForm.content.reportingWeek || "N/A"}</div>
                        <div><strong>Total Users:</strong> {selectedForm.content.totalUsers || "N/A"}</div>
                        <div><strong>Files Created:</strong> {selectedForm.content.filesCreated || "N/A"}</div>
                        <div><strong>Files in E-Office:</strong> {selectedForm.content.filesInEOffice || "N/A"}%</div>
                        <div><strong>Avg Processing Time:</strong> {selectedForm.content.avgProcessingTime || "N/A"} days</div>
                        <div><strong>Pending Files ({">"} 7 days):</strong> {selectedForm.content.pendingFiles || "N/A"}</div>
                        {selectedForm.content.barriers && (
                          <div className="col-span-2"><strong>Barriers:</strong> {selectedForm.content.barriers}</div>
                        )}
                        {selectedForm.content.mitigationStrategies && (
                          <div className="col-span-2"><strong>Mitigation:</strong> {selectedForm.content.mitigationStrategies}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GAD Reform Form Data Display */}
              {FORM_TYPES.find(type => type.value === selectedForm.formType)?.category === "GAD Reform" && selectedForm.content && Object.keys(selectedForm.content).length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">GAD Reform Form Data</Label>
                  <GADReformFormTemplate
                    formType={selectedForm.formType}
                    formData={selectedForm.content}
                    onDataChange={() => {}}
                    viewMode={true}
                  />
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