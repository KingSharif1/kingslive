import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — King Sharif",
  description: "Terms of Service for Ctroom, a personal finance dashboard by King Sharif.",
}

export default function TermsPage() {
  const lastUpdated = "May 25, 2025"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal nav */}
      <nav className="border-b border-border/40 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            ← King Sharif
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="space-y-2 mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Legal</p>
          <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using <strong className="text-foreground">Ctroom</strong> ("the App"), you agree to be bound by these Terms of Service. The App is built and maintained by King Sharif (<a href="mailto:sharifahmed.dev@gmail.com" className="text-foreground underline underline-offset-2">sharifahmed.dev@gmail.com</a>).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Ctroom is a <strong className="text-foreground">personal finance dashboard</strong> designed for the exclusive personal use of its creator. It connects to bank accounts via Plaid and Teller APIs to display transactions, account balances, budgets, recurring payments, savings goals, and financial insights.
            </p>
            <p className="text-muted-foreground mt-3">
              The App is <strong className="text-foreground">not a public service</strong>. It does not accept registrations from the general public, does not provide financial advice, and is not regulated as a financial institution.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Personal Use Only</h2>
            <p className="text-muted-foreground">
              The App is intended solely for personal, non-commercial use by its owner. Access is restricted to authenticated users only. Unauthorized access or use of this App is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Financial Data & Third-Party Connections</h2>
            <p className="text-muted-foreground">
              The App connects to financial institutions through <strong className="text-foreground">Plaid</strong> and <strong className="text-foreground">Teller</strong>. By using these integrations, you also agree to their respective terms of service:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-1.5 text-muted-foreground mt-3">
              <li>
                <a href="https://plaid.com/legal/#end-user-privacy-policy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Plaid End User Privacy Policy</a>
              </li>
              <li>
                <a href="https://teller.io/legal/terms" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Teller Terms of Service</a>
              </li>
            </ul>
            <p className="text-muted-foreground mt-3">
              The App retrieves financial data for display purposes only. It does not initiate payments, transfers, or any financial transactions on behalf of users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Data Accuracy</h2>
            <p className="text-muted-foreground">
              Financial data displayed in the App is sourced from connected bank accounts via third-party APIs. The accuracy of this data depends on the reliability of those APIs and the connected financial institutions. The App makes no guarantee that displayed balances, transactions, or categorizations are accurate or complete.
            </p>
            <p className="text-muted-foreground mt-3">
              The App is <strong className="text-foreground">not a substitute for official bank statements</strong>. Always verify important financial information directly with your financial institution.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. No Financial Advice</h2>
            <p className="text-muted-foreground">
              Nothing in the App constitutes financial, investment, tax, or legal advice. AI-generated insights within the App are informational only and should not be relied upon for financial decisions. Consult a qualified financial advisor for advice specific to your situation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              The App is provided <strong className="text-foreground">"as is"</strong> without warranties of any kind, either express or implied. The creator does not warrant that the App will be uninterrupted, error-free, or that defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by applicable law, King Sharif shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use the App, including any loss of data or financial loss.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Changes to These Terms</h2>
            <p className="text-muted-foreground">
              These Terms may be updated at any time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of the App after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the State of Illinois, United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">11. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these Terms can be directed to{" "}
              <a href="mailto:sharifahmed.dev@gmail.com" className="text-foreground underline underline-offset-2">
                sharifahmed.dev@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/40 px-6 py-8 mt-16">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} King Sharif</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
