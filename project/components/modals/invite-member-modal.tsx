"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useProjectInvitations } from "@/hooks/use-invitations"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function InviteMemberModal() {
  const { isInviteMemberModalOpen, inviteProjectId, closeInviteMemberModal } = useUIStore()
  const { inviteMember, isInviting } = useProjectInvitations(inviteProjectId)

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<string>("contributor")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    closeInviteMemberModal()
    setTimeout(() => {
      setEmail("")
      setRole("contributor")
      setError(null)
      setSuccess(false)
    }, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    try {
      const result = await inviteMember({ email: email.trim(), role })

      if (result && !result.success) {
        setError(result.error ?? "Failed to send invitation.")
        return
      }

      setSuccess(true)
      setEmail("")
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    }
  }

  return (
    <Dialog open={isInviteMemberModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Invite Member</DialogTitle>
          <DialogDescription>
            Invited members will receive a notification to join the project.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            Invitation sent! They&apos;ll see it in their notifications.
          </div>
        )}

        {error && (
          <div className="bg-destructive/15 rounded-lg p-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email" className="text-foreground">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError(null)
                  if (success) setSuccess(false)
                }}
                disabled={isInviting}
                className="text-foreground"
              />
            </div>
            <div className="w-[140px] space-y-2">
              <Label className="text-foreground">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={isInviting}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
              className="text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting || !email.trim()}>
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
