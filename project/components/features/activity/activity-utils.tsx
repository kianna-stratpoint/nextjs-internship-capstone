import {
  Activity,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Archive,
  Paperclip,
} from "lucide-react"

export interface ActivityMetadata {
  title?: string
  taskTitle?: string
  to?: string
  from?: string
  role?: string
  newRole?: string
  email?: string
  memberName?: string
  assigneeName?: string
  assigneeId?: string
  type?: string
  fileName?: string
  fileNames?: string[]
  count?: number
  viaInvitation?: boolean
  accepted?: boolean
  listType?: string
  [key: string]: any
}

export function getActivityIcon(action: string, metadata?: ActivityMetadata) {
  const className = "h-4 w-4"
  if (
    action === "updated" &&
    metadata &&
    (metadata.type === "attachments_added" || metadata.type === "attachment_deleted")
  ) {
    return <Paperclip className={className} />
  }
  switch (action) {
    case "created":
      return <Plus className={className} />
    case "moved":
      return <ArrowRight className={className} />
    case "updated":
      return <Pencil className={className} />
    case "completed":
      return <CheckCircle2 className={`${className} text-emerald-500`} />
    case "restored":
      return <CheckCircle2 className={className} />
    case "assigned":
      return <UserPlus className={className} />
    case "unassigned":
      return <UserMinus className={className} />
    case "commented":
      return <MessageCircle className={className} />
    case "deleted":
      return <Trash2 className={className} />
    case "invited":
      return <UserPlus className={className} />
    case "removed":
      return <UserMinus className={className} />
    case "role_changed":
      return <Users className={className} />
    case "archived":
    case "unarchived":
      return <Archive className={className} />
    default:
      return <Activity className={className} />
  }
}

export function formatActivityMessage(
  action: string,
  entityType: string,
  metadata: ActivityMetadata | null
) {
  const title = metadata?.title || metadata?.taskTitle || "an item"

  switch (action) {
    case "created":
      if (entityType === "task") return `created task "${title}"`
      if (entityType === "list") return `created list "${title}"`
      if (entityType === "project") return `created project "${title}"`
      if (metadata?.type === "calendar_event") return `created event "${title}"`
      return `created ${entityType} "${title}"`

    case "updated":
      if (metadata?.type === "attachments_added") {
        const count = metadata.count || metadata.fileNames?.length || 0
        const fileNames = metadata.fileNames || []
        if (count === 1 && fileNames.length === 1) return `attached "${fileNames[0]}" to a task`
        return `attached ${count} file${count !== 1 ? "s" : ""} to a task`
      }
      if (metadata?.type === "attachment_deleted") {
        return `removed attachment "${metadata.fileName || "a file"}"`
      }
      if (entityType === "task") return `updated task "${title}"`
      if (entityType === "project") return `updated project "${title}"`
      return `updated ${entityType} "${title}"`

    case "deleted":
      if (entityType === "task") return `deleted task "${title}"`
      if (entityType === "list") return `deleted list "${title}"`
      if (entityType === "project") return `deleted project "${title}"`
      if (entityType === "comment") return `deleted a comment`
      return `deleted ${entityType} "${title}"`

    case "moved":
      if (metadata?.from && metadata?.to) {
        return `moved "${metadata.taskTitle || title}" from ${metadata.from} to ${metadata.to}`
      }
      return `moved "${title}" to another list`

    case "completed":
      return `completed "${title}"`

    case "restored":
      return `reopened "${title}"`

    case "assigned":
      if (metadata?.assigneeName)
        return `assigned ${metadata.assigneeName} to "${metadata.taskTitle || title}"`
      return `assigned someone to "${title}"`

    case "unassigned":
      if (metadata?.assigneeName)
        return `removed ${metadata.assigneeName} from "${metadata.taskTitle || title}"`
      return `removed an assignee from "${title}"`

    case "commented":
      if (metadata?.taskTitle) return `commented on "${metadata.taskTitle}"`
      return `added a comment`

    case "invited":
      if (metadata?.email) return `invited ${metadata.email} as ${metadata.role || "member"}`
      if (metadata?.viaInvitation && metadata?.accepted) return `joined the project`
      return `invited a new member${metadata?.role ? ` as ${metadata.role}` : ""}`

    case "removed":
      if (metadata?.memberName) return `removed ${metadata.memberName} from the project`
      return `removed a member`

    case "role_changed":
      if (metadata?.memberName && metadata?.from && metadata?.to) {
        return `changed ${metadata.memberName}'s role from ${metadata.from} to ${metadata.to}`
      }
      if (metadata?.newRole) return `changed a member's role to ${metadata.newRole}`
      return `changed a member's role`

    case "archived":
      return `archived "${title}"`

    case "unarchived":
      return `restored "${title}" from archive`

    default:
      return `modified a ${entityType}`
  }
}

export function getActivityCategory(action: string, entityType: string): string {
  if (entityType === "task" || entityType === "comment") return "tasks"
  if (
    entityType === "member" ||
    action === "invited" ||
    action === "removed" ||
    action === "role_changed"
  )
    return "members"
  if (entityType === "project") return "projects"
  if (entityType === "list") return "lists"
  return "other"
}
