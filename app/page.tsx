import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If authenticated, redirect to user's organization dashboard
  if (session?.user) {
    // Import here to avoid circular dependency issues
    const connectDB = (await import('@/lib/db/mongodb')).default;
    const { User, Organization } = await import('@/lib/db/models');
    
    await connectDB();
    
    // Get user from database to find their organization
    const user = await User.findById(session.user.id).select('organizationId').lean() as { organizationId?: { toString(): string } } | null;
    
    if (user?.organizationId) {
      // Get organization slug
      const org = await Organization.findById(user.organizationId).select('slug').lean() as { slug?: string } | null;
      
      if (org?.slug) {
        redirect(`/${org.slug}`);
      }
    }
    
    // If no organization, redirect to signup to complete setup
    // This should only happen if signup didn't create an org properly
    redirect('/signup');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Navigation */}
      <header className="border-b">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Creator Tracker
            </h1>
            <Badge variant="secondary">SaaS</Badge>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <Badge className="mb-4" variant="outline">
            Multi-Tenant Creator Management Platform
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            Track, Manage, and Grow
            <br />
            Your Creator Network
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
            Streamline creator collaboration, track performance metrics, and manage projects all in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Features Section */}
        <section id="features" className="py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Everything You Need</h3>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Powerful features designed for modern creator management teams
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Real-Time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track engagement, reach, and performance metrics across all your creators and projects with live updates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Multi-Tenant Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage multiple organizations, projects, and creator teams with complete data isolation and security.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  Project Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize creator campaigns, track deliverables, and manage workflows from a single dashboard.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Content Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor post submissions, approvals, and performance metrics with detailed analytics and insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  Smart Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Stay updated with real-time notifications for submissions, approvals, and important project updates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  Enterprise Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built with Better Auth and MongoDB for robust authentication, data protection, and compliance.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* CTA Section */}
        <section className="py-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/50 dark:to-violet-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join teams already using Creator Tracker to manage their creator networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>© 2024 Creator Tracker. Built with Next.js, MongoDB, and Better Auth.</p>
        </div>
      </footer>
    </div>
  );
}
