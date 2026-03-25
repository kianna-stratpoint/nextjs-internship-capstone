"use client"

import dynamic from "next/dynamic"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Menu } from "lucide-react"
import { useTheme } from "@/components/shared/theme-provider"
import { useUIStore } from "@/stores/ui-store"
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

const NotificationBell = dynamic(
  () =>
    import("@/components/features/notifications/notification-bell").then(
      (mod) => mod.NotificationBell
    ),
  { ssr: false }
)

export function TopNav() {
  const { theme } = useTheme()
  const { openSidebar } = useUIStore()

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={openSidebar}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell />
        <ClerkUserButton theme={theme} />
      </div>
    </header>
  )
}
