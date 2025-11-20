import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Hero } from "@/components/ui/hero";
import { Features } from "@/components/ui/features";
import { Pricing } from "@/components/ui/pricing";
// import type { PricingTier } from "@/components/ui/pricing";
import { BarChart3, Users, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If authenticated, redirect to appropriate dashboard based on user role
  if (session?.user) {
    // Import here to avoid circular dependency issues
    const connectDB = (await import('@/lib/db/mongodb')).default;
    const { User, Organization } = await import('@/lib/db/models');

    await connectDB();

    // Get user from database to find their role and organization
    const user = await User.findById(session.user.id).select('role organizationId').lean() as {
      role?: 'admin' | 'creator' | 'saas-admin';
      organizationId?: { toString(): string };
    } | null;

    if (!user) {
      // User not found in database, redirect to signup
      redirect('/signup');
    }

    // Redirect based on user role
    if (user.role === 'creator') {
      // Creators go to their creator dashboard
      redirect(`/creator/${session.user.id}`);
    } else if (user.role === 'admin' || user.role === 'saas-admin') {
      // Admins and SaaS admins go to their organization dashboard
      if (user.organizationId) {
        // Get organization slug
        const org = await Organization.findById(user.organizationId).select('slug').lean() as { slug?: string } | null;

        if (org?.slug) {
          redirect(`/${org.slug}`);
        }
      }

      // If no organization, redirect to signup to complete setup
      redirect('/signup');
    }

    // Fallback: unknown role, redirect to signup
    redirect('/signup');
  }

  return (
    <div className="min-h-screen bg-[#f3f1ea]">
      {/* Navigation */}
      <header className="border-b border-zinc-200/50 bg-[#f3f1ea]">
        <nav className="container mx-auto px-4 py-4 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">
              Collab
            </h1>
          </div>
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            {/* <Button variant="ghost" asChild className="whitespace-nowrap">
              <Link href="/login">Login</Link>
            </Button> */}
            <Button asChild className="whitespace-nowrap bg-zinc-900 hover:bg-zinc-800">
              <Link href="/signup">Join the waitlist</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="overflow-x-hidden">
        {/* Hero Section */}
        <Hero
          eyebrow="THE CREATOR MANAGEMENT PLATFORM"
          title={
            <div className="font-serif font-normal">
              <span>Your creators, </span>
              <span className="italic">seamlessly </span>
              <span>connected </span>
              <span className="whitespace-nowrap">to your workflow</span>
            </div>
          }
          subtitle="Collab brings your creator partnerships, content tracking, and performance metrics together so you can focus on growing results, not managing spreadsheets"
          ctaText="Join the waitlist"
          ctaLink="/signup"
          mockupImage={{
            src: "/images/mockup.avif",
            alt: "Collab Dashboard Interface",
            width: 1600,
            height: 1200
          }}
        />

        <Separator className="my-12 container mx-auto bg-zinc-200" />

        {/* Features Section */}
        <Features />

        <Separator className="my-12 container mx-auto bg-zinc-200" />

        {/* Pricing Section */}
        <section className="bg-[#f3f1ea]">
          <Pricing
            tag="PRICING"
            title="Start managing creators today"
            description="Choose the plan that fits your team's needs"
            tiers={[
              {
                name: "Starter",
                icon: <Users className="w-6 h-6" />,
                price: 29,
                description: "Perfect for small teams getting started",
                features: [
                  "Up to 5 creators",
                  "Basic analytics dashboard",
                  "Content approval workflow",
                  "Email support",
                  "30-day data history",
                ],
                cta: "Start free trial",
              },
              {
                name: "Professional",
                icon: <BarChart3 className="w-6 h-6" />,
                price: 99,
                description: "For growing teams managing multiple campaigns",
                features: [
                  "Up to 25 creators",
                  "Advanced analytics & insights",
                  "Project management tools",
                  "Priority support",
                  "Unlimited data history",
                  "Custom branding",
                ],
                popular: true,
                cta: "Start free trial",
              },
              {
                name: "Enterprise",
                icon: <Sparkles className="w-6 h-6" />,
                price: 0,
                description: "For agencies and large organizations",
                features: [
                  "Unlimited creators",
                  "Custom integrations",
                  "Dedicated account manager",
                  "SLA guarantee",
                  "Advanced security & compliance",
                  "API access",
                ],
                cta: "Contact sales",
              },
            ]}
          />
        </section>

        <Separator className="my-12 container mx-auto bg-zinc-200" />

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-zinc-900 text-white rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal text-white mb-6 leading-tight">
                  Ready to streamline your creator operations?
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-[22px] text-zinc-300 mb-10 max-w-3xl mx-auto leading-relaxed font-sans">
                  Join teams managing thousands of creator partnerships with Collab
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    asChild
                    className="w-full bg-white text-zinc-900 hover:bg-zinc-100 px-8 py-6 text-base sm:w-auto sm:text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Link href="/signup">Join the waitlist</Link>
                  </Button>
                  {/* <Button
                    size="lg"
                    variant="ghost"
                    asChild
                    className="w-full border-2 border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 px-8 py-6 text-base sm:w-auto sm:text-lg font-medium rounded-xl transition-all"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button> */}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-[#f3f1ea]">
        <div className="container mx-auto px-4 py-10 text-center">
          <p className="text-sm text-zinc-600">© 2024 Collab. Built for creator-first teams.</p>
        </div>
      </footer>
    </div>
  );
}
