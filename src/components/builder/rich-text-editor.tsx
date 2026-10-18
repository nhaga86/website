"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RichTextEditor({ value, onChange, className }: { value: string; onChange: (html: string) => void; className?: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-neutral max-w-none px-5 py-4 prose-headings:font-semibold prose-p:leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  if (!editor) return <div className={cn("min-h-[360px] rounded-xl border bg-muted/30", className)} />;

  const tools = [
    { icon: Bold, label: "Bold", active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, label: "Italic", active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { icon: Heading2, label: "Heading", active: state?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, label: "Subheading", active: state?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: List, label: "Bullet list", active: state?.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, label: "Numbered list", active: state?.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: Quote, label: "Quote", active: state?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-neutral-50 p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onClick={t.run}
            className={cn("rounded-md p-2 text-neutral-600 hover:bg-white hover:text-neutral-950", t.active && "bg-white text-brand-700 shadow-sm")}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" title="Undo" disabled={!state?.canUndo} onClick={() => editor.chain().focus().undo().run()} className="rounded-md p-2 text-neutral-600 hover:bg-white disabled:opacity-30">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" title="Redo" disabled={!state?.canRedo} onClick={() => editor.chain().focus().redo().run()} className="rounded-md p-2 text-neutral-600 hover:bg-white disabled:opacity-30">
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
