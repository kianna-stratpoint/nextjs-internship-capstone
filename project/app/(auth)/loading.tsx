export default function AuthLoading() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      {/* Brand Header */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex items-baseline font-display text-3xl font-black tracking-tight">
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

        {/* Skeleton Subtitle */}
        <div
          className="h-4 w-3/4 animate-pulse rounded bg-muted"
          style={{ animationDelay: "150ms" }}
        />
      </div>

      {/* Skeleton Form Fields */}
      <div className="grid gap-4">
        {/* Field 1 */}
        <div className="space-y-2">
          <div
            className="h-4 w-1/4 animate-pulse rounded bg-muted"
            style={{ animationDelay: "300ms" }}
          />
          <div
            className="h-10 w-full animate-pulse rounded-md bg-muted/50"
            style={{ animationDelay: "300ms" }}
          />
        </div>

        {/* Field 2 */}
        <div className="space-y-2">
          <div
            className="h-4 w-1/4 animate-pulse rounded bg-muted"
            style={{ animationDelay: "450ms" }}
          />
          <div
            className="h-10 w-full animate-pulse rounded-md bg-muted/50"
            style={{ animationDelay: "450ms" }}
          />
        </div>

        {/* Skeleton Submit Button */}
        <div
          className="mt-2 h-10 w-full animate-pulse rounded-md bg-primary/40"
          style={{ animationDelay: "600ms" }}
        />
      </div>

      {/* Skeleton Footer Link */}
      <div
        className="mx-auto h-4 w-2/3 animate-pulse rounded bg-muted"
        style={{ animationDelay: "750ms" }}
      />
    </div>
  )
}
