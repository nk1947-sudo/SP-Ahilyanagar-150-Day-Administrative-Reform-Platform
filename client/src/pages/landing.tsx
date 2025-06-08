import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Target, Users, Calendar, BarChart3, FileText, MessageSquare, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-bold text-gray-900 dark:text-white">SP Ahilyanagar</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">150-Day Reform Program</div>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            150-Day Administrative
            <span className="text-blue-600 block">Reform Program</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Comprehensive workflow and feedback management system for SP Ahilyanagar's 
            transformation initiative. Track progress across e-Governance, GAD reforms, 
            and Vision 2047 strategic planning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Access Dashboard
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Task Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track daily, weekly, and milestone progress across all teams
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Team Collaboration
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Role-based access for SP, Team Leaders, and Members
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Progress Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Real-time progress reports and analytics
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Daily Reporting
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automated reminders for 4 daily reporting cycles
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Document Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Centralized storage for reports and assessments
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Calendar className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Timeline View
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Visual timeline for the entire 150-day program
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MessageSquare className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Feedback System
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Continuous improvement through feedback collection
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <BarChart3 className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Budget Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor resource allocation and utilization
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Focus Areas */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Three Focus Areas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Team Alpha - e-Governance
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Implementation of digital governance systems including website development, 
                  Aaple Sarkar integration, and mobile application development.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Website Development & Optimization</li>
                  <li>• Government Portal Integration</li>
                  <li>• Digital Service Delivery</li>
                  <li>• Mobile Application Development</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Team Bravo - GAD Reforms
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Administrative reforms focusing on organizational structure, 
                  service book digitization, and iGOT Karmayogi implementation.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Akrutibandh Organizational Review</li>
                  <li>• Service Book Digitization</li>
                  <li>• iGOT Karmayogi Setup</li>
                  <li>• HR Process Optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Team Charlie - Vision 2047
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Strategic planning for long-term security framework and 
                  implementation roadmap aligned with Vision 2047.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Security Landscape Analysis</li>
                  <li>• Strategic Framework Development</li>
                  <li>• Implementation Roadmap</li>
                  <li>• Stakeholder Consultation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Transform Ahilyanagar Police Administration?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join the 150-day transformation journey and be part of Maharashtra's 
                model police district initiative.
              </p>
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Access Your Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2025 SP Ahilyanagar. 150-Day Administrative Reform Program.</p>
            <p className="mt-2">Implementation Period: May 6, 2025 - October 2, 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
