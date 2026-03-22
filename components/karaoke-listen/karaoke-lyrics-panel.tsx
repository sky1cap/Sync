"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { LyricsPayload, RecognitionMatch } from "@/lib/karaoke/types";

type KaraokeLyricsPanelProps = {
  lyrics: LyricsPayload;
  match: RecognitionMatch;
};

function formatConfidence(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function KaraokeLyricsPanel({
  lyrics,
  match,
}: KaraokeLyricsPanelProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (lyrics.mode !== "synced" || lyrics.lines.length === 0) {
      return;
    }

    setElapsedMs(0);
    const startedAt = performance.now();
    const intervalId = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lyrics.lines, lyrics.mode, match.artist, match.title]);

  const activeIndex = useMemo(() => {
    if (lyrics.mode !== "synced" || lyrics.lines.length === 0) {
      return -1;
    }

    return lyrics.lines.reduce((currentIndex, line, index) => {
      if (elapsedMs >= line.timeMs) {
        return index;
      }

      return currentIndex;
    }, -1);
  }, [elapsedMs, lyrics.lines, lyrics.mode]);

  const scrollToActiveLine = useEffectEvent((index: number) => {
    const container = listRef.current;
    const line = lineRefs.current[index];

    if (!container || !line) {
      return;
    }

    const targetTop =
      line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;

    container.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  });

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    scrollToActiveLine(activeIndex);
  }, [activeIndex, scrollToActiveLine]);

  return (
    <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-5 py-5 shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(97,242,194,0.18),transparent_72%)]" />

      <div className="relative space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-alt text-[0.68rem] uppercase tracking-[0.28em] text-slate-300">
              {lyrics.mode === "synced" ? "Synced lyrics" : "Lyrics fallback"}
            </span>
            <span className="text-xs font-medium text-emerald-200/80">
              Match confidence {formatConfidence(match.confidence)}
            </span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
              {match.title}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {match.artist}
              {match.album ? ` • ${match.album}` : ""}
            </p>
          </div>
        </div>

        {lyrics.mode === "synced" ? (
          <div
            ref={listRef}
            className="scrollbar-hide h-[52vh] space-y-3 overflow-y-auto pr-1"
          >
            {lyrics.lines.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <motion.div
                  key={`${line.timeMs}-${index}`}
                  ref={(node) => {
                    lineRefs.current[index] = node;
                  }}
                  className={cn(
                    "rounded-[1.3rem] border px-4 py-3 transition-colors duration-300",
                    isActive
                      ? "border-emerald-200/30 bg-emerald-300/12 text-white shadow-[0_0_36px_rgba(97,242,194,0.24)]"
                      : isPast
                        ? "border-white/5 bg-white/[0.03] text-slate-400"
                        : "border-white/8 bg-white/[0.04] text-slate-200",
                  )}
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.02, 1],
                          opacity: 1,
                        }
                      : {
                          scale: 1,
                          opacity: isPast ? 0.5 : 0.88,
                        }
                  }
                  transition={{
                    duration: 0.45,
                    ease: "easeOut",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono-alt text-[0.72rem] text-emerald-200/65">
                      {line.timestamp}
                    </span>
                    <p className="text-lg leading-8 tracking-tight">{line.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : lyrics.mode === "plain" ? (
          <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-4">
            <p className="mb-3 text-sm text-slate-300">
              LRCLIB returned plain lyrics, so the karaoke highlight falls back to a static read mode.
            </p>
            <pre className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap font-sans text-base leading-7 text-slate-100">
              {lyrics.plain}
            </pre>
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.03] p-6 text-center text-sm leading-7 text-slate-300">
            No synced lyrics found for this match. Try another 10-second clip from a chorus or a cleaner section of the song.
          </div>
        )}
      </div>
    </section>
  );
}
