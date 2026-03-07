/* ============================================
   Collects: First Name, Last Name, Role
   Saves to: Clerk unsafeMetadata + updates user profile
   Redirects to: /dashboard on completion
   
   Uses Clerk unsafeMetadata for now.
   Phase 3: migrate to database storage.
   ============================================ */

"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"

const roles = ["Project Manager", "Developer", "Designer", "QA", "DevOps", "Stakeholder"] as const

function OnboardingForm({ user }: { user: NonNullable<ReturnType<typeof useUser>["user"]> }) {
  const [firstName, setFirstName] = useState(user.firstName ?? "")
  const [lastName, setLastName] = useState(user.lastName ?? "")
  const [role, setRole] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim() || !role) {
      setError("Please fill in all fields.")
      return
    }

    setIsSubmitting(true)

    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role,
          onboardingComplete: true,
        },
      })

      window.location.href = "/dashboard"
    } catch {
      setError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          >
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          >
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          >
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="" disabled>
              Select your role
            </option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Setting up..." : "Continue to Dashboard"}
        </button>
      </form>
    </div>
  )
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome to FLOE<span className="text-brand">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let&apos;s set up your profile to get started.
          </p>
        </div>

        <OnboardingForm user={user} />
      </div>
    </div>
  )
}
