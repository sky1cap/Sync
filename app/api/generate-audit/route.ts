import { NextResponse } from "next/server";
import { enhanceReportWithLlm, extractSourceSignalsWithLlm } from "@/lib/analyzers/llm-audit";
import { enrichReportWithLiveData } from "@/lib/analyzers/live-audit";
import { fetchBookingFromApify, fetchGbpFromGooglePlaces } from "@/lib/analyzers/provider-connectors";
import { buildMockReport } from "@/lib/mock/report-mock";
import { SourceState } from "@/lib/types/report";
import { auditInputSchema } from "@/lib/validations/audit";

const BLOCKED_STATUS_CODES = new Set([401, 403, 407, 429, 451]);
const DIRECT_TIMEOUT_MS = 8000;
const PROXY_TIMEOUT_MS = 9000;
const READ_PROXY_BASE = "https://r.jina.ai/http://";

type SourceKey = "website" | "gbp" | "booking";

type ProbeResult = {
  state: SourceState;
  note?: string;
  title?: string;
  html?: string;
  finalUrl?: string;
};

const fallbackHotelNameFromUrl = (url: string) => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const root = hostname.split(".")[0] ?? "Hotel";
    const normalized = root.replace(/[-_]/g, " ").trim();
    return normalized ? `Hotel ${normalized}` : "Hotel senza nome";
  } catch {
    return "Hotel senza nome";
  }
};

const domainMismatch = (source: SourceKey, url: string) => {
  const lowered = url.toLowerCase();
  if (source === "gbp") return !lowered.includes("google.") && !lowered.includes("maps.");
  if (source === "booking") return !lowered.includes("booking.");
  return false;
};

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!match?.[1]) return undefined;
  const title = match[1].replace(/\s+/g, " ").trim();
  return title || undefined;
};

const extractReadableTitle = (rawText: string) => {
  const titleLine = rawText.match(/^Title:\s*(.+)$/im)?.[1]?.trim();
  if (titleLine) return titleLine;
  const firstHeading = rawText.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return firstHeading || undefined;
};

const isBookingChallengePage = (html: string) =>
  /AwsWafIntegration|__challenge_|verify that you're not a robot|JavaScript is disabled/i.test(
    html,
  );

const isDisallowedHost = (rawUrl: string) => {
  try {
    const { hostname } = new URL(rawUrl);
    const lowered = hostname.toLowerCase();

    if (lowered === "localhost" || lowered.endsWith(".local")) return true;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(lowered)) {
      const [a, b] = lowered.split(".").map((value) => Number(value));
      if (a === 10) return true;
      if (a === 127) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 0) return true;
    }
  } catch {
    return true;
  }

  return false;
};

const toReadProxyUrl = (rawUrl: string) => {
  const withoutScheme = rawUrl.replace(/^https?:\/\//i, "");
  return `${READ_PROXY_BASE}${withoutScheme}`;
};

const fetchReadableProxy = async (
  source: SourceKey,
  rawUrl: string,
  reason: string,
): Promise<ProbeResult | undefined> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const response = await fetch(toReadProxyUrl(rawUrl), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; HotelTargetAuditBot/1.0; +https://hoteltarget.example)",
        accept: "text/plain,text/markdown;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return undefined;
    const text = (await response.text()).slice(0, 1_000_000).trim();
    if (text.length < 160) return undefined;

    return {
      state: "partially_accessible",
      note: `${source.toUpperCase()}: estrazione reale riuscita via proxy di lettura dopo ${reason}.`,
      title: extractReadableTitle(text),
      html: text,
      finalUrl: rawUrl,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
};

async function probeUrl(source: SourceKey, rawUrl: string | undefined): Promise<ProbeResult> {
  if (!rawUrl) {
    return {
      state: "not_provided",
      note: `${source.toUpperCase()}: fonte non fornita dall'utente.`,
    };
  }

  if (domainMismatch(source, rawUrl)) {
    return {
      state: "partially_accessible",
      note: `${source.toUpperCase()}: URL fornito non coerente con il canale atteso; verifica parziale.`,
    };
  }

  if (isDisallowedHost(rawUrl)) {
    return {
      state: "blocked",
      note: `${source.toUpperCase()}: host non consentito per motivi di sicurezza.`,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);

  try {
    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; HotelTargetAuditBot/1.0; +https://hoteltarget.example)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (BLOCKED_STATUS_CODES.has(response.status)) {
      const fallback = await fetchReadableProxy(
        source,
        rawUrl,
        `blocco sorgente HTTP ${response.status}`,
      );
      if (fallback) return fallback;
      return {
        state: "blocked",
        note: `${source.toUpperCase()}: accesso bloccato dalla sorgente (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const fallback = await fetchReadableProxy(
        source,
        rawUrl,
        `risposta HTTP ${response.status}`,
      );
      if (fallback) return fallback;
      return {
        state: "partially_accessible",
        note: `${source.toUpperCase()}: risposta incompleta o non valida (HTTP ${response.status}).`,
      };
    }

    if (source === "website") {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const html = (await response.text()).slice(0, 1_200_000);
        const title = extractTitle(html);
        return {
          state: "accessible",
          note: `${source.toUpperCase()}: URL raggiungibile e verificato (HTTP ${response.status}).`,
          title,
          html,
          finalUrl: response.url,
        };
      }
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const html = (await response.text()).slice(0, 900_000);
      if (source === "booking" && isBookingChallengePage(html)) {
        const fallback = await fetchReadableProxy(source, rawUrl, "challenge anti-bot");
        if (fallback) return fallback;
        return {
          state: "partially_accessible",
          note: `${source.toUpperCase()}: pagina protetta da challenge anti-bot, dati recensioni non direttamente estraibili.`,
          html,
          finalUrl: response.url,
        };
      }
      return {
        state: "accessible",
        note: `${source.toUpperCase()}: URL raggiungibile e verificato (HTTP ${response.status}).`,
        html,
        finalUrl: response.url,
      };
    }

    return {
      state: "accessible",
      note: `${source.toUpperCase()}: URL raggiungibile e verificato (HTTP ${response.status}).`,
      finalUrl: response.url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "errore_non_specificato";

    if (message.toLowerCase().includes("abort")) {
      const fallback = await fetchReadableProxy(source, rawUrl, "timeout sorgente");
      if (fallback) return fallback;
      return {
        state: "partially_accessible",
        note: `${source.toUpperCase()}: timeout di verifica sorgente (${Math.round(
          DIRECT_TIMEOUT_MS / 1000,
        )}s).`,
      };
    }

    const fallback = await fetchReadableProxy(source, rawUrl, "errore rete");
    if (fallback) return fallback;

    return {
      state: "blocked",
      note: `${source.toUpperCase()}: impossibile verificare la sorgente (${message}).`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = auditInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Input non valido",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [websiteProbe, gbpProbe, bookingProbe] = await Promise.all([
      probeUrl("website", parsed.data.websiteUrl),
      probeUrl("gbp", parsed.data.googleBusinessUrl),
      probeUrl("booking", parsed.data.bookingUrl),
    ]);
    const [gbpProviderData, bookingProviderData, llmExtractedSignals] = await Promise.all([
      fetchGbpFromGooglePlaces({
        hotelName: parsed.data.hotelName,
        websiteUrl: parsed.data.websiteUrl,
        googleBusinessUrl: parsed.data.googleBusinessUrl,
      }),
      fetchBookingFromApify({
        hotelName: parsed.data.hotelName,
        bookingUrl: parsed.data.bookingUrl,
      }),
      extractSourceSignalsWithLlm({
        hotelName: parsed.data.hotelName,
        websiteUrl: parsed.data.websiteUrl,
        googleBusinessUrl: parsed.data.googleBusinessUrl,
        bookingUrl: parsed.data.bookingUrl,
        gbpHtml: gbpProbe.html,
        bookingHtml: bookingProbe.html,
        sourceStatus: {
          gbp: gbpProbe.state,
          booking: bookingProbe.state,
        },
      }),
    ]);

    const gbpManualMerged = {
      rating: parsed.data.gbpRating ?? gbpProviderData?.rating ?? llmExtractedSignals?.gbp?.rating,
      reviewCount:
        parsed.data.gbpReviewCount ??
        gbpProviderData?.reviewCount ??
        llmExtractedSignals?.gbp?.reviewCount,
      category:
        parsed.data.gbpPrimaryCategory ?? gbpProviderData?.category ?? llmExtractedSignals?.gbp?.category,
      positives:
        parsed.data.gbpPositiveHighlights ??
        gbpProviderData?.positives ??
        llmExtractedSignals?.gbp?.positives,
      negatives:
        parsed.data.gbpNegativeHighlights ??
        gbpProviderData?.negatives ??
        llmExtractedSignals?.gbp?.negatives,
    };
    const bookingManualMerged = {
      rating:
        parsed.data.bookingRating ?? bookingProviderData?.rating ?? llmExtractedSignals?.booking?.rating,
      reviewCount:
        parsed.data.bookingReviewCount ??
        bookingProviderData?.reviewCount ??
        llmExtractedSignals?.booking?.reviewCount,
      positives:
        parsed.data.bookingPositiveHighlights ??
        bookingProviderData?.positives ??
        llmExtractedSignals?.booking?.positives,
      negatives:
        parsed.data.bookingNegativeHighlights ??
        bookingProviderData?.negatives ??
        llmExtractedSignals?.booking?.negatives,
    };

    const hasGbpManual =
      gbpManualMerged.rating !== undefined ||
      gbpManualMerged.reviewCount !== undefined ||
      gbpManualMerged.category !== undefined ||
      gbpManualMerged.positives !== undefined ||
      gbpManualMerged.negatives !== undefined;

    const hasBookingManual =
      bookingManualMerged.rating !== undefined ||
      bookingManualMerged.reviewCount !== undefined ||
      bookingManualMerged.positives !== undefined ||
      bookingManualMerged.negatives !== undefined;

    const report = buildMockReport(
      {
        ...parsed.data,
        hotelName:
          parsed.data.hotelName ??
          websiteProbe.title ??
          fallbackHotelNameFromUrl(parsed.data.websiteUrl),
      },
      {
        sourceStatusOverride: {
          website: websiteProbe.state,
          gbp: gbpProbe.state,
          booking: bookingProbe.state,
        },
        assumptionsPrefix: [
          websiteProbe.note,
          gbpProbe.note,
          bookingProbe.note,
          gbpProviderData?.assumption,
          bookingProviderData?.assumption,
          ...(llmExtractedSignals?.assumptions ?? []),
        ].filter((value): value is string => !!value),
      },
    );
    const enrichedReport = enrichReportWithLiveData(report, {
      website: websiteProbe.html
        ? {
            url: websiteProbe.finalUrl ?? parsed.data.websiteUrl,
            html: websiteProbe.html,
            hotelName: parsed.data.hotelName ?? websiteProbe.title,
          }
        : undefined,
      gbp: gbpProbe.html ? { html: gbpProbe.html } : undefined,
      gbpManual: hasGbpManual ? gbpManualMerged : undefined,
      booking: bookingProbe.html ? { html: bookingProbe.html } : undefined,
      bookingManual: hasBookingManual ? bookingManualMerged : undefined,
      sourceStatus: {
        website: websiteProbe.state,
        gbp: gbpProbe.state,
        booking: bookingProbe.state,
      },
    });
    const finalReport = await enhanceReportWithLlm(enrichedReport);

    /**
     * Estensione futura LLM:
     * - oggi: miglioramento narrativo su report strutturato già calcolato.
     * - prossimo step: generazione full-report JSON da prompt + validazione Zod end-to-end.
     * - valutare function calling per estrazione controllata e salvataggio persistente (DB).
     */

    return NextResponse.json({ report: finalReport });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Errore interno durante la generazione audit",
        details: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
