"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    //console.error("[Dashboard Error]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">Something went wrong</h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We encountered an unexpected error while loading this page. This has been logged and
          we&apos;ll look into it.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="text-foreground"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
