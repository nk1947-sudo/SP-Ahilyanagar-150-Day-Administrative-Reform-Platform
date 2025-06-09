import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Users, 
  ClipboardList, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download,
  Search,
  Filter
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Forms() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeForm, setActiveForm] = useState("team-formation");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

  const { data: forms = [] } = useQuery({
    queryKey: ["/api/forms"],
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    retry: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const createFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      await apiRequest("POST", "/api/forms", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form submitted successfully",
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
        description: "Failed to submit form",
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

  const handleTeamFormationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const teamFormData = {
      formType: "team-formation",
      teamName: formData.get("teamName"),
      teamLeader: {
        name: formData.get("leaderName"),
        designation: formData.get("leaderDesignation"),
        mobile: formData.get("leaderMobile"),
        email: formData.get("leaderEmail"),
        employeeId: formData.get("leaderEmployeeId"),
        yearsOfService: formData.get("leaderYearsOfService"),
      },
      deputyLeader: {
        name: formData.get("deputyName"),
        designation: formData.get("deputyDesignation"),
        mobile: formData.get("deputyMobile"),
        email: formData.get("deputyEmail"),
      },
      coreMembers: [],
      responsibilities: Array.from(formData.getAll("responsibilities")),
      authorityLevels: {
        financialPowers: formData.get("financialPowers"),
        subjectTo: formData.get("subjectTo"),
        decisionMaking: formData.get("decisionMaking"),
        externalCoordination: formData.get("externalCoordination"),
      },
      performanceTargets: {
        thirtyDay: formData.get("thirtyDayTarget"),
        sixtyDay: formData.get("sixtyDayTarget"),
        ninetyDay: formData.get("ninetyDayTarget"),
        oneHundredFiftyDay: formData.get("oneHundredFiftyDayTarget"),
      },
      accountability: {
        reportSubmission: formData.get("reportSubmission"),
        reportTo: formData.get("reportTo"),
        reviewMeeting: formData.get("reviewMeeting"),
        reviewTime: formData.get("reviewTime"),
      },
    };

    createFormMutation.mutate(teamFormData);
  };

  const handleProgressReportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const progressReportData = {
      formType: "progress-report",
      date: formData.get("reportDate"),
      day: formData.get("reportDay"),
      team: formData.get("reportTeam"),
      keyAchievements: [
        { achievement: formData.get("achievement1"), complete: formData.get("complete1") },
        { achievement: formData.get("achievement2"), complete: formData.get("complete2") },
        { achievement: formData.get("achievement3"), complete: formData.get("complete3") },
      ],
      competitionScore: {
        website: formData.get("websiteScore"),
        aapleSarkar: formData.get("aapleSarkarScore"),
        eOffice: formData.get("eOfficeScore"),
        dashboard: formData.get("dashboardScore"),
        novelTech: formData.get("novelTechScore"),
      },
      tasksStatus: {
        totalAssigned: formData.get("totalAssigned"),
        completedToday: formData.get("completedToday"),
        inProgress: formData.get("inProgress"),
        delayed: formData.get("delayed"),
        criticalPath: formData.get("criticalPath"),
      },
      resourceUtilization: {
        teamPresent: formData.get("teamPresent"),
        totalTeam: formData.get("totalTeam"),
        externalSupport: formData.get("externalSupport"),
        amountSpent: formData.get("amountSpent"),
        purpose: formData.get("purpose"),
      },
      issues: {
        priority: formData.get("issuePriority"),
        issue: formData.get("issue"),
        impact: formData.get("impact"),
        actionTaken: formData.get("actionTaken"),
        supportRequired: formData.get("supportRequired"),
      },
      nextDayPlan: [
        formData.get("plan1"),
        formData.get("plan2"),
        formData.get("plan3"),
      ],
      citizenInteractions: formData.get("citizenInteractions"),
      feedbackScore: formData.get("feedbackScore"),
    };

    createFormMutation.mutate(progressReportData);
  };

  const formCategories = [
    {
      id: "team-formation",
      title: "Team Formation & Role Assignment",
      description: "Formal team constitution and role assignment for 150-day implementation",
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500",
      sopRef: "SOP-A1"
    },
    {
      id: "progress-report",
      title: "Daily Progress Report",
      description: "Standardized daily progress tracking and issue escalation",
      icon: <ClipboardList className="h-5 w-5" />,
      color: "bg-green-500",
      sopRef: "SOP-A2"
    },
    {
      id: "meeting-minutes",
      title: "Meeting Minutes",
      description: "Standardized recording of all official meetings",
      icon: <Calendar className="h-5 w-5" />,
      color: "bg-orange-500",
      sopRef: "SOP-A3"
    },
    {
      id: "task-assignment",
      title: "Task Assignment & Tracking",
      description: "Systematic task assignment and progress tracking",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-purple-500",
      sopRef: "SOP-A4"
    },
    {
      id: "risk-assessment",
      title: "Risk Assessment & Mitigation",
      description: "Proactive identification and management of implementation risks",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "bg-red-500",
      sopRef: "SOP-A5"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Administrative Forms & SOPs
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Section A: Standardized forms for 150-day implementation strategy
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download All SOPs
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Form Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {formCategories.map((category) => (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${
                activeForm === category.id 
                  ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-l-gray-300 hover:border-l-blue-400'
              }`}
              onClick={() => setActiveForm(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-md ${category.color} text-white`}>
                    {category.icon}
                  </div>
                  <Badge variant="secondary">{category.sopRef}</Badge>
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Active Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {formCategories.find(f => f.id === activeForm)?.title}
                </CardTitle>
                <CardDescription>
                  Reference: {formCategories.find(f => f.id === activeForm)?.sopRef} - 
                  Ahilyanagar Police 150-Day Implementation
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Team Formation Form */}
            {activeForm === "team-formation" && (
              <form onSubmit={handleTeamFormationSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Select name="teamName" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALPHA">ALPHA - e-Governance</SelectItem>
                        <SelectItem value="BRAVO">BRAVO - GAD Reforms</SelectItem>
                        <SelectItem value="CHARLIE">CHARLIE - Vision 2047</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Team Leader Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Leader Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leaderName">Name</Label>
                      <Input id="leaderName" name="leaderName" required />
                    </div>
                    <div>
                      <Label htmlFor="leaderDesignation">Designation</Label>
                      <Input id="leaderDesignation" name="leaderDesignation" required />
                    </div>
                    <div>
                      <Label htmlFor="leaderMobile">Mobile</Label>
                      <Input id="leaderMobile" name="leaderMobile" type="tel" required />
                    </div>
                    <div>
                      <Label htmlFor="leaderEmail">Email</Label>
                      <Input id="leaderEmail" name="leaderEmail" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="leaderEmployeeId">Employee ID</Label>
                      <Input id="leaderEmployeeId" name="leaderEmployeeId" required />
                    </div>
                    <div>
                      <Label htmlFor="leaderYearsOfService">Years of Service</Label>
                      <Input id="leaderYearsOfService" name="leaderYearsOfService" type="number" required />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deputy Leader Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Deputy Leader Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deputyName">Name</Label>
                      <Input id="deputyName" name="deputyName" required />
                    </div>
                    <div>
                      <Label htmlFor="deputyDesignation">Designation</Label>
                      <Input id="deputyDesignation" name="deputyDesignation" required />
                    </div>
                    <div>
                      <Label htmlFor="deputyMobile">Mobile</Label>
                      <Input id="deputyMobile" name="deputyMobile" type="tel" required />
                    </div>
                    <div>
                      <Label htmlFor="deputyEmail">Email</Label>
                      <Input id="deputyEmail" name="deputyEmail" type="email" required />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Performance Targets */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Targets</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="thirtyDayTarget">30-Day Target</Label>
                      <Textarea id="thirtyDayTarget" name="thirtyDayTarget" rows={2} required />
                    </div>
                    <div>
                      <Label htmlFor="sixtyDayTarget">60-Day Target</Label>
                      <Textarea id="sixtyDayTarget" name="sixtyDayTarget" rows={2} required />
                    </div>
                    <div>
                      <Label htmlFor="ninetyDayTarget">90-Day Target</Label>
                      <Textarea id="ninetyDayTarget" name="ninetyDayTarget" rows={2} required />
                    </div>
                    <div>
                      <Label htmlFor="oneHundredFiftyDayTarget">150-Day Target</Label>
                      <Textarea id="oneHundredFiftyDayTarget" name="oneHundredFiftyDayTarget" rows={2} required />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={createFormMutation.isPending}>
                    {createFormMutation.isPending ? "Submitting..." : "Submit Form"}
                  </Button>
                </div>
              </form>
            )}

            {/* Progress Report Form */}
            {activeForm === "progress-report" && (
              <form onSubmit={handleProgressReportSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reportDate">Date</Label>
                    <Input id="reportDate" name="reportDate" type="date" required />
                  </div>
                  <div>
                    <Label htmlFor="reportDay">Day (x/150)</Label>
                    <Input id="reportDay" name="reportDay" type="number" min="1" max="150" required />
                  </div>
                  <div>
                    <Label htmlFor="reportTeam">Team</Label>
                    <Select name="reportTeam" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALPHA">ALPHA</SelectItem>
                        <SelectItem value="BRAVO">BRAVO</SelectItem>
                        <SelectItem value="CHARLIE">CHARLIE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Key Achievements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Key Achievements (Quantifiable metrics only)</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                          <Label htmlFor={`achievement${num}`}>Achievement {num}</Label>
                          <Input id={`achievement${num}`} name={`achievement${num}`} placeholder="Enter achievement" />
                        </div>
                        <div>
                          <Label htmlFor={`complete${num}`}>% Complete</Label>
                          <Input id={`complete${num}`} name={`complete${num}`} type="number" min="0" max="100" placeholder="0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Competition Score Update */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Competition Score Update</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="websiteScore">Website (/40)</Label>
                      <Input id="websiteScore" name="websiteScore" type="number" min="0" max="40" />
                    </div>
                    <div>
                      <Label htmlFor="aapleSarkarScore">Aaple Sarkar (/60)</Label>
                      <Input id="aapleSarkarScore" name="aapleSarkarScore" type="number" min="0" max="60" />
                    </div>
                    <div>
                      <Label htmlFor="eOfficeScore">E-Office (/25)</Label>
                      <Input id="eOfficeScore" name="eOfficeScore" type="number" min="0" max="25" />
                    </div>
                    <div>
                      <Label htmlFor="dashboardScore">Dashboard (/15)</Label>
                      <Input id="dashboardScore" name="dashboardScore" type="number" min="0" max="15" />
                    </div>
                    <div>
                      <Label htmlFor="novelTechScore">Novel Tech (/60)</Label>
                      <Input id="novelTechScore" name="novelTechScore" type="number" min="0" max="60" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={createFormMutation.isPending}>
                    {createFormMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}

            {/* Other forms - placeholder content */}
            {!["team-formation", "progress-report"].includes(activeForm) && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Form Template Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This form template is being prepared according to SOP guidelines.
                </p>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}