"use client"

import dynamic from "next/dynamic"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Menu } from "lucide-react"

const ClerkUserButton = dynamic(
  () =>
    import("@clerk/nextjs").then((mod) => {
      const { ClerkLoading, ClerkLoaded, UserButton } = mod
      return function ClerkUser() {
        return (
          <>
            <ClerkLoading>
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            </ClerkLoading>
            <ClerkLoaded>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
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

const NotificationBell = dynamic(
  () =>
    import("@/components/features/notifications/notification-bell").then(
      (mod) => mod.NotificationBell
    ),
  { ssr: false }
)

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell />
        <ClerkUserButton />
      </div>
    </header>
  )
}
