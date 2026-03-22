import type { RecognitionMatch } from "@/lib/karaoke/types";

type AcoustIdLookupParams = {
  apiKey: string;
  duration: number;
  fingerprint: string;
};

type AcoustIdArtist = {
  name?: string;
};

type AcoustIdReleaseGroup = {
  title?: string;
};

type AcoustIdRecording = {
  id?: string;
  title?: string;
  artists?: AcoustIdArtist[];
  releasegroups?: AcoustIdReleaseGroup[];
};

type AcoustIdResult = {
  id?: string;
  score?: number;
  recordings?: AcoustIdRecording[];
};

type AcoustIdLookupResponse = {
  status?: string;
  error?: {
    message?: string;
  };
  results?: AcoustIdResult[];
};

function firstDefinedRecording(results: AcoustIdResult[]) {
  return results
    .filter((result) => result.recordings?.length)
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0];
}

export async function lookupWithAcoustId({
  apiKey,
  duration,
  fingerprint,
}: AcoustIdLookupParams): Promise<RecognitionMatch | null> {
  const params = new URLSearchParams({
    client: apiKey,
    format: "json",
    meta: "recordings+releasegroups+compress",
    duration: String(Math.round(duration)),
    fingerprint,
  });

  const response = await fetch(`https://api.acoustid.org/v2/lookup?${params.toString()}`, {
    cache: "no-store",
    headers: {
      "User-Agent": "Karaoke Listen MVP/1.0",
    },
  });

  const payload = (await response.json()) as AcoustIdLookupResponse;

  if (!response.ok || payload.status !== "ok") {
    throw new Error(payload.error?.message || "AcoustID lookup failed.");
  }

  const bestResult = firstDefinedRecording(payload.results || []);
  const bestRecording = bestResult?.recordings?.[0];
  const artists = bestRecording?.artists
    ?.map((artist) => artist.name)
    .filter((value): value is string => Boolean(value));

  if (!bestResult || !bestRecording?.title) {
    return null;
  }

  return {
    title: bestRecording.title,
    artist: artists?.join(", ") || "Unknown artist",
    album: bestRecording.releasegroups?.[0]?.title || null,
    confidence: bestResult.score ?? 0,
    source: "acoustid",
    acoustidId: bestResult.id || null,
    musicbrainzRecordingId: bestRecording.id || null,
  };
}
