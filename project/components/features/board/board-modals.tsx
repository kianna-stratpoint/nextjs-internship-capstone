"use client"

import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ListWithTasks } from "@/types"

interface BoardModalsProps {
  // Bulk Delete Props
  isBulkDeleteOpen: boolean
  setIsBulkDeleteOpen: (val: boolean) => void
  handleBulkDelete: () => void
  selectedTaskCount: number

  // List Delete Props
  listToDelete: { id: string; title: string; taskCount: number } | null
  setListToDelete: (val: null) => void
  migrationListId: string
  setMigrationListId: (val: string) => void
  storeLists: ListWithTasks[]
  confirmDeleteList: () => void
  isDeletingList: boolean

  // Task Delete Props
  taskToDelete: string | null
  setTaskToDelete: (val: string | null) => void
  deleteTask: (id: string) => void
}

export function BoardModals({
  isBulkDeleteOpen,
  setIsBulkDeleteOpen,
  handleBulkDelete,
  selectedTaskCount,
  listToDelete,
  setListToDelete,
  migrationListId,
  setMigrationListId,
  storeLists,
  confirmDeleteList,
  isDeletingList,
  taskToDelete,
  setTaskToDelete,
  deleteTask,
}: BoardModalsProps) {
  return (
    <>
      {/* BULK DELETE ALERT */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete {selectedTaskCount} Tasks?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete these tasks? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete {selectedTaskCount} Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* LIST DELETION MODAL */}
      <AlertDialog
        open={!!listToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setListToDelete(null)
            setMigrationListId("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete List</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {listToDelete?.taskCount && listToDelete.taskCount > 0 ? (
                  <div className="mt-2 space-y-4">
                    <p>
                      This list contains <strong>{listToDelete.taskCount} tasks</strong>. Deleting
                      it will also delete those tasks unless you migrate them. Where should we move
                      them?
                    </p>
                    <Select value={migrationListId} onValueChange={setMigrationListId}>
                      <SelectTrigger className="text-foreground">
                        <SelectValue placeholder="Select destination list..." />
                      </SelectTrigger>
                      <SelectContent>
                        {storeLists
                          .filter((l) => l.id !== listToDelete.id)
                          .map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="mt-2">
                    Are you sure you want to delete the <strong>{listToDelete?.title}</strong> list?
                    This cannot be undone.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground" disabled={isDeletingList}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDeleteList()
              }}
              disabled={
                isDeletingList ||
                (listToDelete?.taskCount ? listToDelete.taskCount > 0 && !migrationListId : false)
              }
              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50"
            >
              {isDeletingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete List"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* TASK DELETION MODAL */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this task? This action cannot be undone and will
              remove all associated comments and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (taskToDelete) {
                  deleteTask(taskToDelete)
                  setTaskToDelete(null)
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
