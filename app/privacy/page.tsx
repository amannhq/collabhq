import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Collab - Learn how we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f3f1ea]">
      {/* Navigation */}
      <header className="border-b border-zinc-200/50 bg-[#f3f1ea]">
        <nav className="container mx-auto px-4 py-4 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold text-zinc-900 hover:opacity-80 transition-opacity">
              Collab
            </Link>
          </div>
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            <Button asChild className="whitespace-nowrap bg-zinc-900 hover:bg-zinc-800">
              <Link href="/signup">Join the waitlist</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-zinc max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">1. Introduction</h2>
              <p className="text-zinc-700 mb-4">
                Welcome to Collab. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our creator management platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-zinc-800 mb-3">2.1 Information You Provide</h3>
              <p className="text-zinc-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Account information (name, email address, password)</li>
                <li>Organization details (company name, role)</li>
                <li>Creator information and partnership data</li>
                <li>Content and files you upload to the platform</li>
                <li>Communication preferences and support requests</li>
              </ul>

              <h3 className="text-xl font-semibold text-zinc-800 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-zinc-700 mb-4">
                When you use our platform, we automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information (operating system, device identifiers)</li>
                <li>Usage data (features used, time spent, interactions)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-zinc-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and manage your account</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and optimize user experience</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-zinc-700 mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li><strong>With your consent:</strong> We may share information when you give us explicit permission</li>
                <li><strong>Service providers:</strong> We work with third-party providers who perform services on our behalf</li>
                <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Within your organization:</strong> Information may be shared with members of your organization as needed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">5. Data Security</h2>
              <p className="text-zinc-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Employee training on data protection practices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">6. Data Retention</h2>
              <p className="text-zinc-700 mb-4">
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. When you delete your account, we will delete or anonymize your personal data, except where we are required to retain it for legal obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-zinc-700 mb-4">
                Depending on your location, you may have certain rights regarding your personal data, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Access, update, or delete your personal information</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent where processing is based on consent</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              <p className="text-zinc-700 mb-4">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-zinc-700 mb-4">
                We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, though some features of our platform may not function properly if you disable cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">9. International Data Transfers</h2>
              <p className="text-zinc-700 mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in compliance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-zinc-700 mb-4">
                Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal data, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-zinc-700 mb-4">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new privacy policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">12. Contact Us</h2>
              <p className="text-zinc-700 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </p>
              <p className="text-zinc-700">
                Email: <a href="mailto:privacy@collabhq.in" className="text-zinc-900 underline hover:text-zinc-700">privacy@collabhq.in</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-[#f3f1ea] mt-12">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-zinc-600 mb-4">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms & Conditions</Link>
          </div>
          <p className="text-sm text-zinc-600 text-center">© 2024 Collab. Built for creator-first teams.</p>
        </div>
      </footer>
    </div>
  );
}
