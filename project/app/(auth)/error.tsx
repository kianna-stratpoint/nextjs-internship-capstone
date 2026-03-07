"use client"

import Link from "next/link"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="mb-2 font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        We ran into an issue during authentication. Please try again.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/sign-in"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
