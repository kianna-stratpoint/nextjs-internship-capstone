"use client"

import { useTheme } from "./theme-provider"
import { Moon, Sun } from "lucide-react"
import Link from "next/link"

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b border-french_gray-300 bg-white/80 backdrop-blur-sm dark:border-payne's_gray-400 dark:bg-outer_space-500/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue_munsell-500">
              TaskFlow
            </Link>
          </div>

          <nav className="hidden space-x-8 md:flex">
            <Link
              href="#features"
              className="text-outer_space-500 transition-colors hover:text-blue_munsell-500 dark:text-platinum-500"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-outer_space-500 transition-colors hover:text-blue_munsell-500 dark:text-platinum-500"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="text-outer_space-500 transition-colors hover:text-blue_munsell-500 dark:text-platinum-500"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-lg bg-platinum-500 p-2 text-outer_space-500 transition-colors hover:bg-french_gray-500 dark:bg-payne's_gray-500 dark:text-platinum-500 dark:hover:bg-payne's_gray-400"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <Link
              href="/dashboard"
              className="rounded-lg bg-blue_munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue_munsell-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
