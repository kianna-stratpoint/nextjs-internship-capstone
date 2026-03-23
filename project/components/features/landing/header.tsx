"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Show } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useTheme } from "@/components/shared/theme-provider"
import dynamic from "next/dynamic"
import { dark } from "@clerk/themes"

const ClerkUserButton = dynamic(
  () =>
    import("@clerk/nextjs").then((mod) => {
      const { ClerkLoading, ClerkLoaded, UserButton } = mod

      return function ClerkUser({ theme }: { theme: string }) {
        const isDark = theme === "dark"

        const customAppearance = {
          baseTheme: isDark ? dark : undefined,
          variables: isDark
            ? {
                colorBackground: "#1a1a1a",
                colorText: "#f5f5f5",
                colorTextSecondary: "#a3a3a3",
                colorInputBackground: "#262626",
                colorInputText: "#f5f5f5",
                colorPrimary: "#3b82f6",
                colorDanger: "#ef4444",
                colorNeutral: "#d4d4d4",
              }
            : undefined,
          elements: isDark
            ? {
                formFieldLabel: { color: "#d4d4d4" },
                formFieldInput: {
                  backgroundColor: "#262626",
                  borderColor: "#404040",
                  color: "#f5f5f5",
                },
                headerTitle: { color: "#f5f5f5" },
                headerSubtitle: { color: "#a3a3a3" },
                profileSectionTitle: { color: "#f5f5f5" },
                profileSectionTitleText: { color: "#f5f5f5" },
                profileSectionContent: { color: "#d4d4d4" },
                profileSectionPrimaryButton: { color: "#f5f5f5" },
                userPreviewMainIdentifier: { color: "#f5f5f5" },
                userPreviewSecondaryIdentifier: { color: "#f5f5f5" },
                navbarButton: { color: "#d4d4d4" },
                navbarButtonActive: { color: "#f5f5f5" },
                badge: { color: "#d4d4d4", backgroundColor: "#333333" },
                menuButton: { color: "#d4d4d4" },
                menuItem: { color: "#d4d4d4" },
                accordionTriggerButton: { color: "#d4d4d4" },
                accordionContent: { color: "#d4d4d4" },
                activeDeviceListItem: { color: "#d4d4d4" },
                activeDevice: { color: "#d4d4d4" },
                deviceInfo: { color: "#a3a3a3" },
              }
            : {},
        }

        return (
          <>
            <ClerkLoading>
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            </ClerkLoading>
            <ClerkLoaded>
              <style jsx global>{`
                .dark .cl-rootBox {
                  color: #f5f5f5;
                }
                .dark .cl-rootBox h1,
                .dark .cl-rootBox h2,
                .dark .cl-rootBox h3 {
                  color: #f5f5f5;
                }
                .dark .cl-rootBox p,
                .dark .cl-rootBox span,
                .dark .cl-rootBox label {
                  color: #d4d4d4;
                }
                .dark .cl-rootBox [class^="cl-internal-"] {
                  color: inherit;
                }
              `}</style>

              <UserButton
                appearance={{
                  ...customAppearance,
                  elements: {
                    ...customAppearance.elements,
                    avatarBox: "h-8 w-8",
                  },
                }}
                userProfileProps={{
                  appearance: customAppearance,
                }}
              />
            </ClerkLoaded>
          </>
        )
      }
    }),
  {
    ssr: false,
    loading: () => <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />,
  }
)

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { theme } = useTheme()

  const currentTheme = theme || "light"

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
            <ClerkUserButton key={currentTheme} theme={currentTheme} />
          </Show>
        </div>

        {/* Mobile: theme toggle + avatar + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <Show when="signed-in">
            <ClerkUserButton key={`mobile-${currentTheme}`} theme={currentTheme} />
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
