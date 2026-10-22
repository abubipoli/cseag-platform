// Sanitizer for the rich-text compose box in Admin -> Communications.
// The editor produces HTML, but email only gets a small allowlist back out of
// it: basic emphasis, line breaks, lists, and spans carrying a font family and
// size from fixed lists. Everything else (scripts, event handlers, other
// styles, unknown tags) is dropped, keeping only the text inside.

export const EMAIL_FONTS: Record<string, string> = {
  arial: "Arial,Helvetica,sans-serif",
  verdana: "Verdana,Geneva,sans-serif",
  georgia: "Georgia,'Times New Roman',serif",
  "times new roman": "'Times New Roman',Times,serif",
  "courier new": "'Courier New',Courier,monospace",
};

const MIN_SIZE = 10;
const MAX_SIZE = 40;
const PLAIN_TAGS = new Set(["b", "strong", "i", "em", "u", "p", "div", "ul", "ol", "li", "br"]);

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g,
    (url) => `<a href="${url}" style="color:#14b871;text-decoration:underline;">${url}</a>`
  );
}

function spanStyle(attrs: string): string {
  const style = /style\s*=\s*"([^"]*)"|style\s*=\s*'([^']*)'/i.exec(attrs);
  const css = (style?.[1] ?? style?.[2] ?? "").replace(/&quot;/g, "'");
  const out: string[] = [];

  const family = /font-family\s*:\s*([^;]+)/i.exec(css)?.[1];
  if (family) {
    const first = family.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    if (EMAIL_FONTS[first]) out.push(`font-family:${EMAIL_FONTS[first]}`);
  }
  const size = /font-size\s*:\s*(\d+(?:\.\d+)?)px/i.exec(css)?.[1];
  if (size) {
    const px = Math.round(Number(size));
    if (px >= MIN_SIZE && px <= MAX_SIZE) out.push(`font-size:${px}px`);
  }
  return out.join(";");
}

export function sanitizeEmailHtml(html: string): string {
  const open: string[] = [];
  const out: string[] = [];
  const tokens = html.match(/<[^>]*>|[^<]+|</g) ?? [];
  let skipping = "";

  for (const token of tokens) {
    if (skipping) {
      if (new RegExp(`^</${skipping}\\s*>$`, "i").test(token)) skipping = "";
      continue;
    }
    if (token === "<") {
      out.push("&lt;");
      continue;
    }
    if (token[0] !== "<") {
      out.push(linkify(token.replace(/>/g, "&gt;")));
      continue;
    }
    const m = /^<(\/?)([a-z][a-z0-9]*)([^>]*)>$/i.exec(token);
    if (!m) continue;
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (!closing && (tag === "script" || tag === "style")) {
      skipping = tag;
      continue;
    }
    if (tag === "br") {
      if (!closing) out.push("<br/>");
      continue;
    }
    if (closing) {
      const at = open.lastIndexOf(tag);
      if (at === -1) continue;
      while (open.length > at) out.push(`</${open.pop()}>`);
      continue;
    }
    if (tag === "span") {
      const css = spanStyle(m[3]);
      open.push("span");
      out.push(css ? `<span style="${css}">` : "<span>");
    } else if (PLAIN_TAGS.has(tag)) {
      open.push(tag);
      out.push(tag === "p" ? '<p style="margin:0 0 16px;">' : `<${tag}>`);
    }
  }
  while (open.length) out.push(`</${open.pop()}>`);
  return out.join("");
}

export { escapeHtml };
