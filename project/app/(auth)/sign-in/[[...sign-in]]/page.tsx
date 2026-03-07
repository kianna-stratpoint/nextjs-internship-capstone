// DONE: Task 2.3 - Create sign-in and sign-up pages
// DONE: Task 2.3 - Replace with actual Clerk SignIn component
import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | FLOE.",
  description: "Sign in to your FLOE. account",
}

export default function SignInPage() {
  return (
    <SignIn
      forceRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: "#000000",
          colorText: "#000000",
          colorTextSecondary: "#6B7280",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#000000",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-body), sans-serif",
        },
        elements: {
          card: "shadow-none border border-border",
          headerTitle: "font-display font-bold",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border border-border text-foreground hover:bg-accent",
          socialButtonsBlockButtonText: "font-medium",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldLabel: "text-xs font-semibold uppercase tracking-wide",
          formFieldInput: "border-border focus:border-ring focus:ring-1 focus:ring-ring",
          formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg",
          footerActionLink: "text-foreground font-semibold hover:text-brand",
          footer: "text-muted-foreground",
        },
      }}
    />
  )
}
