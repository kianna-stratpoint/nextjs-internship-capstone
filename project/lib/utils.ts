import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateFractionalPosition(
  prevPosition?: number,
  nextPosition?: number
): { position: number; needsRebalance: boolean } {
  let newPosition: number
  let needsRebalance = false

  if (prevPosition !== undefined && nextPosition !== undefined) {
    newPosition = Math.round((prevPosition + nextPosition) / 2)
    // Collision detection
    if (newPosition === prevPosition || newPosition === nextPosition) {
      needsRebalance = true
    }
  } else if (prevPosition !== undefined) {
    newPosition = prevPosition + 65536
  } else if (nextPosition !== undefined) {
    newPosition = nextPosition - 65536
  } else {
    newPosition = 65536
  }

  return { position: newPosition, needsRebalance }
}

export function timeAgo(dateInput: Date | string): string {
  const date = new Date(dateInput)
  const now = new Date()
  const secondsPast = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsPast < 60) {
    return "just now"
  }

  const minutesPast = Math.floor(secondsPast / 60)
  if (minutesPast < 60) {
    return minutesPast === 1 ? "1 minute ago" : `${minutesPast} minutes ago`
  }

  const hoursPast = Math.floor(minutesPast / 60)
  if (hoursPast < 24) {
    return hoursPast === 1 ? "1 hour ago" : `${hoursPast} hours ago`
  }

  const daysPast = Math.floor(hoursPast / 24)
  if (daysPast === 1) {
    return "yesterday"
  }
  if (daysPast < 30) {
    return `${daysPast} days ago`
  }

  const monthsPast = Math.floor(daysPast / 30)
  if (monthsPast < 12) {
    return monthsPast === 1 ? "1 month ago" : `${monthsPast} months ago`
  }

  const yearsPast = Math.floor(daysPast / 365)
  return yearsPast === 1 ? "1 year ago" : `${yearsPast} years ago`
}

type DateFormat = "full" | "long" | "shortWithYear" | "short"

export function formatDate(date: Date | string, format: DateFormat = "shortWithYear"): string {
  const d = new Date(date)

  switch (format) {
    case "full":
      // "Tuesday, March 24, 2026" (For Dashboard Greeting)
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    case "long":
      // "March 24, 2026" (For Date Picker)
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    case "short":
      // "Mar 24" (For Task Cards)
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    case "shortWithYear":
    default:
      // "Mar 24, 2026" (For Project Cards)
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
}

export function calculateProgress(counts?: { tasks?: number; completedTasks?: number }) {
  const total = counts?.tasks || 0
  const completed = counts?.completedTasks || 0
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, percent }
}

export function getFullName(
  user?: { firstName?: string | null; lastName?: string | null } | null
): string {
  if (!user) return "Unknown User"
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name || "Unknown User"
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
