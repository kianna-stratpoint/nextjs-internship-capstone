import { FileText, ImageIcon, File as FileIconLucide } from "lucide-react"

interface FileIconProps {
  type: string
  className?: string
}

export function FileIcon({ type, className = "h-4 w-4" }: FileIconProps) {
  if (type.startsWith("image/")) {
    return <ImageIcon className={`${className} text-blue-500`} />
  }
  if (type === "application/pdf") {
    return <FileText className={`${className} text-red-500`} />
  }
  return <FileIconLucide className={`${className} text-muted-foreground`} />
}
