import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import type { RecognizeResponse } from "@/lib/karaoke/types";
import {
  RecognitionSetupError,
  fingerprintAudio,
  normalizeAudioForFingerprinting,
} from "@/lib/server/recognition/audio-processing";
import { fetchLyrics } from "@/lib/server/recognition/lrclib";
import { recognizeSong } from "@/lib/server/recognition/providers";

export const runtime = "nodejs";
export const maxDuration = 30;

function getExtensionFromAudioFile(file: File) {
  const extension = path.extname(file.name);

  if (extension) {
    return extension;
  }

  if (file.type.includes("mp4")) {
    return ".m4a";
  }

  if (file.type.includes("ogg")) {
    return ".ogg";
  }

  return ".webm";
}

async function writeIncomingAudio(file: File) {
  const preferredTempRoot = process.env.KARAOKE_TMP_DIR || tmpdir();
  const fallbackTempRoot = path.join(process.cwd(), ".karaoke-tmp");

  const writableTempRoot = await mkdir(preferredTempRoot, { recursive: true })
    .then(() => preferredTempRoot)
    .catch(async () => {
      await mkdir(fallbackTempRoot, { recursive: true });
      return fallbackTempRoot;
    });

  const workDir = path.join(writableTempRoot, `karaoke-listen-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  const inputPath = path.join(workDir, `input${getExtensionFromAudioFile(file)}`);
  const normalizedPath = path.join(workDir, "normalized.wav");
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(inputPath, bytes);

  return {
    workDir,
    inputPath,
    normalizedPath,
  };
}

function createErrorResponse(
  status: number,
  code: string,
  error: string,
) {
  return NextResponse.json<RecognizeResponse>(
    {
      ok: false,
      code,
      error,
    },
    { status },
  );
}

export async function POST(request: Request) {
  let workDir: string | null = null;

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return createErrorResponse(400, "missing_audio", "Attach an audio file in the audio form field.");
    }

    const writtenAudio = await writeIncomingAudio(audio);
    workDir = writtenAudio.workDir;

    await normalizeAudioForFingerprinting(
      writtenAudio.inputPath,
      writtenAudio.normalizedPath,
    );

    const fingerprint = await fingerprintAudio(writtenAudio.normalizedPath);
    const recognition = await recognizeSong(fingerprint);

    if (!recognition) {
      return createErrorResponse(
        404,
        "no_match",
        "No confident song match was found. Try a clearer 10-second chorus clip.",
      );
    }

    const lyrics = await fetchLyrics(recognition.match);

    return NextResponse.json<RecognizeResponse>({
      ok: true,
      match: recognition.match,
      lyrics,
      diagnostics: {
        recognitionProvider: recognition.provider,
        lyricsProvider: lyrics.source,
        clipDuration: fingerprint.duration,
      },
    });
  } catch (error) {
    if (error instanceof RecognitionSetupError) {
      return createErrorResponse(503, "server_setup", error.message);
    }

    return createErrorResponse(
      500,
      "server_error",
      error instanceof Error ? error.message : "Recognition failed unexpectedly.",
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true });
    }
  }
}
