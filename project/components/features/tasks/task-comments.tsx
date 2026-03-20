"use client"

import { useState } from "react"
import { Loader2, Send, MoreHorizontal, Pencil, Trash2, X } from "lucide-react"

import { useComments } from "@/hooks/use-comments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { timeAgo } from "@/lib/utils"

export interface CurrentUser {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

interface TaskCommentsProps {
  taskId: string
  projectId: string
  currentUser: CurrentUser
}

export function TaskComments({ taskId, projectId, currentUser }: TaskCommentsProps) {
  const { comments, isLoading, addComment, editComment, deleteComment, isAdding } = useComments(
    taskId,
    projectId
  )

  const [newComment, setNewComment] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  const handleSend = async () => {
    if (!newComment.trim()) return
    try {
      await addComment({ content: newComment.trim(), currentUser })
      setNewComment("")
    } catch (error) {}
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return
    try {
      await editComment({ commentId, content: editContent.trim() })
      setEditingId(null)
    } catch (error) {}
  }

  const confirmDelete = async () => {
    if (!commentToDelete) return
    try {
      await deleteComment(commentToDelete)
    } catch (error) {
    } finally {
      setCommentToDelete(null)
    }
  }

  const getInitials = (first?: string | null, last?: string | null) => {
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "?"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* INPUT AREA */}
      <div className="relative mt-auto items-center border-t border-muted/50 p-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none bg-background pr-10 text-foreground"
          disabled={isAdding}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-3 right-4 h-6 w-6"
          onClick={handleSend}
          disabled={!newComment.trim() || isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Send className="h-4 w-4 text-muted-foreground hover:text-primary" />
          )}
        </Button>
      </div>

      <h3 className="mb-4 mt-4 font-sans text-xs font-bold uppercase text-muted-foreground">
        Comments
      </h3>

      {/* COMMENTS LIST */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4 pr-2">
        {comments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No comments yet. Start the conversation.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.userId === currentUser.id
            const isEditing = editingId === comment.id

            return (
              <div
                key={comment.id}
                className="group rounded-lg border border-muted-foreground/20 bg-muted/20 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.user?.imageUrl || ""} />
                      <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                        {getInitials(comment.user?.firstName, comment.user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.createdAt)}
                    </span>

                    {/* EDIT/DELETE ACTIONS (Only visible to owner) */}
                    {isOwner && !isEditing && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingId(comment.id)
                              setEditContent(comment.content)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onSelect={(e) => {
                              e.preventDefault()

                              setTimeout(() => {
                                setCommentToDelete(comment.id)
                              }, 0)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* INLINE EDITING OR TEXT DISPLAY */}
                {isEditing ? (
                  <div className="mt-2 space-y-2 pl-8 pr-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] resize-none bg-background text-sm text-foreground"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-foreground"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap pl-8 text-sm text-foreground">
                    {comment.content}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      <AlertDialog
        open={!!commentToDelete}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
