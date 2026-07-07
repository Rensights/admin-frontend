"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

// Quill touches `document` on import, so it must never run during SSR.
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block", "link", "image"],
          ["clean"],
        ],
        handlers: {
          // Default Quill image button only accepts a URL - this lets editors
          // upload a local file too, embedded the same way the cover image is.
          image: function (this: { quill: any }) {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const dataUrl = await readFileAsDataUrl(file);
              const range = this.quill.getSelection(true);
              this.quill.insertEmbed(range.index, "image", dataUrl, "user");
              this.quill.setSelection(range.index + 1, 0);
            };
          },
        },
      },
    }),
    []
  );

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      placeholder={placeholder}
      className="[&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:min-h-[240px] [&_.ql-editor]:min-h-[240px] dark:[&_.ql-toolbar]:border-gray-600 dark:[&_.ql-container]:border-gray-600 dark:[&_.ql-editor]:text-white"
    />
  );
}
