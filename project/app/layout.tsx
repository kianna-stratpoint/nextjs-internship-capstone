// DONE: Task 2.1 - Set up Clerk authentication service
// DONE: Task 2.1 - Wrap with ClerkProvider once Clerk is set up
import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Syne } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/shared/theme-provider"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FLOE. | Project Management",
  description:
    "Flow Like Operations Engineering — where your team's work moves with intention, not friction.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${syne.variable}`}>
        <body className="font-body">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
