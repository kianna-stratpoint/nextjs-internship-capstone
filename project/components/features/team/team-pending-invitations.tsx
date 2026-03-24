"use client"

import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PendingInvitation } from "@/types/team"

interface PendingInvitationsProps {
  invitations: PendingInvitation[]
  onResend: (id: string) => void
  onCancel: (id: string) => void
  isResending: boolean
  isCancelling: boolean
}

export function PendingInvitations({
  invitations,
  onResend,
  onCancel,
  isResending,
  isCancelling,
}: PendingInvitationsProps) {
  if (invitations.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Pending Invitations ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{invite.email}</p>
                <p className="text-xs capitalize text-muted-foreground">Invited as {invite.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-foreground"
                onClick={() => onResend(invite.id)}
                disabled={isResending}
              >
                Resend
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onCancel(invite.id)}
                disabled={isCancelling}
              >
                Cancel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
