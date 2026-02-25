"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-lg border border-french_gray-300 bg-platinum-500 p-2 text-outer_space-500 transition-colors hover:bg-french_gray-500 dark:border-payne's_gray-400 dark:bg-payne's_gray-500 dark:text-platinum-500 dark:hover:bg-payne's_gray-400"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
