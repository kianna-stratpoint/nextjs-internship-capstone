import { createUploadthing, type FileRouter } from "uploadthing/next"
import { requireAuth } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  taskAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const { dbUserId } = await requireAuth()
      if (!dbUserId) throw new Error("Unauthorized")
      return { userId: dbUserId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // console.log("Upload complete for userId:", metadata.userId);
      // console.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
