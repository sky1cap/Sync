export type LyricsLine = {
  text: string;
  timeMs: number;
  timestamp: string;
};

export type LyricsPayload = {
  mode: "synced" | "plain" | "none";
  source: "lrclib" | "none";
  synced: string | null;
  plain: string | null;
  duration: number | null;
  lines: LyricsLine[];
};

export type RecognitionMatch = {
  title: string;
  artist: string;
  album: string | null;
  confidence: number;
  source: string;
  acoustidId: string | null;
  musicbrainzRecordingId: string | null;
};

export type RecognitionDiagnostics = {
  recognitionProvider: string;
  lyricsProvider: string;
  clipDuration: number;
};

export type RecognizeSuccessResponse = {
  ok: true;
  match: RecognitionMatch;
  lyrics: LyricsPayload;
  diagnostics: RecognitionDiagnostics;
};

export type RecognizeErrorResponse = {
  ok: false;
  code: string;
  error: string;
};

export type RecognizeResponse = RecognizeSuccessResponse | RecognizeErrorResponse;
