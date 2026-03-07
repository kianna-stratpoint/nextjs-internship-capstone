"use client"

import { UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Menu, Bell } from "lucide-react"

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

      {/* Spacer — pushes right actions to the end */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell size={18} />
        </button>

        {/* Clerk UserButton — shows avatar, sign-out, manage account */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  )
}
