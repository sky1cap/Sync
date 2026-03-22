import { parseLrc } from "@/lib/karaoke/lrc";
import type { LyricsPayload, RecognitionMatch } from "@/lib/karaoke/types";

type LrclibTrack = {
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  plainLyrics?: string;
  syncedLyrics?: string;
};

function buildLyricsPayload(track: LrclibTrack | null): LyricsPayload {
  if (!track) {
    return {
      mode: "none",
      source: "none",
      synced: null,
      plain: null,
      duration: null,
      lines: [],
    };
  }

  const lines = parseLrc(track.syncedLyrics);
  const plain = track.plainLyrics || null;
  const synced = track.syncedLyrics || null;

  if (lines.length > 0) {
    return {
      mode: "synced",
      source: "lrclib",
      synced,
      plain,
      duration: track.duration || null,
      lines,
    };
  }

  if (plain) {
    return {
      mode: "plain",
      source: "lrclib",
      synced,
      plain,
      duration: track.duration || null,
      lines: [],
    };
  }

  return {
    mode: "none",
    source: "none",
    synced: null,
    plain: null,
    duration: null,
    lines: [],
  };
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function chooseBestTrack(candidates: LrclibTrack[], match: RecognitionMatch) {
  const title = normalize(match.title);
  const artist = normalize(match.artist);

  return (
    candidates.find(
      (candidate) =>
        normalize(candidate.trackName) === title &&
        normalize(candidate.artistName).includes(artist),
    ) ||
    candidates.find((candidate) => Boolean(candidate.syncedLyrics)) ||
    candidates[0] ||
    null
  );
}

async function fetchLrclib<T>(path: string, searchParams: URLSearchParams) {
  const response = await fetch(`https://lrclib.net${path}?${searchParams.toString()}`, {
    cache: "no-store",
    headers: {
      "User-Agent": "Karaoke Listen MVP/1.0",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("LRCLIB lookup failed.");
  }

  return (await response.json()) as T;
}

export async function fetchLyrics(match: RecognitionMatch): Promise<LyricsPayload> {
  const getParams = new URLSearchParams({
    track_name: match.title,
    artist_name: match.artist,
  });

  if (match.album) {
    getParams.set("album_name", match.album);
  }

  const exactMatch = await fetchLrclib<LrclibTrack>("/api/get", getParams);
  const exactPayload = exactMatch ? buildLyricsPayload(exactMatch) : null;

  if (exactPayload?.mode === "synced") {
    return exactPayload;
  }

  const searchParams = new URLSearchParams({
    track_name: match.title,
    artist_name: match.artist,
  });

  const candidates =
    (await fetchLrclib<LrclibTrack[]>("/api/search", searchParams)) || [];
  const bestCandidate = chooseBestTrack(
    exactMatch ? [exactMatch, ...candidates] : candidates,
    match,
  );
  const searchPayload = buildLyricsPayload(bestCandidate);

  if (searchPayload.mode !== "none") {
    return searchPayload;
  }

  return (
    exactPayload || {
      mode: "none",
      source: "none",
      synced: null,
      plain: null,
      duration: null,
      lines: [],
    }
  );
}
