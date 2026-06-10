import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Zap, Lightbulb, Link as LinkIcon, Brain, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
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
            {t('home.title')}
          </h1>
          <p className="text-xl text-calm max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href={getLoginUrl()}>
              <Button size="lg" className="w-full sm:w-auto">
                {t('home.getStarted')}
              </Button>
            </a>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {t('home.learnMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-safe bg-soft/30">
        <div className="max-w-6xl mx-auto px-safe">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.coreCapabilities')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Network className="w-6 h-6 text-accent mb-2" />
                <CardTitle>{t('home.universalNodeSystem')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  {t('home.universalNodeDesc')}
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <LinkIcon className="w-6 h-6 text-accent mb-2" />
                <CardTitle>{t('home.visualGraphCanvas')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  {t('home.visualGraphDesc')}
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Zap className="w-6 h-6 text-accent mb-2" />
                <CardTitle>{t('home.smartRelationships')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  {t('home.smartRelDesc')}
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Lightbulb className="w-6 h-6 text-accent mb-2" />
                <CardTitle>{t('home.dailyInbox')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  {t('home.dailyInboxDesc')}
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Clock className="w-6 h-6 text-accent mb-2" />
                <CardTitle>{t('home.timeBlocking')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  {t('home.timeBlockDesc')}
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="shadow-calm hover:shadow-card transition-calm border-soft">
              <CardHeader>
                <Brain className="w-6 h-6 text-accent mb-2" />
                <CardTitle>{t('home.aiTaskBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-calm">
                  {t('home.aiTaskDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Design Philosophy */}
      <section className="py-safe">
        <div className="max-w-4xl mx-auto px-safe space-generous">
          <h2 className="text-3xl font-bold text-center">{t('home.designedForClarity')}</h2>
          <p className="text-lg text-calm text-center max-w-2xl mx-auto">
            {t('home.clarityDesc')}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-safe bg-accent/5 border-t border-soft">
        <div className="max-w-4xl mx-auto px-safe text-center space-generous">
          <h2 className="text-3xl font-bold">{t('home.readyToConnect')}</h2>
          <p className="text-lg text-calm">
            {t('home.startBuilding')}
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg">
              {t('home.getStarted')}
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-soft bg-card/50 py-8">
        <div className="max-w-6xl mx-auto px-safe text-center text-calm text-sm">
          <p>{t('home.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
