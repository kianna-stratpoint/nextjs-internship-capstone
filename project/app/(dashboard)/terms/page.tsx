import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | FLOE.",
  description: "Terms of Service for the FLOE Capstone Project",
}

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="space-y-8 text-muted-foreground">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing and using FLOE (&quot;the Application&quot;), you acknowledge that you have
            read, understood, and agree to be bound by these Terms of Service. If you do not agree
            to these terms, please do not use the Application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            2. Educational Purpose Disclaimer
          </h2>
          <p className="leading-relaxed">
            FLOE is an academic capstone project created for educational, demonstration, and
            portfolio purposes. It is not intended to be used as a production-ready enterprise tool
            for managing real, mission-critical business operations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">3. User Conduct and Content</h2>
          <p className="leading-relaxed">
            You are entirely responsible for the content of, and any harm resulting from, the data
            you input into the Application. By using FLOE, you agree not to:
          </p>
          <ul className="list-inside list-disc space-y-2 leading-relaxed">
            <li>Upload any confidential, proprietary, or highly sensitive real-world data.</li>
            <li>Use the Application for any unlawful purposes or to conduct illegal activities.</li>
            <li>
              Attempt to disrupt, exploit, or intentionally degrade the performance of the
              Application.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            4. &quot;As Is&quot; Availability
          </h2>
          <p className="leading-relaxed">
            The Application is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
            We make no warranties, expressed or implied, and hereby disclaim all warranties,
            including without limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement.
          </p>
          <p className="leading-relaxed">
            Because this is a student project, the database may be periodically reset, and we do not
            guarantee the long-term retention or safety of your data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">5. Limitation of Liability</h2>
          <p className="leading-relaxed">
            In no event shall the developer(s) of FLOE be liable for any damages (including, without
            limitation, damages for loss of data or profit, or due to business interruption) arising
            out of the use or inability to use the materials on the Application.
          </p>
        </section>
      </div>
    </main>
  )
}
