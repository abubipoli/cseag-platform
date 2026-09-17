// Renders plain text with any http(s) URLs turned into clickable links.
// Content item bodies (news/event articles) are edited as a plain
// <Textarea> in the admin, not markdown or HTML — so a URL an admin types
// in is otherwise just inert text on the public page.
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

// A URL typed mid-sentence often has trailing punctuation that isn't part
// of it, e.g. "see https://example.com." — split that off so the link
// itself doesn't end in a stray period/comma/etc.
function splitTrailingPunctuation(url: string): { url: string; trailing: string } {
  const match = url.match(/^(.*[^.,;:!?)\]'"])([.,;:!?)\]'"]*)$/);
  if (!match) return { url, trailing: "" };
  return { url: match[1], trailing: match[2] };
}

export function Linkify({ text, className }: { text: string; className?: string }) {
  const segments = text.split(URL_PATTERN);
  return (
    <div className={className}>
      {segments.map((segment, i) => {
        if (i % 2 === 0) return segment;
        const { url, trailing } = splitTrailingPunctuation(segment);
        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent-700 underline underline-offset-2 hover:text-accent-800"
            >
              {url}
            </a>
            {trailing}
          </span>
        );
      })}
    </div>
  );
}
