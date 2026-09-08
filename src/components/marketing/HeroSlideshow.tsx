"use client";

// Auto-advancing, cross-fading background slideshow for the homepage hero.
// Sits behind the hero copy with a dark overlay so white text stays legible
// (SRS-adjacent: uses real CSEAG event photography rather than stock art).

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const INTERVAL_MS = 8000;

export function HeroSlideshow({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" aria-hidden>
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- static hero background photo
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: i === active ? 0.8 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-navy-950/45" />
      </div>

      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
