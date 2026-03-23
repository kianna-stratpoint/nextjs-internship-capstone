import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="font-display text-lg font-black tracking-tight">
          FLOE<span className="text-brand">.</span>
        </div>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
          <a
            href="https://github.com/kianna-stratpoint/nextjs-internship-capstone"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Github
          </a>
        </nav>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FLOE. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
