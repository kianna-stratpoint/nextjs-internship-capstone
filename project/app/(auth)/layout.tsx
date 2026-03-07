import Link from "next/link"
import type React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Logo — top left */}
      <div className="relative z-20 px-6 pt-6 sm:px-10 sm:pt-8">
        <Link
          href="/"
          className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl"
        >
          FLOE<span className="text-brand">.</span>
        </Link>
      </div>

      {/* Decorative curve — top-left flowing down */}
      <svg
        viewBox="30 -200 400 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -left-8 top-0 h-[60vh] w-auto text-foreground sm:h-[70vh] md:-left-4 md:h-[80vh]"
        aria-hidden="true"
      >
        <path
          d="M0.51562 1.4086C259.2 96.1006 121.71 209.419 43.4736 247.867"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      {/* Decorative curve — left flowing down */}
      <svg
        viewBox="0 -500 700 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -left-8 top-0 h-[60vh] w-auto text-foreground sm:h-[70vh] md:-left-4 md:h-[80vh]"
        aria-hidden="true"
      >
        <path
          d="M863.862 0.891571C553.625 420.636 380.685 -241.368 1.16718 228.758"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      {/* Decorative curve — bottom, flowing right */}
      <svg
        viewBox="-800 0 5000 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute bottom-0 left-[10%] h-[30vh] w-auto text-foreground sm:left-[15%] md:left-[20%] md:h-[35vh]"
        aria-hidden="true"
      >
        <path
          d="M0.942139 58.1566C264.439 -154.538 500.53 320.526 667.875 42.2685"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      {/* Content area — card pushed to center-right */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
