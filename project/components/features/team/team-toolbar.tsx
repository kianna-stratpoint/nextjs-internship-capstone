"use client"

import { Search, ArrowUpDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

interface TeamToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  filterRole: string | null
  onFilterChange: (value: string | null) => void
}

export function TeamToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterRole,
  onFilterChange,
}: TeamToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members"
          className="pl-9 text-foreground"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowUpDown size={16} />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
            <DropdownMenuRadioItem value="name-asc">Name A→Z</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name-desc">Name Z→A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="role">By Role</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="date-joined">Date Joined</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
            <Filter size={16} />
            Filter
            {filterRole && (
              <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                1
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filterRole === "admin"}
            onCheckedChange={(checked) => onFilterChange(checked ? "admin" : null)}
          >
            Admin
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filterRole === "contributor"}
            onCheckedChange={(checked) => onFilterChange(checked ? "contributor" : null)}
          >
            Contributor
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filterRole === "viewer"}
            onCheckedChange={(checked) => onFilterChange(checked ? "viewer" : null)}
          >
            Viewer
          </DropdownMenuCheckboxItem>
          {filterRole && (
            <>
              <DropdownMenuSeparator />
              <button
                onClick={() => onFilterChange(null)}
                className="w-full px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all filters
              </button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
