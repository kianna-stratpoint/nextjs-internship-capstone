"use client"

import { Loader2, CheckSquare, FolderOutput, UserPlus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { ListWithTasks, ProjectWithMembers } from "@/types"

interface BulkActionsToolbarProps {
  selectedTaskIds: string[]
  isBulkProcessing: boolean
  storeLists: ListWithTasks[]
  projectMembers: ProjectWithMembers["members"]
  onMove: (listId: string) => void
  onAssign: (userId: string) => void
  onDeleteClick: () => void
  onClearSelection: () => void
}

export function BulkActionsToolbar({
  selectedTaskIds,
  isBulkProcessing,
  storeLists,
  projectMembers,
  onMove,
  onAssign,
  onDeleteClick,
  onClearSelection,
}: BulkActionsToolbarProps) {
  if (selectedTaskIds.length === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-foreground px-6 py-3 text-background shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 border-r border-background/20 pr-4 text-sm font-medium">
        {isBulkProcessing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CheckSquare size={18} />
        )}
        {selectedTaskIds.length} selected
      </div>

      <div className="flex items-center gap-1">
        {/* BULK MOVE */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBulkProcessing}
              className="text-background hover:bg-background/20 hover:text-background"
            >
              <FolderOutput size={16} className="mr-2" /> Move
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuLabel>Move to list...</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {storeLists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                onClick={() => onMove(list.id)}
                className="cursor-pointer"
              >
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: list.color || "#CCC" }}
                />
                {list.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* BULK ASSIGN */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBulkProcessing}
              className="text-background hover:bg-background/20 hover:text-background"
            >
              <UserPlus size={16} className="mr-2" /> Assign
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuLabel>Assign to...</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projectMembers?.map((member) => (
              <DropdownMenuItem
                key={member.userId}
                onClick={() => onAssign(member.userId)}
                className="cursor-pointer"
              >
                {member.user?.firstName
                  ? `${member.user.firstName} ${member.user.lastName || ""}`
                  : member.user?.email || "Unknown User"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-4 w-px bg-background/20" />

        {/* BULK DELETE */}
        <Button
          variant="ghost"
          size="sm"
          disabled={isBulkProcessing}
          className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
          onClick={onDeleteClick}
        >
          <Trash2 size={16} className="mr-2" /> Delete
        </Button>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={onClearSelection}
        disabled={isBulkProcessing}
        className="ml-2 rounded-full p-1 text-background/70 hover:bg-background/20 hover:text-background disabled:opacity-50"
      >
        <X size={16} />
      </button>
    </div>
  )
}
