import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getUserId } from "@/lib/auth"

function DecorativeCurveUpLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMinYMin slice"
    >
      <path
        d="M-52.708 1.40859C205.976 96.1006 68.4864 209.419 -9.75002 247.867"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

function DecorativeCurveLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMinYMin slice"
    >
      <path
        d="M612.695 0.891571C302.458 420.636 129.518 -241.368 -250 228.758"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

function DecorativeCurveRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMaxYMin slice"
    >
      <path
        d="M1.00806 117.883C324.508 -175.698 516.508 358.802 743.008 0.801942"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

export async function Hero() {
  const userId = await getUserId()
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 md:pb-32 md:pt-28">
      {/* Upper-left small curve */}
      <DecorativeCurveUpLeft className="pointer-events-none absolute -left-4 top-16 h-[250px] w-auto text-muted-foreground/50 sm:-left-2 sm:top-10 sm:h-[320px] md:left-4 md:top-24 md:h-[420px] lg:left-8 lg:top-28 lg:h-[480px]" />

      {/* Main left curve */}
      <DecorativeCurveLeft className="pointer-events-none absolute -left-4 top-24 h-[400px] w-auto text-muted-foreground/50 sm:-left-2 sm:top-16 sm:h-[500px] md:left-4 md:top-32 md:h-[650px] lg:left-8 lg:top-36 lg:h-[750px]" />

      {/* Right curve */}
      <DecorativeCurveRight className="pointer-events-none absolute -right-2 top-32 h-[250px] w-auto text-muted-foreground/50 sm:right-0 sm:top-32 sm:h-[320px] md:right-4 md:top-40 md:h-[420px] lg:right-10 lg:top-44 lg:h-[480px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="mb-3 text-lg tracking-wide text-foreground sm:text-xl md:mb-4 md:text-2xl">
          Move With Clarity
        </p>

        <h1 className="mb-5 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:mb-6 md:text-7xl lg:text-8xl">
          Structure Your
          <br />
          Workflow
        </h1>

        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed sm:max-w-lg sm:text-base md:mb-10 md:max-w-xl md:text-lg">
          Go with the FLOE — where your work moves with intention, not friction.
        </p>

        {userId ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:px-7 sm:text-base"
          >
            Continue to Dashboard
            <ArrowRight size={16} />
          </Link>
        ) : (
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:px-7 sm:text-base"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </section>
  )
}
