import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class RecognitionSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecognitionSetupError";
  }
}

type FingerprintPayload = {
  duration: number;
  fingerprint: string;
};

function getFfmpegPath() {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

function getFpcalcPath() {
  return process.env.FPCALC_PATH || "fpcalc";
}

async function ensureBinary(binaryPath: string, args: string[], helpText: string) {
  try {
    await execFileAsync(binaryPath, args, {
      maxBuffer: 1024 * 1024,
    });
  } catch {
    throw new RecognitionSetupError(helpText);
  }
}

async function runBinary(binaryPath: string, args: string[]) {
  const result = await execFileAsync(binaryPath, args, {
    maxBuffer: 8 * 1024 * 1024,
  });

  return result.stdout.trim();
}

export async function normalizeAudioForFingerprinting(
  inputPath: string,
  outputPath: string,
) {
  const ffmpegPath = getFfmpegPath();

  await ensureBinary(
    ffmpegPath,
    ["-version"],
    "ffmpeg is not available on the server. Install ffmpeg or set FFMPEG_PATH.",
  );

  await execFileAsync(
    ffmpegPath,
    [
      "-y",
      "-i",
      inputPath,
      "-ac",
      "1",
      "-ar",
      "11025",
      "-t",
      "10",
      "-vn",
      "-acodec",
      "pcm_s16le",
      outputPath,
    ],
    {
      maxBuffer: 8 * 1024 * 1024,
    },
  );
}

export async function fingerprintAudio(normalizedFilePath: string): Promise<FingerprintPayload> {
  const fpcalcPath = getFpcalcPath();

  await ensureBinary(
    fpcalcPath,
    ["-version"],
    "Chromaprint fpcalc is not available on the server. Install chromaprint or set FPCALC_PATH.",
  );

  const stdout = await runBinary(fpcalcPath, ["-json", normalizedFilePath]);
  const parsed = JSON.parse(stdout) as Partial<FingerprintPayload>;

  if (!parsed.fingerprint || typeof parsed.duration !== "number") {
    throw new Error("fpcalc returned an invalid fingerprint payload.");
  }

  return {
    duration: parsed.duration,
    fingerprint: parsed.fingerprint,
  };
}
