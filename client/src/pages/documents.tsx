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
import { Switch } from "@/components/ui/switch";
import { Plus, FileText, Upload, Download, Search, Filter, Eye, Trash2, File, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Document {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  category?: string;
  teamId?: number;
  uploadedBy?: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  code: string;
  focusArea: string;
}

export default function Documents() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: FormData) => {
      await fetch("/api/documents", {
        method: "POST",
        body: documentData,
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
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
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
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
        description: "Failed to delete document",
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

  const handleFileUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("file", selectedFile);

    uploadDocumentMutation.mutate(formData);
  };

  const getTeamName = (teamId?: number) => {
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : "General";
  };

  const getCategoryBadge = (category?: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (category) {
      case "report":
        return <Badge className={cn(baseClasses, "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400")}>Report</Badge>;
      case "assessment":
        return <Badge className={cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400")}>Assessment</Badge>;
      case "plan":
        return <Badge className={cn(baseClasses, "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400")}>Plan</Badge>;
      case "guideline":
        return <Badge className={cn(baseClasses, "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400")}>Guideline</Badge>;
      default:
        return <Badge variant="outline">{category || "Document"}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-5 w-5 text-gray-400" />;
    
    if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes("image")) return <File className="h-5 w-5 text-green-500" />;
    if (mimeType.includes("text") || mimeType.includes("document")) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <FileText className="h-5 w-5 text-green-600" />;
    
    return <File className="h-5 w-5 text-gray-400" />;
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc: Document) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    const matchesTeam = teamFilter === "all" || doc.teamId?.toString() === teamFilter;
    
    return matchesSearch && matchesCategory && matchesTeam;
  });

  // Group documents by category
  const documentsByCategory = filteredDocuments.reduce((acc: any, doc: Document) => {
    const category = doc.category || "uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  const categories = [
    { value: "report", label: "Reports", icon: FileText },
    { value: "assessment", label: "Assessments", icon: FileText },
    { value: "plan", label: "Plans", icon: FileText },
    { value: "guideline", label: "Guidelines", icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Store, organize, and share documents across the 150-day program
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FolderOpen className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Public Documents</p>
                        <p className="text-2xl font-bold text-green-600">
                          {documents.filter((doc: Document) => doc.isPublic).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Upload className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {documents.filter((doc: Document) => {
                            const docDate = new Date(doc.createdAt);
                            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            return docDate >= weekAgo;
                          }).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <File className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {Object.keys(documentsByCategory).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-1 gap-4 items-center">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search documents..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="report">Reports</SelectItem>
                          <SelectItem value="assessment">Assessments</SelectItem>
                          <SelectItem value="plan">Plans</SelectItem>
                          <SelectItem value="guideline">Guidelines</SelectItem>
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

                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <form onSubmit={handleFileUpload}>
                          <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                            <DialogDescription>
                              Upload a new document to share with your team.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="file">File</Label>
                              <Input
                                id="file"
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="title">Title</Label>
                              <Input id="title" name="title" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea id="description" name="description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select name="category">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="report">Report</SelectItem>
                                    <SelectItem value="assessment">Assessment</SelectItem>
                                    <SelectItem value="plan">Plan</SelectItem>
                                    <SelectItem value="guideline">Guideline</SelectItem>
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
                              <Label htmlFor="tags">Tags (comma separated)</Label>
                              <Input id="tags" name="tags" placeholder="e.g. urgent, review, final" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch id="isPublic" name="isPublic" />
                              <Label htmlFor="isPublic">Make document public</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={uploadDocumentMutation.isPending}>
                              {uploadDocumentMutation.isPending ? "Uploading..." : "Upload Document"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentsLoading ? (
                  [...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                          <div className="h-12 w-12 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredDocuments.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm || categoryFilter !== "all" || teamFilter !== "all"
                        ? "Try adjusting your filters or search terms."
                        : "Upload your first document to get started."}
                    </p>
                  </div>
                ) : (
                  filteredDocuments.map((doc: Document) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                                {doc.title}
                              </h3>
                              <div className="flex items-center space-x-1 ml-2">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-red-500"
                                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {doc.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2">
                                {getCategoryBadge(doc.category)}
                                {doc.isPublic && (
                                  <Badge variant="outline" className="text-xs">Public</Badge>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <div>Team: {getTeamName(doc.teamId)}</div>
                              <div>Size: {formatFileSize(doc.fileSize)}</div>
                              <div>Uploaded: {format(new Date(doc.createdAt), "MMM dd, yyyy")}</div>
                            </div>

                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {doc.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {doc.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{doc.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category.value} value={category.label.toLowerCase()} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <category.icon className="h-5 w-5" />
                      <span>{category.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents
                        .filter((doc: Document) => doc.category === category.value)
                        .map((doc: Document) => (
                          <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                {getFileIcon(doc.mimeType)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {doc.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {getTeamName(doc.teamId)} • {format(new Date(doc.createdAt), "MMM dd")}
                                </p>
                                <div className="flex items-center space-x-1 mt-2">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
