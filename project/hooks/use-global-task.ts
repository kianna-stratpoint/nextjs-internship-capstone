"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { createTaskAction } from "@/lib/actions/tasks"
import { useUIStore } from "@/stores/ui-store"
import { useUploadThing } from "@/lib/uploadthing"

export function useGlobalTaskCreator() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { closeCreateTaskModal } = useUIStore()

  const { startUpload, isUploading } = useUploadThing("taskAttachment", {
    onUploadError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload files.",
      })
    },
  })

  const createGlobalTask = useMutation({
    mutationFn: async ({ formData, files }: { formData: FormData; files: File[] }) => {
      // 1. Upload files to UploadThing first (if any)
      let attachmentMeta: { url: string; name: string; size: number; type: string }[] = []

      if (files.length > 0) {
        const uploadResults = await startUpload(files)
        if (!uploadResults) {
          throw new Error("File upload failed. Please try again.")
        }

        attachmentMeta = uploadResults.map((res) => ({
          url: res.ufsUrl,
          name: res.name,
          size: res.size,
          type: res.type,
        }))
      }

      // 2. Append serialized attachment metadata to formData
      formData.append("attachments", JSON.stringify(attachmentMeta))

      // 3. Call the server action
      return createTaskAction(formData)
    },
    onSuccess: (result: any, variables) => {
      if (result?.error) throw new Error(result.error)
      const projectId = variables.formData.get("projectId") as string

      queryClient.invalidateQueries({ queryKey: ["projects"] })

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["project-lists", projectId] })
      }

      toast({ title: "Task created successfully!" })
      closeCreateTaskModal()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create task",
        description: error.message || "An unexpected error occurred.",
      })
    },
  })

  return { createGlobalTask, isUploading }
}
