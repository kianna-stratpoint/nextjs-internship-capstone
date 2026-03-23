import Link from "next/link"
import { FolderX, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FolderX className="h-8 w-8 text-muted-foreground" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">Project not found</h2>

        <p className="mb-6 text-sm text-muted-foreground">
          This project doesn&apos;t exist, has been deleted, or you don&apos;t have access to it.
        </p>

        <Button variant="outline" className="text-foreground" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    </div>
  )
}
