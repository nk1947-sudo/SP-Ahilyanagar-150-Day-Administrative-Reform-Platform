import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EGovernanceFormTemplateProps {
  formType: string;
  content: any;
  onContentChange: (content: any) => void;
}

export function EGovernanceFormTemplate({ formType, content, onContentChange }: EGovernanceFormTemplateProps) {
  const updateField = (field: string, value: any) => {
    onContentChange({ ...content, [field]: value });
  };

  const updateNestedField = (section: string, field: string, value: any) => {
    onContentChange({
      ...content,
      [section]: {
        ...content[section],
        [field]: value
      }
    });
  };

  if (formType === "aaple-sarkar-integration") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aaple Sarkar Service Integration Form - SOP-C1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Service Name *</Label>
                <Input
                  value={content.serviceName || ""}
                  onChange={(e) => updateField("serviceName", e.target.value)}
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <Label>Service Code *</Label>
                <Input
                  value={content.serviceCode || ""}
                  onChange={(e) => updateField("serviceCode", e.target.value)}
                  placeholder="AS-AHN-XXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Integration Lead *</Label>
                <Input
                  value={content.integrationLead || ""}
                  onChange={(e) => updateField("integrationLead", e.target.value)}
                  placeholder="Officer name"
                />
              </div>
              <div>
                <Label>Target Go-Live Date *</Label>
                <Input
                  type="date"
                  value={content.targetGoLive || ""}
                  onChange={(e) => updateField("targetGoLive", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Current Delivery Mode</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={content.deliveryMode === "offline"}
                    onCheckedChange={(checked) => updateField("deliveryMode", checked ? "offline" : "")}
                  />
                  <Label>Offline Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={content.deliveryMode === "partial"}
                    onCheckedChange={(checked) => updateField("deliveryMode", checked ? "partial" : "")}
                  />
                  <Label>Partial Online</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={content.deliveryMode === "manual"}
                    onCheckedChange={(checked) => updateField("deliveryMode", checked ? "manual" : "")}
                  />
                  <Label>Manual</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Annual Transaction Volume</Label>
                <Input
                  type="number"
                  value={content.annualVolume || ""}
                  onChange={(e) => updateField("annualVolume", e.target.value)}
                  placeholder="Number of transactions per year"
                />
              </div>
              <div>
                <Label>Average Processing Time</Label>
                <Input
                  value={content.processingTime || ""}
                  onChange={(e) => updateField("processingTime", e.target.value)}
                  placeholder="e.g., 5 days"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Revenue Generated (₹/year)</Label>
                <Input
                  type="number"
                  value={content.revenueGenerated || ""}
                  onChange={(e) => updateField("revenueGenerated", e.target.value)}
                  placeholder="Annual revenue"
                />
              </div>
              <div>
                <Label>Fee per Application (₹)</Label>
                <Input
                  type="number"
                  value={content.feePerApplication || ""}
                  onChange={(e) => updateField("feePerApplication", e.target.value)}
                  placeholder="Application fee"
                />
              </div>
            </div>

            <div>
              <Label>Governing Act/Rule</Label>
              <Input
                value={content.governingAct || ""}
                onChange={(e) => updateField("governingAct", e.target.value)}
                placeholder="Legal framework governing this service"
              />
            </div>

            <div>
              <Label>Current Pain Points</Label>
              <Textarea
                value={content.painPoints || ""}
                onChange={(e) => updateField("painPoints", e.target.value)}
                placeholder="Describe current challenges from citizen and department perspective"
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Integration Requirements</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>API Endpoints Required</Label>
                  <Textarea
                    value={content.apiEndpoints || ""}
                    onChange={(e) => updateField("apiEndpoints", e.target.value)}
                    placeholder="List required API endpoints"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Database Tables Affected</Label>
                  <Textarea
                    value={content.databaseTables || ""}
                    onChange={(e) => updateField("databaseTables", e.target.value)}
                    placeholder="List database tables"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Benefits Realization</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time Saved (hours per application)</Label>
                  <Input
                    type="number"
                    value={content.timeSaved || ""}
                    onChange={(e) => updateField("timeSaved", e.target.value)}
                    placeholder="Hours saved"
                  />
                </div>
                <div>
                  <Label>Cost Saved (₹ per application)</Label>
                  <Input
                    type="number"
                    value={content.costSaved || ""}
                    onChange={(e) => updateField("costSaved", e.target.value)}
                    placeholder="Cost reduction"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formType === "gpr-analysis") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GPR (Government Process Re-engineering) Analysis - SOP-C2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Process Name *</Label>
                <Input
                  value={content.processName || ""}
                  onChange={(e) => updateField("processName", e.target.value)}
                  placeholder="Name of the process being analyzed"
                />
              </div>
              <div>
                <Label>Service Priority</Label>
                <Select
                  value={content.servicePriority || ""}
                  onValueChange={(value) => updateField("servicePriority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Current State Analysis</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Total Process Steps</Label>
                  <Input
                    type="number"
                    value={content.totalSteps || ""}
                    onChange={(e) => updateField("totalSteps", e.target.value)}
                    placeholder="Number of steps"
                  />
                </div>
                <div>
                  <Label>Value-Adding Steps</Label>
                  <Input
                    type="number"
                    value={content.valueSteps || ""}
                    onChange={(e) => updateField("valueSteps", e.target.value)}
                    placeholder="Productive steps"
                  />
                </div>
                <div>
                  <Label>Non-Value Steps</Label>
                  <Input
                    type="number"
                    value={content.nonValueSteps || ""}
                    onChange={(e) => updateField("nonValueSteps", e.target.value)}
                    placeholder="Wasteful steps"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Processing Time (days)</Label>
                <Input
                  type="number"
                  value={content.totalTime || ""}
                  onChange={(e) => updateField("totalTime", e.target.value)}
                  placeholder="Current processing time"
                />
              </div>
              <div>
                <Label>Actual Work Time (hours)</Label>
                <Input
                  type="number"
                  value={content.workTime || ""}
                  onChange={(e) => updateField("workTime", e.target.value)}
                  placeholder="Active work hours"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Citizen Touch Points</Label>
                <Input
                  type="number"
                  value={content.touchPoints || ""}
                  onChange={(e) => updateField("touchPoints", e.target.value)}
                  placeholder="Number of visits required"
                />
              </div>
              <div>
                <Label>Documents Required</Label>
                <Input
                  type="number"
                  value={content.documentsRequired || ""}
                  onChange={(e) => updateField("documentsRequired", e.target.value)}
                  placeholder="Number of documents"
                />
              </div>
            </div>

            <div>
              <Label>Root Cause Analysis (5 Whys)</Label>
              <div className="space-y-2">
                <Input
                  value={content.why1 || ""}
                  onChange={(e) => updateField("why1", e.target.value)}
                  placeholder="Why 1: First level cause"
                />
                <Input
                  value={content.why2 || ""}
                  onChange={(e) => updateField("why2", e.target.value)}
                  placeholder="Why 2: Second level cause"
                />
                <Input
                  value={content.why3 || ""}
                  onChange={(e) => updateField("why3", e.target.value)}
                  placeholder="Why 3: Third level cause"
                />
                <Input
                  value={content.why4 || ""}
                  onChange={(e) => updateField("why4", e.target.value)}
                  placeholder="Why 4: Fourth level cause"
                />
                <Input
                  value={content.why5 || ""}
                  onChange={(e) => updateField("why5", e.target.value)}
                  placeholder="Why 5: Root cause"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Future State Design</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Processing Time (days)</Label>
                  <Input
                    type="number"
                    value={content.targetTime || ""}
                    onChange={(e) => updateField("targetTime", e.target.value)}
                    placeholder="Improved processing time"
                  />
                </div>
                <div>
                  <Label>Percentage Improvement (%)</Label>
                  <Input
                    type="number"
                    value={content.improvement || ""}
                    onChange={(e) => updateField("improvement", e.target.value)}
                    placeholder="Expected improvement"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Technology Enablers</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Online Application Submission",
                  "Auto-population from Database",
                  "Digital Document Upload",
                  "E-Payment Integration",
                  "SMS/Email Notifications",
                  "Digital Certificate Generation",
                  "Workflow Automation",
                  "Real-time Status Tracking",
                  "Mobile App Integration",
                  "AI/ML for Decision Support"
                ].map((tech) => (
                  <div key={tech} className="flex items-center space-x-2">
                    <Checkbox
                      checked={content.enablers?.[tech] || false}
                      onCheckedChange={(checked) => updateNestedField("enablers", tech, checked)}
                    />
                    <Label className="text-sm">{tech}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formType === "e-office-tracker") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>E-Office Implementation Tracker - SOP-C3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reporting Week</Label>
                <Input
                  value={content.reportingWeek || ""}
                  onChange={(e) => updateField("reportingWeek", e.target.value)}
                  placeholder="e.g., Week 1-7 Jan 2024"
                />
              </div>
              <div>
                <Label>Total Users</Label>
                <Input
                  type="number"
                  value={content.totalUsers || ""}
                  onChange={(e) => updateField("totalUsers", e.target.value)}
                  placeholder="Total registered users"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">User Adoption Metrics</Label>
              <div className="space-y-2">
                {[
                  { category: "Senior Officers (SP+)", target: "100%" },
                  { category: "DySP Level", target: "100%" },
                  { category: "Inspector Level", target: "90%" },
                  { category: "Sub-Inspector Level", target: "80%" },
                  { category: "ASI/HC Level", target: "70%" },
                  { category: "Constable Level", target: "60%" },
                  { category: "Civilian Staff", target: "80%" }
                ].map((level) => (
                  <div key={level.category} className="grid grid-cols-4 gap-2 items-center">
                    <Label className="text-sm">{level.category}</Label>
                    <Input
                      type="number"
                      placeholder="Active"
                      value={content.adoption?.[level.category]?.active || ""}
                      onChange={(e) => updateNestedField("adoption", `${level.category}.active`, e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Total"
                      value={content.adoption?.[level.category]?.total || ""}
                      onChange={(e) => updateNestedField("adoption", `${level.category}.total`, e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">Target: {level.target}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">File Processing Metrics</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Files Created</Label>
                  <Input
                    type="number"
                    value={content.filesCreated || ""}
                    onChange={(e) => updateField("filesCreated", e.target.value)}
                    placeholder="Number of files"
                  />
                </div>
                <div>
                  <Label>Files in E-Office (%)</Label>
                  <Input
                    type="number"
                    value={content.filesInEOffice || ""}
                    onChange={(e) => updateField("filesInEOffice", e.target.value)}
                    placeholder="Percentage"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Average Processing Time (days)</Label>
                  <Input
                    type="number"
                    value={content.avgProcessingTime || ""}
                    onChange={(e) => updateField("avgProcessingTime", e.target.value)}
                    placeholder="Days"
                  />
                </div>
                <div>
                  <Label>Files Pending {">"} 7 days</Label>
                  <Input
                    type="number"
                    value={content.pendingFiles || ""}
                    onChange={(e) => updateField("pendingFiles", e.target.value)}
                    placeholder="Number of files"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Module-wise Usage</Label>
              <div className="space-y-2">
                {[
                  "File Management",
                  "Digital Signature", 
                  "Knowledge Management",
                  "Personnel Management",
                  "Leave Management",
                  "Tour Management"
                ].map((module) => (
                  <div key={module} className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">{module}</Label>
                    <Input
                      type="number"
                      placeholder="Users Trained"
                      value={content.modules?.[module]?.trained || ""}
                      onChange={(e) => updateNestedField("modules", `${module}.trained`, e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Active Users"
                      value={content.modules?.[module]?.active || ""}
                      onChange={(e) => updateNestedField("modules", `${module}.active`, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Adoption Barriers Identified</Label>
              <Textarea
                value={content.barriers || ""}
                onChange={(e) => updateField("barriers", e.target.value)}
                placeholder="List challenges and barriers to adoption"
                rows={4}
              />
            </div>

            <div>
              <Label>Mitigation Strategies</Label>
              <Textarea
                value={content.mitigationStrategies || ""}
                onChange={(e) => updateField("mitigationStrategies", e.target.value)}
                placeholder="Actions taken to address barriers"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default template for other E-Governance forms
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>E-Governance Form Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                value={content.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the E-Governance initiative or requirement"
                rows={4}
              />
            </div>
            <div>
              <Label>Implementation Details</Label>
              <Textarea
                value={content.implementation || ""}
                onChange={(e) => updateField("implementation", e.target.value)}
                placeholder="Technical and procedural implementation details"
                rows={4}
              />
            </div>
            <div>
              <Label>Expected Outcomes</Label>
              <Textarea
                value={content.outcomes || ""}
                onChange={(e) => updateField("outcomes", e.target.value)}
                placeholder="Expected benefits and results"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}