import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates a new fractional position between two items and detects if the
 * gap has become too small, requiring a background rebalance.
 */
export function calculateFractionalPosition(
  prevPosition?: number,
  nextPosition?: number
): { position: number; needsRebalance: boolean } {
  let newPosition: number
  let needsRebalance = false

  // Dropped perfectly between two items
  if (prevPosition !== undefined && nextPosition !== undefined) {
    newPosition = Math.round((prevPosition + nextPosition) / 2)
    // Collision detection: If rounding squished them together
    if (newPosition === prevPosition || newPosition === nextPosition) {
      needsRebalance = true
    }
  }
  // Dropped at the very bottom/right
  else if (prevPosition !== undefined) {
    newPosition = prevPosition + 65536
  }
  // Dropped at the very top/left
  else if (nextPosition !== undefined) {
    newPosition = Math.round(nextPosition / 2)
    // Edge case: If nextPosition was 1, half is 0.5, rounded is 1 (Collision!)
    if (newPosition === nextPosition) {
      needsRebalance = true
    }
  }
  // First item ever in an empty list
  else {
    newPosition = 65536
  }

  return { position: newPosition, needsRebalance }
}

/**
 * Converts a date to a relative time string (e.g., "just now", "5m ago", "2 hours ago").
 */
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
