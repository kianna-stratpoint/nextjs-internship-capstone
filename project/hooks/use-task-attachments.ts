"use client"

import { useToast } from "@/hooks/use-toast"
import { useUploadThing } from "@/lib/uploadthing"

/**
 * Handles the UploadThing upload step, then delegates DB persistence
 * to the saveAttachments function from useTasks.
 *
 * Separated from useTasks so that useUploadThing (which doesn't
 * play well with SSR) is only mounted in client-only components
 * like TaskSheet, not in KanbanBoard which renders server-side first.
 */
export function useTaskAttachments({
  saveAttachmentsAction,
  deleteAttachmentAction,
}: {
  saveAttachmentsAction: (params: {
    taskId: string
    attachments: { url: string; name: string; size: number; type: string }[]
  }) => Promise<any>
  deleteAttachmentAction: (params: { attachmentId: string; taskId: string }) => Promise<any>
}) {
  const { toast } = useToast()

  const { startUpload, isUploading } = useUploadThing("taskAttachment", {
    onUploadError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload files.",
      })
    },
  })

  const addAttachments = async ({ taskId, files }: { taskId: string; files: File[] }) => {
    // 1. Upload to UploadThing
    const uploadResults = await startUpload(files)
    if (!uploadResults) throw new Error("File upload failed.")

    const attachmentMeta = uploadResults.map((res) => ({
      url: res.ufsUrl,
      name: res.name,
      size: res.size,
      type: res.type,
    }))

    // 2. Save metadata in DB via the server action
    return saveAttachmentsAction({ taskId, attachments: attachmentMeta })
  }

  return {
    addAttachments,
    deleteAttachment: deleteAttachmentAction,
    isUploading,
  }
}
