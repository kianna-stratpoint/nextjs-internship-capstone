"use client"

import { useTransition, useState, useEffect } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { Search, ArrowUpDown, Archive, LayoutGrid } from "lucide-react"

export function ProjectsToolbar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()

  // Grab current values from URL, providing defaults
  const currentQuery = searchParams.get("query")?.toString() || ""
  const currentSort = searchParams.get("sort") || "asc"
  const currentView = searchParams.get("view") || "active"
  const sortAscending = currentSort === "asc"

  // FIX 1: Local state for the search input to handle immediate typing
  const [searchTerm, setSearchTerm] = useState(currentQuery)

  const updateParams = (key: string, value: string | null) => {
    // FIX 2: Add .toString() to safely clone the existing parameters
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      // Use replace with scroll: false so the page doesn't jump to the top on every filter
      replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  // FIX 3: Debounce the search input
  // This waits 300ms after the user stops typing before triggering the server request
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Only update if the user actually changed the search term
      if (searchTerm !== currentQuery) {
        updateParams("query", searchTerm)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left side: Search */}
      <div className="relative w-full md:max-w-md">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
          size={16}
        />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm} // Use local state
          onChange={(e) => setSearchTerm(e.target.value)} // Update local state immediately
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Right side: View Toggle & Sort */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        {/* Active / Archived Toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1">
          <button
            onClick={() => updateParams("view", "active")}
            disabled={isPending}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              currentView !== "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid size={14} className="mr-1.5" />
            Active
          </button>
          <button
            onClick={() => updateParams("view", "archived")}
            disabled={isPending}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              currentView === "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive size={14} className="mr-1.5" />
            Archived
          </button>
        </div>

        {/* Sort Button */}
        <button
          onClick={() => updateParams("sort", sortAscending ? "desc" : "asc")}
          disabled={isPending}
          className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <ArrowUpDown size={14} className="mr-1.5 text-muted-foreground" />
          {sortAscending ? "A-Z" : "Z-A"}
        </button>
      </div>
    </div>
  )
}
