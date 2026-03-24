"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const SIZE_CLASSES = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
  "2xl": "h-16 w-16 text-lg",
} as const

type AvatarSize = keyof typeof SIZE_CLASSES

interface UserAvatarProps {
  user?: {
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
  } | null
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  size?: AvatarSize
  className?: string
  showBorder?: boolean
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

export function UserAvatar({
  user,
  firstName: propFirstName,
  lastName: propLastName,
  imageUrl: propImageUrl,
  size = "md",
  className,
  showBorder = false,
}: UserAvatarProps) {
  const firstName = propFirstName ?? user?.firstName
  const lastName = propLastName ?? user?.lastName
  const imageUrl = propImageUrl ?? user?.imageUrl

  const initials = getInitials(firstName, lastName)
  const sizeClass = SIZE_CLASSES[size]

  return (
    <Avatar className={cn(sizeClass, showBorder && "border-2 border-background", className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={`${firstName || "User"}'s avatar`} />}
      <AvatarFallback className="bg-foreground font-medium text-background">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

/* ==================== STACKED AVATARS ==================== */

export function StackedAvatars({
  users,
  max = 3,
  size = "sm",
  onClickAction,
}: {
  users: {
    user?: any
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
  }[]
  max?: number
  size?: AvatarSize
  onClickAction?: (e: React.MouseEvent) => void
}) {
  const visible = users.slice(0, max)
  const overflow = users.length - max
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div
      className={cn("flex shrink-0 -space-x-1.5", onClickAction && "cursor-pointer")}
      onClick={onClickAction}
    >
      {visible.map((item, i) => (
        <UserAvatar
          key={item.user?.id || i}
          user={item.user}
          firstName={item.firstName}
          lastName={item.lastName}
          imageUrl={item.imageUrl}
          size={size}
          showBorder
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "inline-flex items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-muted-foreground",
            sizeClass
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
