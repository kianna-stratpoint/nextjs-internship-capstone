"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, Strikethrough, List, ListOrdered } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || "Add a more detailed description...",
        emptyEditorClass:
          "cursor-text before:content-[attr(data-placeholder)] before:text-muted-foreground before:absolute before:pointer-events-none",
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] w-full rounded-b-md border-t-0 bg-transparent px-3 py-2 text-sm focus-visible:outline-none prose prose-sm dark:prose-invert max-w-none text-foreground",
      },
    },
  })

  if (!editor) return null

  return (
    <div className="flex flex-col rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border-b border-input bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded-sm p-2 hover:bg-muted ${editor.isActive("bold") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded-sm p-2 hover:bg-muted ${editor.isActive("italic") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded-sm p-2 hover:bg-muted ${editor.isActive("strike") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-[1px] bg-border" /> {/* Divider */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded-sm p-2 hover:bg-muted ${editor.isActive("bulletList") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded-sm p-2 hover:bg-muted ${editor.isActive("orderedList") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />
    </div>
  )
}
