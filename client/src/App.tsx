import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { VisionHeader } from "@/components/vision-header";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TaskManagement from "@/pages/task-management";
import TeamCollaboration from "@/pages/team-collaboration";
import ProgressReports from "@/pages/progress-reports";
import Documents from "@/pages/documents";
import BudgetTracking from "@/pages/budget-tracking";
import FeedbackSystem from "@/pages/feedback-system";
import TimelineView from "@/pages/timeline-view";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <VisionHeader />
      <Switch>
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <div className="flex">
            <NavigationSidebar />
            <main className="flex-1 p-6">
              <Route path="/" component={Dashboard} />
              <Route path="/tasks" component={TaskManagement} />
              <Route path="/team" component={TeamCollaboration} />
              <Route path="/reports" component={ProgressReports} />
              <Route path="/documents" component={Documents} />
              <Route path="/budget" component={BudgetTracking} />
              <Route path="/feedback" component={FeedbackSystem} />
              <Route path="/timeline" component={TimelineView} />
            </main>
          </div>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
