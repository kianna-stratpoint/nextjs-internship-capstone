import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | FLOE.",
  description: "Privacy Policy for the FLOE Capstone Project",
}

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
          <p className="leading-relaxed">
            Welcome to FLOE (&quot;Flow Like Operations Engineering&quot;). Please note that this
            application is an academic capstone project developed for educational and portfolio
            demonstration purposes. This Privacy Policy explains how we collect, use, and protect
            your information when you interact with our application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
          <p className="leading-relaxed">
            Because this is a demonstration environment, we only collect the minimum amount of data
            required to showcase the application&apos;s functionality:
          </p>
          <ul className="list-inside list-disc space-y-2 leading-relaxed">
            <li>
              <strong>Authentication Data:</strong> When you sign up, our authentication provider
              (Clerk) processes your email address and basic profile information (like your name and
              profile image).
            </li>
            <li>
              <strong>Application Data:</strong> We store the data you actively create within the
              app, such as projects, kanban boards, tasks, and comments.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <p className="leading-relaxed">
            The data collected is used <strong>strictly</strong> to provide and demonstrate the
            features of the FLOE application. We do not sell, rent, or share your personal
            information with third parties for commercial purposes. Your data is used solely to
            maintain your session and render your personal workspaces.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
          <p className="leading-relaxed">
            While we use industry-standard third-party services (such as Clerk for authentication
            and a secure database provider) to protect your data, please remember that this is a
            student capstone project.{" "}
            <strong>
              Do not upload, input, or share any sensitive, personal, or confidential real-world
              information
            </strong>{" "}
            in this application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">5. Your Rights</h2>
          <p className="leading-relaxed">
            You have the right to access the data you have input into FLOE and the right to request
            its deletion. You can delete your account and all associated data at any time through
            the user profile settings provided by our authentication system.
          </p>
        </section>
      </div>
    </main>
  )
}
