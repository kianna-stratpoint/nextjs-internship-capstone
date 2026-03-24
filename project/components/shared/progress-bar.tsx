// components/shared/progress-bar.tsx
import { calculateProgress } from "@/lib/utils"

interface ProgressBarProps {
  counts?: { tasks?: number; completedTasks?: number }
  color?: string | null
  showFraction?: boolean
  size?: "sm" | "md"
}

export function ProgressBar({
  counts,
  color = "#2D6EF7",
  showFraction = true,
  size = "md",
}: ProgressBarProps) {
  const { total, completed, percent } = calculateProgress(counts)

  const heightClass = size === "sm" ? "h-1.5" : "h-2"

  if (!showFraction) {
    // Dashboard / Recent Projects Layout
    return (
      <div className="flex items-center gap-3">
        <div className={`w-24 overflow-hidden rounded-full bg-secondary ${heightClass}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%`, backgroundColor: color || "#2D6EF7" }}
          />
        </div>
        <span className="w-8 text-right text-xs font-medium text-foreground">{percent}%</span>
      </div>
    )
  }

  // Project Card / Header Layout
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Progress</span>
        <span className="text-foreground">
          {percent}% ({completed}/{total})
        </span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-secondary ${heightClass}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color || "#2D6EF7" }}
        />
      </div>
    </div>
  )
}
