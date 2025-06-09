import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Settings, Database, Globe, Users, FileText } from "lucide-react";
import type { CustomFieldDefinition } from "@shared/schema";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select Dropdown" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
  { value: "file", label: "File Upload" },
  { value: "url", label: "URL" },
];

const SECTIONS = [
  { value: "administrative", label: "Administrative Forms", icon: FileText },
  { value: "e-governance", label: "E-Governance Forms", icon: Globe },
  { value: "gad-reform", label: "GAD Reform Forms", icon: Users },
  { value: "tasks", label: "Task Management", icon: Settings },
  { value: "documents", label: "Document Management", icon: Database },
];

interface FieldFormData {
  name: string;
  label: string;
  fieldType: string;
  section: string;
  description: string;
  placeholder: string;
  defaultValue: string;
  validation: string;
  options: string;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
}

const defaultFormData: FieldFormData = {
  name: "",
  label: "",
  fieldType: "text",
  section: "administrative",
  description: "",
  placeholder: "",
  defaultValue: "",
  validation: "",
  options: "",
  isRequired: false,
  isActive: true,
  displayOrder: 0,
};

export default function MasterFields() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(defaultFormData);
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const { toast } = useToast();

  // Fetch custom fields
  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ["/api/custom-fields", selectedSection === "all" ? undefined : selectedSection],
    queryFn: () => apiRequest("GET", `/api/custom-fields${selectedSection !== "all" ? `?section=${selectedSection}` : ""}`).then(res => res.json()),
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData) => {
      const response = await apiRequest("POST", "/api/custom-fields", {
        ...data,
        options: data.options ? data.options.split("\n").filter(Boolean) : null,
        validation: data.validation || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      setIsCreateOpen(false);
      setFormData(defaultFormData);
      toast({
        title: "Success",
        description: "Custom field created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FieldFormData> }) => {
      const response = await apiRequest("PUT", `/api/custom-fields/${id}`, {
        ...data,
        options: data.options ? data.options.split("\n").filter(Boolean) : null,
        validation: data.validation || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      setEditingField(null);
      setFormData(defaultFormData);
      toast({
        title: "Success",
        description: "Custom field updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/custom-fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({
        title: "Success",
        description: "Custom field deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingField) {
      updateFieldMutation.mutate({ id: editingField.id, data: formData });
    } else {
      createFieldMutation.mutate(formData);
    }
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      section: field.section,
      description: field.description || "",
      placeholder: field.placeholder || "",
      defaultValue: field.defaultValue || "",
      validation: field.validation || "",
      options: Array.isArray(field.options) ? field.options.join("\n") : "",
      isRequired: field.isRequired,
      isActive: field.isActive,
      displayOrder: field.displayOrder,
    });
    setIsCreateOpen(true);
  };

  const handleCancel = () => {
    setIsCreateOpen(false);
    setEditingField(null);
    setFormData(defaultFormData);
  };

  const getSectionIcon = (section: string) => {
    const sectionConfig = SECTIONS.find(s => s.value === section);
    if (!sectionConfig) return FileText;
    return sectionConfig.icon;
  };

  const getSectionLabel = (section: string) => {
    const sectionConfig = SECTIONS.find(s => s.value === section);
    return sectionConfig?.label || section;
  };

  const getFieldTypeLabel = (fieldType: string) => {
    const typeConfig = FIELD_TYPES.find(t => t.value === fieldType);
    return typeConfig?.label || fieldType;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Master Field Console</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage custom fields for all platform sections
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingField(null); setFormData(defaultFormData); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingField ? "Edit Custom Field" : "Create Custom Field"}</DialogTitle>
              <DialogDescription>
                {editingField ? "Update the custom field configuration" : "Configure a new custom field for dynamic form generation"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Field Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="field_name (lowercase, underscores)"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="label">Display Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Field Label"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fieldType">Field Type</Label>
                  <Select value={formData.fieldType} onValueChange={(value) => setFormData({ ...formData, fieldType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Field description for users"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    placeholder="Input placeholder text"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultValue">Default Value</Label>
                  <Input
                    id="defaultValue"
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    placeholder="Default field value"
                  />
                </div>
              </div>

              {(formData.fieldType === "select" || formData.fieldType === "multiselect" || formData.fieldType === "radio") && (
                <div>
                  <Label htmlFor="options">Options (one per line)</Label>
                  <Textarea
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="validation">Validation Rules (JSON)</Label>
                <Textarea
                  id="validation"
                  value={formData.validation}
                  onChange={(e) => setFormData({ ...formData, validation: e.target.value })}
                  placeholder='{"minLength": 3, "maxLength": 100, "pattern": "regex"}'
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                  <Label htmlFor="isRequired">Required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFieldMutation.isPending || updateFieldMutation.isPending}>
                  {editingField ? "Update Field" : "Create Field"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {SECTIONS.map((section) => (
              <SelectItem key={section.value} value={section.value}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
          <CardDescription>
            Manage dynamic form fields across all platform sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : customFields.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              No custom fields found. Create your first field to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field: CustomFieldDefinition) => {
                  const SectionIcon = getSectionIcon(field.section);
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{field.name}</div>
                          {field.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{field.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getFieldTypeLabel(field.fieldType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SectionIcon className="w-4 h-4" />
                          <span>{getSectionLabel(field.section)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={field.isActive ? "default" : "secondary"}>
                            {field.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {field.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{field.displayOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(field)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{field.label}"? This action cannot be undone and will remove all associated field values.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteFieldMutation.mutate(field.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}