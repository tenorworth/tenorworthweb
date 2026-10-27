import { useState } from 'react';

// A prospect's photo, or their initials when there is none or it will not
// load. Photos are hotlinked from the site they were found on, so they load
// with no referrer: the site sees an image request, not a pipeline URL.
export default function Avatar({ name, url, size }: { name: string; url: string | null; size: number }) {
  const [broken, setBroken] = useState<string | null>(null);
  const box = { width: size, height: size };

  if (url && url !== broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setBroken(url)}
        style={box}
        className="shrink-0 rounded-full bg-cream-deep object-cover object-top ring-1 ring-cream-line"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...box, fontSize: Math.round(size * 0.38) }}
      className="flex shrink-0 select-none items-center justify-center rounded-full bg-cream-deep font-medium text-ink-muted ring-1 ring-cream-line"
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, ' ').split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (!words.length) return '·';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}
