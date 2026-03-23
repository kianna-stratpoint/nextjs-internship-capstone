"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    //console.error("[Project Error]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Failed to load project
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We couldn&apos;t load this project. It may have been deleted, or there was a temporary
          issue with the connection.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" className="text-foreground" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}