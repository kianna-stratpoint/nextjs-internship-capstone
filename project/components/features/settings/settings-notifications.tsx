"use client"

import { Switch } from "@/components/ui/switch"
import type { NotificationPreferences } from "@/types/settings"

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationPreferences
  label: string
  description: string
}[] = [
  {
    key: "taskAssigned",
    label: "Task assigned to me",
    description: "When someone assigns you to a task",
  },
  {
    key: "taskCompleted",
    label: "Task completed",
    description: "When a task you're assigned to is completed",
  },
  {
    key: "taskCommented",
    label: "Task comments",
    description: "When someone comments on your task",
  },
  {
    key: "projectUpdated",
    label: "Project updates",
    description: "When a project you're in is updated",
  },
  { key: "memberJoined", label: "New members", description: "When someone joins your project" },
]

interface SettingsNotificationsProps {
  preferences: NotificationPreferences | null
  onSave: (data: NotificationPreferences) => Promise<any>
  isSaving: boolean
}

export function SettingsNotifications({
  preferences,
  onSave,
  isSaving,
}: SettingsNotificationsProps) {
  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return
    const updated = { ...preferences, [key]: value }
    await onSave(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground">Choose what you want to be notified about</p>
      </div>

      <div className="space-y-1">
        {NOTIFICATION_OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              checked={preferences?.[option.key] ?? true}
              onCheckedChange={(checked) => handleToggle(option.key, checked)}
              disabled={isSaving}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
