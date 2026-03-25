import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Project } from "@/types"

const FILTER_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "tasks", label: "Tasks" },
  { value: "members", label: "Members" },
  { value: "projects", label: "Projects" },
  { value: "lists", label: "Lists" },
]

interface ActivityFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  projectFilter: string
  setProjectFilter: (val: string) => void
  categoryFilter: string
  setCategoryFilter: (val: string) => void
  memberProjects: Pick<Project, "id" | "title" | "color">[]
}

export function ActivityFilters({
  searchQuery,
  setSearchQuery,
  projectFilter,
  setProjectFilter,
  categoryFilter,
  setCategoryFilter,
  memberProjects,
}: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search activity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-foreground"
        />
      </div>

      <Select value={projectFilter} onValueChange={setProjectFilter}>
        <SelectTrigger className="w-[300px] text-foreground">
          <SelectValue placeholder="All Projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {memberProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: project.color || "#3b82f6" }}
                />
                <span>{project.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[160px] text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
