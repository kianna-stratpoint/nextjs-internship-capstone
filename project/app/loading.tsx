export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-baseline font-display text-5xl font-black tracking-tight sm:text-6xl md:text-7xl">
          <span
            className="animate-pulse text-foreground"
            style={{ animationDuration: "1.5s", animationDelay: "0ms" }}
          >
            F
          </span>
          <span
            className="animate-pulse text-foreground"
            style={{ animationDuration: "1.5s", animationDelay: "150ms" }}
          >
            L
          </span>
          <span
            className="animate-pulse text-foreground"
            style={{ animationDuration: "1.5s", animationDelay: "300ms" }}
          >
            O
          </span>
          <span
            className="animate-pulse text-foreground"
            style={{ animationDuration: "1.5s", animationDelay: "450ms" }}
          >
            E
          </span>
          <span
            className="animate-pulse text-brand"
            style={{ animationDuration: "1.5s", animationDelay: "600ms" }}
          >
            .
          </span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p
            className="animate-pulse text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground"
            style={{ animationDuration: "2s" }}
          >
            Structuring Workflow
          </p>

          <div className="h-[1px] w-16 overflow-hidden bg-border sm:w-24">
            <div
              className="h-full w-full animate-pulse bg-foreground"
              style={{ animationDuration: "1.5s", animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
