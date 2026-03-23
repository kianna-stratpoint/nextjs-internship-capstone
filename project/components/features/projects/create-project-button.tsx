"use client"

import { Plus } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"

interface CreateProjectButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
}

export function CreateProjectButton({
  children,
  className = "font-semibold",
  variant = "default",
}: CreateProjectButtonProps) {
  const openCreateProjectModal = useUIStore((state) => state.openCreateProjectModal)

  return (
    <Button onClick={openCreateProjectModal} className={className} variant={variant}>
      {children ? (
        children
      ) : (
        <>
          <Plus size={20} className="mr-1" />
          New Project
        </>
      )}
    </Button>
  )
}
