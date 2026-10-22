"use client";

// Compose box for broadcasts with font style, size and basic emphasis.
// Emails get the formatted HTML (sanitized again on the server); SMS and the
// text part of the email get the plain text.
import { useRef } from "react";

const FONTS = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const toolBtn =
  "flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 hover:bg-slate-100";
const toolSelect = "h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700";

export function RichMessageEditor({ onChange }: { onChange: (html: string, text: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);

  function emit() {
    const el = ref.current;
    if (!el) return;
    const text = el.innerText.trim();
    if (!text && el.innerHTML !== "") el.innerHTML = "";
    onChange(text ? el.innerHTML : "", text);
  }

  function remember() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) saved.current = sel.getRangeAt(0).cloneRange();
  }

  function restore() {
    ref.current?.focus();
    if (!saved.current) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(saved.current);
  }

  function emphasis(command: "bold" | "italic" | "underline") {
    restore();
    document.execCommand(command);
    remember();
    emit();
  }

  function applyStyle(style: Partial<CSSStyleDeclaration>) {
    restore();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    Object.assign(span.style, style);
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(span);
    sel.addRange(after);
    remember();
    emit();
  }

  return (
    <div className="rounded-lg border border-slate-300 focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/20">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2">
        <select
          aria-label="Font style"
          className={toolSelect}
          value=""
          onChange={(e) => e.target.value && applyStyle({ fontFamily: e.target.value })}
        >
          <option value="">Font</option>
          {FONTS.map((f) => (
            <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className={toolSelect}
          value=""
          onChange={(e) => e.target.value && applyStyle({ fontSize: `${e.target.value}px` })}
        >
          <option value="">Size</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="button" aria-label="Bold" className={`${toolBtn} font-bold`} onMouseDown={(e) => e.preventDefault()} onClick={() => emphasis("bold")}>
          B
        </button>
        <button type="button" aria-label="Italic" className={`${toolBtn} italic`} onMouseDown={(e) => e.preventDefault()} onClick={() => emphasis("italic")}>
          I
        </button>
        <button type="button" aria-label="Underline" className={`${toolBtn} underline`} onMouseDown={(e) => e.preventDefault()} onClick={() => emphasis("underline")}>
          U
        </button>
        <span className="ml-auto text-xs text-slate-400">Select text, then pick a font or size. SMS sends plain text.</span>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        suppressContentEditableWarning
        onInput={emit}
        onKeyUp={remember}
        onMouseUp={remember}
        onBlur={remember}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
        className="min-h-40 whitespace-pre-wrap px-3 py-2.5 text-[15px] leading-relaxed text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
        data-placeholder="Type your message here…"
      />
    </div>
  );
}
