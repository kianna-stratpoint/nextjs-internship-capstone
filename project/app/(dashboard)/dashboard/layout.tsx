"use client"

import type React from "react"

import { useState, Suspense } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Home,
  FolderOpen,
  Users,
  Settings,
  Menu,
  X,
  BarChart3,
  Calendar,
  Bell,
  Search,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, current: true },
  { name: "Projects", href: "/projects", icon: FolderOpen, current: false },
  { name: "Team", href: "/team", icon: Users, current: false },
  { name: "Analytics", href: "/analytics", icon: BarChart3, current: false },
  { name: "Calendar", href: "/calendar", icon: Calendar, current: false },
  { name: "Settings", href: "/settings", icon: Settings, current: false },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-platinum-900 dark:bg-outer_space-600">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-french_gray-300 bg-white transition-transform duration-300 ease-in-out dark:border-payne's_gray-400 dark:bg-outer_space-500 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-french_gray-300 px-6 dark:border-payne's_gray-400">
          <Link href="/" className="text-2xl font-bold text-blue_munsell-500">
            ProjectFlow
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              📋 <strong>Task 2.6:</strong> Create protected dashboard layout
            </p>
          </div>

          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-blue_munsell-100 text-blue_munsell-700 dark:bg-blue_munsell-900 dark:text-blue_munsell-300"
                      : "text-outer_space-500 hover:bg-platinum-500 dark:text-platinum-500 dark:hover:bg-payne's_gray-400"
                  }`}
                >
                  <item.icon className="mr-3" size={20} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-french_gray-300 bg-white px-4 shadow-sm dark:border-payne's_gray-400 dark:bg-outer_space-500 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Search bar placeholder */}
            <div className="flex flex-1 items-center">
              <div className="relative max-w-md flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-payne's_gray-500 dark:text-french_gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search projects, tasks..."
                  className="w-full rounded-lg border border-french_gray-300 bg-platinum-500 py-2 pl-10 pr-4 text-outer_space-500 placeholder-payne's_gray-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-300 dark:bg-payne's_gray-400 dark:text-platinum-500 dark:placeholder-french_gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400">
                <Bell size={20} />
              </button>

              <ThemeToggle />

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue_munsell-500 font-semibold text-white">
                U
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}
