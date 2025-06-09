import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface GADReformFormTemplateProps {
  formType: string;
  formData: any;
  onDataChange: (data: any) => void;
  viewMode?: boolean;
}

export function GADReformFormTemplate({ formType, formData, onDataChange, viewMode = false }: GADReformFormTemplateProps) {
  const updateField = (field: string, value: any) => {
    if (!viewMode) {
      onDataChange({ ...formData, [field]: value });
    }
  };

  const updateNestedField = (section: string, field: string, value: any) => {
    if (!viewMode) {
      onDataChange({
        ...formData,
        [section]: { ...formData[section], [field]: value }
      });
    }
  };

  if (formType === "org-structure-review") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organizational Structure Review (SOP-D1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department/Unit *</Label>
                <Input
                  value={formData.department || ""}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="e.g., Crime Branch, Traffic Police"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Current Strength</Label>
                <Input
                  type="number"
                  value={formData.currentStrength || ""}
                  onChange={(e) => updateField("currentStrength", parseInt(e.target.value))}
                  placeholder="Total personnel count"
                  disabled={viewMode}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sanctioned Strength</Label>
                <Input
                  type="number"
                  value={formData.sanctionedStrength || ""}
                  onChange={(e) => updateField("sanctionedStrength", parseInt(e.target.value))}
                  placeholder="Authorized personnel count"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Vacancy Percentage</Label>
                <Input
                  value={formData.vacancyPercentage || ""}
                  onChange={(e) => updateField("vacancyPercentage", e.target.value)}
                  placeholder="% of vacant positions"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div>
              <Label>Rank-wise Distribution</Label>
              <Textarea
                value={formData.rankDistribution || ""}
                onChange={(e) => updateField("rankDistribution", e.target.value)}
                placeholder="Inspector: 5, Sub-Inspector: 12, Constable: 45..."
                rows={3}
                disabled={viewMode}
              />
            </div>

            <div>
              <Label>Organizational Challenges</Label>
              <Textarea
                value={formData.challenges || ""}
                onChange={(e) => updateField("challenges", e.target.value)}
                placeholder="Identify staffing gaps, skill shortages, workload distribution issues..."
                rows={4}
                disabled={viewMode}
              />
            </div>

            <div>
              <Label>Recommended Restructuring</Label>
              <Textarea
                value={formData.recommendations || ""}
                onChange={(e) => updateField("recommendations", e.target.value)}
                placeholder="Proposed organizational changes, new positions, role redefinition..."
                rows={4}
                disabled={viewMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Implementation Timeline</Label>
                <Select
                  value={formData.timeline || ""}
                  onValueChange={(value) => updateField("timeline", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (0-30 days)</SelectItem>
                    <SelectItem value="short-term">Short-term (1-3 months)</SelectItem>
                    <SelectItem value="medium-term">Medium-term (3-6 months)</SelectItem>
                    <SelectItem value="long-term">Long-term (6+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget Impact</Label>
                <Input
                  value={formData.budgetImpact || ""}
                  onChange={(e) => updateField("budgetImpact", e.target.value)}
                  placeholder="Estimated cost implications"
                  disabled={viewMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formType === "promotion-pending-db") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Promotion Pending Database (SOP-D2)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Employee ID *</Label>
                <Input
                  value={formData.employeeId || ""}
                  onChange={(e) => updateField("employeeId", e.target.value)}
                  placeholder="e.g., MP001234"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Employee Name *</Label>
                <Input
                  value={formData.employeeName || ""}
                  onChange={(e) => updateField("employeeName", e.target.value)}
                  placeholder="Full name"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Current Rank</Label>
                <Select
                  value={formData.currentRank || ""}
                  onValueChange={(value) => updateField("currentRank", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constable">Police Constable</SelectItem>
                    <SelectItem value="head-constable">Head Constable</SelectItem>
                    <SelectItem value="asi">Assistant Sub-Inspector</SelectItem>
                    <SelectItem value="si">Sub-Inspector</SelectItem>
                    <SelectItem value="inspector">Police Inspector</SelectItem>
                    <SelectItem value="api">Assistant Police Inspector</SelectItem>
                    <SelectItem value="pi">Police Inspector</SelectItem>
                    <SelectItem value="dysp">Deputy SP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Eligible for Promotion to</Label>
                <Input
                  value={formData.promotionTo || ""}
                  onChange={(e) => updateField("promotionTo", e.target.value)}
                  placeholder="Next rank"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Date of Eligibility</Label>
                <Input
                  type="date"
                  value={formData.eligibilityDate || ""}
                  onChange={(e) => updateField("eligibilityDate", e.target.value)}
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Years in Current Rank</Label>
                <Input
                  type="number"
                  value={formData.yearsInRank || ""}
                  onChange={(e) => updateField("yearsInRank", parseInt(e.target.value))}
                  placeholder="Years of service"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ACR Status</Label>
                <Select
                  value={formData.acrStatus || ""}
                  onValueChange={(value) => updateField("acrStatus", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ACR status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up-to-date">Up to Date</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Departmental Proceedings</Label>
                <Select
                  value={formData.departmentalProceedings || ""}
                  onValueChange={(value) => updateField("departmentalProceedings", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="under-investigation">Under Investigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Qualifying Examinations</Label>
              <Textarea
                value={formData.qualifyingExams || ""}
                onChange={(e) => updateField("qualifyingExams", e.target.value)}
                placeholder="List completed examinations, certifications, training programs..."
                rows={3}
                disabled={viewMode}
              />
            </div>

            <div>
              <Label>Pending Requirements</Label>
              <Textarea
                value={formData.pendingRequirements || ""}
                onChange={(e) => updateField("pendingRequirements", e.target.value)}
                placeholder="Documents, approvals, or conditions still needed for promotion..."
                rows={3}
                disabled={viewMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expected Promotion Date</Label>
                <Input
                  type="date"
                  value={formData.expectedPromotionDate || ""}
                  onChange={(e) => updateField("expectedPromotionDate", e.target.value)}
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Priority Level</Label>
                <Select
                  value={formData.priorityLevel || ""}
                  onValueChange={(value) => updateField("priorityLevel", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formType === "acr-digitization") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ACR Digitization Tracker (SOP-D3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Employee ID *</Label>
                <Input
                  value={formData.employeeId || ""}
                  onChange={(e) => updateField("employeeId", e.target.value)}
                  placeholder="e.g., MP001234"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Employee Name *</Label>
                <Input
                  value={formData.employeeName || ""}
                  onChange={(e) => updateField("employeeName", e.target.value)}
                  placeholder="Full name"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Assessment Year</Label>
                <Select
                  value={formData.assessmentYear || ""}
                  onValueChange={(value) => updateField("assessmentYear", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2022-23">2022-23</SelectItem>
                    <SelectItem value="2021-22">2021-22</SelectItem>
                    <SelectItem value="2020-21">2020-21</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Physical ACR Status</Label>
                <Select
                  value={formData.physicalStatus || ""}
                  onValueChange={(value) => updateField("physicalStatus", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Digitization Status</Label>
                <Select
                  value={formData.digitizationStatus || ""}
                  onValueChange={(value) => updateField("digitizationStatus", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="quality-check">Quality Check</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Scanning Date</Label>
                <Input
                  type="date"
                  value={formData.scanningDate || ""}
                  onChange={(e) => updateField("scanningDate", e.target.value)}
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Data Entry Date</Label>
                <Input
                  type="date"
                  value={formData.dataEntryDate || ""}
                  onChange={(e) => updateField("dataEntryDate", e.target.value)}
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Verification Date</Label>
                <Input
                  type="date"
                  value={formData.verificationDate || ""}
                  onChange={(e) => updateField("verificationDate", e.target.value)}
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Quality</Label>
                <Select
                  value={formData.documentQuality || ""}
                  onValueChange={(value) => updateField("documentQuality", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>File Size (MB)</Label>
                <Input
                  type="number"
                  value={formData.fileSize || ""}
                  onChange={(e) => updateField("fileSize", parseFloat(e.target.value))}
                  placeholder="Digital file size"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div>
              <Label>Performance Ratings Digitized</Label>
              <Textarea
                value={formData.performanceRatings || ""}
                onChange={(e) => updateField("performanceRatings", e.target.value)}
                placeholder="Overall: Excellent, Leadership: Good, Integrity: Outstanding..."
                rows={3}
                disabled={viewMode}
              />
            </div>

            <div>
              <Label>Digitization Issues/Notes</Label>
              <Textarea
                value={formData.digitizationNotes || ""}
                onChange={(e) => updateField("digitizationNotes", e.target.value)}
                placeholder="Any issues encountered during digitization, special handling required..."
                rows={3}
                disabled={viewMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned Operator</Label>
                <Input
                  value={formData.assignedOperator || ""}
                  onChange={(e) => updateField("assignedOperator", e.target.value)}
                  placeholder="Staff member responsible"
                  disabled={viewMode}
                />
              </div>
              <div>
                <Label>Quality Reviewer</Label>
                <Input
                  value={formData.qualityReviewer || ""}
                  onChange={(e) => updateField("qualityReviewer", e.target.value)}
                  placeholder="Supervising officer"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="backup-created"
                checked={formData.backupCreated || false}
                onCheckedChange={(checked) => updateField("backupCreated", checked)}
                disabled={viewMode}
              />
              <Label htmlFor="backup-created">Backup copy created and stored securely</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              GAD Reform form template for "{formType}" is not yet implemented
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}