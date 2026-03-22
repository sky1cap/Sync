import type { LyricsLine } from "@/lib/karaoke/types";

const TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

function decimalToMilliseconds(value?: string) {
  if (!value) {
    return 0;
  }

  if (value.length === 3) {
    return Number(value);
  }

  return Number(value) * 10;
}

function formatTimestamp(minutes: number, seconds: number, hundredths?: string) {
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (!hundredths) {
    return `${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}.${hundredths.padEnd(2, "0").slice(0, 2)}`;
}

export function parseLrc(raw: string | null | undefined): LyricsLine[] {
  if (!raw) {
    return [];
  }

  const parsedLines = raw
    .split("\n")
    .flatMap((row) => {
      const matches = Array.from(row.matchAll(TIMESTAMP_PATTERN));
      const text = row.replace(TIMESTAMP_PATTERN, "").trim();

      if (matches.length === 0 || text.length === 0) {
        return [];
      }

      return matches.map((match) => {
        const minutes = Number(match[1]);
        const seconds = Number(match[2]);
        const decimals = match[3];
        const timeMs =
          minutes * 60_000 + seconds * 1000 + decimalToMilliseconds(decimals);

        return {
          text,
          timeMs,
          timestamp: formatTimestamp(minutes, seconds, decimals),
        };
      });
    })
    .sort((left, right) => left.timeMs - right.timeMs);

  return parsedLines;
}
