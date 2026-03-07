"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Show, UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo + desktop nav */}
        <div className="flex items-center gap-16">
          <Link href="/" className="font-display text-3xl font-black tracking-tight">
            FLOE<span className="text-brand">.</span>
          </Link>
          <nav className="hidden items-center gap-16 text-lg text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#preview" className="transition-colors hover:text-foreground">
              Preview
            </a>
          </nav>
        </div>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-lg border border-border px-4 py-2.5 text-base font-medium transition-colors hover:bg-accent"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </Show>

          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-lg border border-border px-4 py-2.5 text-base font-medium transition-colors hover:bg-accent"
            >
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </div>

        {/* Mobile: theme toggle + avatar + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <Show when="signed-in">
            <UserButton />
          </Show>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Preview
            </a>

            <div className="my-2 h-px bg-border" />

            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="rounded-lg border border-border px-3 py-2.5 text-center text-base font-normal transition-colors hover:bg-accent"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-primary px-3 py-2.5 text-center text-base font-normal text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
            </Show>

            <Show when="signed-in">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-primary px-3 py-2.5 text-center text-base font-normal text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to Dashboard
              </Link>
            </Show>
          </nav>
        </div>
      )}
    </header>
  )
}
