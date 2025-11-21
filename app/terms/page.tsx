import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for Collab - Terms of service for using our creator management platform",
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Terms & Conditions</h1>
          <p className="text-sm text-zinc-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-zinc max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-zinc-700 mb-4">
                By accessing or using Collab (&quot;the Platform&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">2. Description of Service</h2>
              <p className="text-zinc-700 mb-4">
                Collab is a creator management platform that enables organizations to manage creator partnerships, track content performance, and streamline collaboration workflows. The Service includes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Creator relationship management tools</li>
                <li>Project and campaign tracking</li>
                <li>Performance analytics and reporting</li>
                <li>Content approval workflows</li>
                <li>Team collaboration features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">3. Account Registration</h2>
              <p className="text-zinc-700 mb-4">
                To use the Service, you must:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <p className="text-zinc-700 mb-4">
                You may not use another person&apos;s account without permission. We reserve the right to refuse service or terminate accounts at our discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">4. User Responsibilities</h2>
              <p className="text-zinc-700 mb-4">
                You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Use the Service only for lawful purposes</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not violate any third-party rights</li>
                <li>Not upload harmful code, viruses, or malicious software</li>
                <li>Not attempt to gain unauthorized access to the Service</li>
                <li>Not interfere with or disrupt the Service</li>
                <li>Not use the Service to send spam or unsolicited communications</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">5. Content and Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-zinc-800 mb-3">5.1 Your Content</h3>
              <p className="text-zinc-700 mb-4">
                You retain ownership of content you upload to the Platform (&quot;Your Content&quot;). By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display Your Content solely for the purpose of providing the Service.
              </p>

              <h3 className="text-xl font-semibold text-zinc-800 mb-3">5.2 Our Content</h3>
              <p className="text-zinc-700 mb-4">
                The Platform and its original content, features, and functionality are owned by Collab and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">6. Subscription and Payments</h2>
              <h3 className="text-xl font-semibold text-zinc-800 mb-3">6.1 Subscription Plans</h3>
              <p className="text-zinc-700 mb-4">
                The Service is offered through various subscription plans. Pricing and features are described on our pricing page and may be updated from time to time.
              </p>

              <h3 className="text-xl font-semibold text-zinc-800 mb-3">6.2 Billing</h3>
              <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-2">
                <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                <li>Payments are non-refundable except as required by law</li>
                <li>You are responsible for providing accurate billing information</li>
                <li>We may change fees with 30 days&apos; notice to existing subscribers</li>
                <li>Failure to pay may result in service suspension or termination</li>
              </ul>

              <h3 className="text-xl font-semibold text-zinc-800 mb-3">6.3 Free Trials</h3>
              <p className="text-zinc-700 mb-4">
                We may offer free trials for new users. At the end of the trial period, you will be charged unless you cancel before the trial ends.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">7. Cancellation and Termination</h2>
              <h3 className="text-xl font-semibold text-zinc-800 mb-3">7.1 By You</h3>
              <p className="text-zinc-700 mb-4">
                You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period.
              </p>

              <h3 className="text-xl font-semibold text-zinc-800 mb-3">7.2 By Us</h3>
              <p className="text-zinc-700 mb-4">
                We reserve the right to suspend or terminate your access to the Service if you violate these Terms, engage in fraudulent activity, or for any other reason at our discretion. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">8. Data and Privacy</h2>
              <p className="text-zinc-700 mb-4">
                Your use of the Service is also governed by our Privacy Policy. We take data security seriously and implement appropriate measures to protect your information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-zinc-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLLAB SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-zinc-700 mb-4">
                OUR TOTAL LIABILITY FOR ANY CLAIMS UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-zinc-700 mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-zinc-700 mb-4">
                We do not warrant that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">11. Indemnification</h2>
              <p className="text-zinc-700 mb-4">
                You agree to indemnify and hold harmless Collab, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">12. Third-Party Services</h2>
              <p className="text-zinc-700 mb-4">
                The Service may contain links to third-party websites or services that are not owned or controlled by Collab. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">13. Changes to Terms</h2>
              <p className="text-zinc-700 mb-4">
                We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or through a notice on the Service. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">14. Governing Law</h2>
              <p className="text-zinc-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Collab operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">15. Dispute Resolution</h2>
              <p className="text-zinc-700 mb-4">
                Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through good faith negotiations. If negotiations fail, disputes shall be resolved through binding arbitration in accordance with the rules of the jurisdiction&apos;s arbitration association.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">16. Severability</h2>
              <p className="text-zinc-700 mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">17. Contact Information</h2>
              <p className="text-zinc-700 mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-zinc-700">
                Email: <a href="mailto:legal@collabhq.in" className="text-zinc-900 underline hover:text-zinc-700">legal@collabhq.in</a>
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
