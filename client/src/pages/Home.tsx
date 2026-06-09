import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Zap, Lightbulb, Link as LinkIcon, Brain, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-calm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-soft bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-safe py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            <span className="text-lg font-semibold">ZenCanvas</span>
          </div>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button>Sign In</Button>
            </a>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-safe md:py-16">
        <div className="max-w-4xl mx-auto px-safe text-center space-generous">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Your Holistic Knowledge and Life Hub
          </h1>
          <p className="text-xl text-calm max-w-2xl mx-auto">
            Connect every aspect of your life—tasks, notes, projects, people, and time—into one unified, visual network. See the hidden connections that matter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href={getLoginUrl()}>
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </a>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-safe bg-soft/30">
        <div className="max-w-6xl mx-auto px-safe">
          <h2 className="text-3xl font-bold text-center mb-12">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Network className="w-6 h-6 text-accent mb-2" />
                <CardTitle>Universal Node System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  Every item—notes, tasks, projects, people—is a first-class node. Link anything to anything across all domains of your life.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <LinkIcon className="w-6 h-6 text-accent mb-2" />
                <CardTitle>Visual Graph Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  See all your nodes and their connections as a live, navigable network. Click any node to edit it in-place. Drag to explore.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Zap className="w-6 h-6 text-accent mb-2" />
                <CardTitle>Smart Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  Bi-directional, typed relationships with visible labels. AI suggests missing connections you haven't discovered yet.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Lightbulb className="w-6 h-6 text-accent mb-2" />
                <CardTitle>Daily Inbox</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  Quickly capture thoughts, tasks, and notes without organizing. Link them later as your knowledge graph grows.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Clock className="w-6 h-6 text-accent mb-2" />
                <CardTitle>Time Blocking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  Visual daily timeline where time blocks are nodes. Link them to tasks, projects, or people for complete life integration.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Brain className="w-6 h-6 text-accent mb-2" />
                <CardTitle>AI Task Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  Enter a vague or complex task. AI breaks it into concrete, actionable subtasks—each becomes a linked node.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Design Philosophy */}
      <section className="py-safe">
        <div className="max-w-4xl mx-auto px-safe space-generous">
          <h2 className="text-3xl font-bold text-center">Designed for Clarity</h2>
          <p className="text-lg text-calm text-center max-w-2xl mx-auto">
            ZenCanvas is built for cognitive accessibility and focus. Generous whitespace, high-contrast typography, soothing colors, and minimal visual noise help you think clearly and manage your entire life without overwhelm.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-safe bg-accent/5 border-t border-soft">
        <div className="max-w-4xl mx-auto px-safe text-center space-generous">
          <h2 className="text-3xl font-bold">Ready to Connect Your Life?</h2>
          <p className="text-lg text-calm">
            Start building your unified knowledge graph today. No credit card required.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg">
              Get Started Free
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-soft bg-card/50 py-8">
        <div className="max-w-6xl mx-auto px-safe text-center text-calm text-sm">
          <p>ZenCanvas © 2026 • Holistic knowledge and life management</p>
        </div>
      </footer>
    </div>
  );
}
