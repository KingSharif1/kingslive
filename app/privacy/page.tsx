import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — King Sharif",
  description: "Privacy Policy for Ctroom, a personal finance dashboard by King Sharif.",
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Overview</h2>
            <p className="text-muted-foreground">
              This Privacy Policy describes how <strong className="text-foreground">Ctroom</strong> ("the App"), a personal finance dashboard created and operated by King Sharif (<a href="mailto:sharifahmed.dev@gmail.com" className="text-foreground underline underline-offset-2">sharifahmed.dev@gmail.com</a>), handles information. Ctroom is a <strong className="text-foreground">personal-use application</strong> — it is not a commercial product and has no public users other than the owner.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Information Collected</h2>
            <p className="text-muted-foreground mb-3">The App collects the following data solely for the purpose of displaying personal financial information to its single owner:</p>
            <ul className="list-disc list-outside ml-5 space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">Bank account information</strong> — account names, types, and current balances retrieved via Plaid or Teller bank connection APIs.</li>
              <li><strong className="text-foreground">Transaction data</strong> — transaction descriptions, amounts, dates, merchant names, and categories retrieved from connected bank accounts.</li>
              <li><strong className="text-foreground">Manually entered data</strong> — budget categories, savings goals, debt entries, and subscription records entered directly by the owner.</li>
              <li><strong className="text-foreground">Authentication data</strong> — email address and session tokens used to secure access to the dashboard, managed via Supabase Auth.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. How Information Is Used</h2>
            <p className="text-muted-foreground mb-3">All collected data is used exclusively to:</p>
            <ul className="list-disc list-outside ml-5 space-y-1.5 text-muted-foreground">
              <li>Display account balances, transaction history, and spending trends within the App.</li>
              <li>Calculate budgets, net worth, and financial health scores.</li>
              <li>Detect recurring charges and forecast upcoming payments.</li>
              <li>Power AI-assisted financial insights within the App.</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Data is <strong className="text-foreground">never sold, shared, or used for advertising</strong>. No third party has access to this data for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Data Storage</h2>
            <p className="text-muted-foreground">
              All financial data is stored in a private <strong className="text-foreground">Supabase</strong> (PostgreSQL) database accessible only to the App owner. Data is encrypted in transit (TLS) and at rest. No financial data is stored in browser local storage or cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">The App uses the following third-party services, each with their own privacy policies:</p>
            <ul className="list-disc list-outside ml-5 space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Plaid</strong> — used to connect bank accounts and retrieve transaction data.{" "}
                <a href="https://plaid.com/legal/#privacy-policy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Plaid Privacy Policy</a>
              </li>
              <li>
                <strong className="text-foreground">Teller</strong> — alternative bank connection provider.{" "}
                <a href="https://teller.io/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Teller Privacy Policy</a>
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> — database and authentication infrastructure.{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Supabase Privacy Policy</a>
              </li>
              <li>
                <strong className="text-foreground">Google (Gemini API)</strong> — used to generate AI summaries of commit history and financial insights.{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Google Privacy Policy</a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Cookies & Tracking</h2>
            <p className="text-muted-foreground">
              The App does not use advertising cookies, analytics trackers, or any third-party tracking scripts. Session cookies are used solely to maintain authenticated access and expire when the browser session ends.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground">
              Data is retained for as long as the App is in use. The owner may delete all stored data at any time by clearing the database. Bank connection tokens may be revoked at any time through Plaid or Teller's respective dashboards.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Security</h2>
            <p className="text-muted-foreground">
              Access to the App is protected by Supabase authentication. All API communication uses HTTPS. Bank credentials are never stored — only access tokens issued by Plaid or Teller are retained, and these can be revoked at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              This policy may be updated as the App evolves. The "Last updated" date at the top of this page will reflect the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Contact</h2>
            <p className="text-muted-foreground">
              Questions about this privacy policy can be directed to{" "}
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
