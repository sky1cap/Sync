import type { RecognitionMatch } from "@/lib/karaoke/types";
import { RecognitionSetupError } from "@/lib/server/recognition/audio-processing";
import { lookupWithAcoustId } from "@/lib/server/recognition/acoustid";

export type RecognitionProviderInput = {
  duration: number;
  fingerprint: string;
};

export interface RecognitionProvider {
  readonly id: string;
  recognize(input: RecognitionProviderInput): Promise<RecognitionMatch | null>;
}

class AcoustIdRecognitionProvider implements RecognitionProvider {
  readonly id = "acoustid";

  async recognize(input: RecognitionProviderInput) {
    const apiKey = process.env.ACOUSTID_API_KEY;

    if (!apiKey) {
      throw new RecognitionSetupError(
        "ACOUSTID_API_KEY is missing. Create a free AcoustID app key and add it to your environment.",
      );
    }

    if (apiKey === "cSpUJKpD") {
      throw new RecognitionSetupError(
        "The sample AcoustID key is for basic demo usage and is not reliable for real song matching. Set your own ACOUSTID_API_KEY from acoustid.org.",
      );
    }

    return lookupWithAcoustId({
      apiKey,
      duration: input.duration,
      fingerprint: input.fingerprint,
    });
  }
}

export function getRecognitionProviders(): RecognitionProvider[] {
  return [new AcoustIdRecognitionProvider()];
}

export async function recognizeSong(
  input: RecognitionProviderInput,
): Promise<{
  provider: string;
  match: RecognitionMatch;
} | null> {
  for (const provider of getRecognitionProviders()) {
    const match = await provider.recognize(input);

    if (match) {
      return {
        provider: provider.id,
        match,
      };
    }
  }

  return null;
}
