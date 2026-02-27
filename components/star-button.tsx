"use client";

import { Star } from "lucide-react";

interface StarButtonProps {
  watched: boolean;
  onToggle: () => void;
  size?: number;
}

export function StarButton({ watched, onToggle, size = 16 }: StarButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gold-dim"
      aria-label={watched ? "取消收藏" : "添加收藏"}
    >
      <Star
        size={size}
        className={
          watched
            ? "fill-[var(--gold)] text-[var(--gold)]"
            : "text-text-muted hover:text-[var(--gold)]"
        }
      />
    </button>
  );
}
