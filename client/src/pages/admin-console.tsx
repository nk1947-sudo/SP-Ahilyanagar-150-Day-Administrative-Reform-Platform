import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Users, Eye, Settings, AlertTriangle, Clock, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

interface AuditLog {
  id: number;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  severity: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SystemSetting {
  id: number;
  key: string;
  value: any;
  category: string;
  description?: string;
  updatedBy: string;
  updatedAt: string;
}

export default function AdminConsole() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [auditFilters, setAuditFilters] = useState({
    action: "",
    severity: "",
    limit: "100"
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users", selectedRole],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedRole) params.append("role", selectedRole);
      return fetch(`/api/admin/users?${params}`).then(res => res.json());
    }
  });

  // Fetch audit logs
  const { data: auditLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["/api/admin/audit-logs", auditFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (auditFilters.action) params.append("action", auditFilters.action);
      if (auditFilters.severity) params.append("severity", auditFilters.severity);
      params.append("limit", auditFilters.limit);
      return fetch(`/api/admin/audit-logs?${params}`).then(res => res.json());
    }
  });

  // Fetch system settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: () => fetch("/api/admin/settings").then(res => res.json())
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role, permissions }: { userId: string; role: string; permissions?: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role, permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
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

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/deactivate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deactivated successfully",
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "sp": return "bg-red-500";
      case "team_leader": return "bg-blue-500";
      case "member": return "bg-green-500";
      case "viewer": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "info": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security & Administration Console
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            SP Ahilyanagar - System Administration & Security Management
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions for the administrative reform program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="role-filter">Filter by Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      <SelectItem value="sp">SP (Superintendent)</SelectItem>
                      <SelectItem value="team_leader">Team Leader</SelectItem>
                      <SelectItem value="member">Team Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                              {user.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-500 text-white">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500 text-white">
                                <UserX className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select 
                                value={user.role} 
                                onValueChange={(newRole) => updateUserRoleMutation.mutate({ userId: user.id, role: newRole })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sp">SP</SelectItem>
                                  <SelectItem value="team_leader">Team Leader</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              {user.isActive && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deactivateUserMutation.mutate(user.id)}
                                  disabled={deactivateUserMutation.isPending}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Security Audit Logs
              </CardTitle>
              <CardDescription>
                Monitor system access and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="action-filter">Action</Label>
                  <Input
                    id="action-filter"
                    placeholder="Filter by action..."
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="severity-filter">Severity</Label>
                  <Select value={auditFilters.severity} onValueChange={(value) => setAuditFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All severities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="limit-filter">Limit</Label>
                  <Select value={auditFilters.limit} onValueChange={(value) => setAuditFilters(prev => ({ ...prev, limit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 records</SelectItem>
                      <SelectItem value="100">100 records</SelectItem>
                      <SelectItem value="200">200 records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => refetchLogs()} className="mb-4">
                Refresh Logs
              </Button>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Loading audit logs...
                        </TableCell>
                      </TableRow>
                    ) : auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log: AuditLog) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">{log.userId}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {log.action}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm">{log.resource}</TableCell>
                          <TableCell>
                            <Badge className={`${getSeverityBadgeColor(log.severity)} text-white`}>
                              {log.severity.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.ipAddress || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settingsLoading ? (
                  <div className="text-center py-4">Loading settings...</div>
                ) : settings.length === 0 ? (
                  <div className="text-center py-4">No system settings found</div>
                ) : (
                  settings.map((setting: SystemSetting) => (
                    <div key={setting.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{setting.key}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {setting.description || 'No description available'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Category: {setting.category} | Updated: {new Date(setting.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {JSON.stringify(setting.value)}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Monitor
              </CardTitle>
              <CardDescription>
                Real-time security monitoring and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                        <p className="text-2xl font-bold">{users.filter((u: User) => u.isActive).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Inactive Users</p>
                        <p className="text-2xl font-bold">{users.filter((u: User) => !u.isActive).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">High Severity Events</p>
                        <p className="text-2xl font-bold">{auditLogs.filter((l: AuditLog) => l.severity === 'high').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Audit Logs</p>
                        <p className="text-2xl font-bold">{auditLogs.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">
                      Security Notice
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      This console provides comprehensive security management for SP Ahilyanagar's administrative reform program. 
                      All actions are logged and monitored for compliance with Maharashtra Police security protocols.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}