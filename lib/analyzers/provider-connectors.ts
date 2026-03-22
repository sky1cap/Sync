type GbpProviderInput = {
  hotelName?: string;
  websiteUrl?: string;
  googleBusinessUrl?: string;
};

type BookingProviderInput = {
  hotelName?: string;
  bookingUrl?: string;
};

type GbpProviderResult = {
  rating?: number;
  reviewCount?: number;
  category?: string;
  positives?: string;
  negatives?: string;
  assumption?: string;
};

type BookingProviderResult = {
  rating?: number;
  reviewCount?: number;
  positives?: string;
  negatives?: string;
  assumption?: string;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!match?.[0]) return undefined;
    const parsed = Number(match[0]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const toInt = (value: unknown): number | undefined => {
  const parsed = toNumber(value);
  if (parsed === undefined) return undefined;
  return Math.round(parsed);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const firstText = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return undefined;
};

const extractMapsQueryFromUrl = (url?: string) => {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get("q")?.trim();
    if (q) return q;

    const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch?.[1]) {
      return decodeURIComponent(placeMatch[1]).replace(/\+/g, " ").trim();
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const toReadableWebsiteHost = (url?: string) => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return undefined;
  }
};

const summarizeReviews = (
  reviews: Array<{ text?: string; language?: string; rating?: number }> | undefined,
) => {
  if (!reviews?.length) return {};
  const positives: string[] = [];
  const negatives: string[] = [];

  for (const review of reviews) {
    if (!review?.text) continue;
    const text = review.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (review.rating !== undefined && review.rating < 3.5) negatives.push(text);
    if (review.rating !== undefined && review.rating >= 4) positives.push(text);
    if (review.rating === undefined) {
      const lower = text.toLowerCase();
      if (/(great|excellent|clean|friendly|ottimo|eccellente|pulit|staff)/i.test(lower)) {
        positives.push(text);
      }
      if (/(bad|dirty|noise|rumor|poor|scarso|sporco|attesa|lento)/i.test(lower)) {
        negatives.push(text);
      }
    }
  }

  return {
    positives: positives.length ? positives.slice(0, 2).join(" | ").slice(0, 220) : undefined,
    negatives: negatives.length ? negatives.slice(0, 2).join(" | ").slice(0, 220) : undefined,
  };
};

export const fetchGbpFromGooglePlaces = async (
  input: GbpProviderInput,
): Promise<GbpProviderResult | undefined> => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return undefined;

  const queryCandidates = [
    extractMapsQueryFromUrl(input.googleBusinessUrl),
    input.hotelName,
    [input.hotelName, toReadableWebsiteHost(input.websiteUrl)].filter(Boolean).join(" "),
    toReadableWebsiteHost(input.websiteUrl),
  ].filter((value): value is string => !!value);

  const query = queryCandidates.find((value) => value.trim().length >= 3);
  if (!query) return undefined;

  try {
    const findUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
    );
    findUrl.searchParams.set("input", query);
    findUrl.searchParams.set("inputtype", "textquery");
    findUrl.searchParams.set(
      "fields",
      "place_id,name,rating,user_ratings_total,types,formatted_address",
    );
    findUrl.searchParams.set("language", "it");
    findUrl.searchParams.set("key", key);

    const findResponse = await fetch(findUrl.toString(), { cache: "no-store" });
    if (!findResponse.ok) return undefined;
    const findJson = (await findResponse.json()) as {
      status?: string;
      candidates?: Array<{
        place_id?: string;
        rating?: number;
        user_ratings_total?: number;
        types?: string[];
      }>;
    };

    const candidate = findJson.candidates?.[0];
    if (!candidate?.place_id) {
      return {
        assumption: `GBP API: nessun place_id trovato per query '${query}'.`,
      };
    }

    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", candidate.place_id);
    detailsUrl.searchParams.set(
      "fields",
      "name,rating,user_ratings_total,types,reviews,editorial_summary,url,business_status",
    );
    detailsUrl.searchParams.set("reviews_sort", "newest");
    detailsUrl.searchParams.set("language", "it");
    detailsUrl.searchParams.set("key", key);

    const detailsResponse = await fetch(detailsUrl.toString(), { cache: "no-store" });
    if (!detailsResponse.ok) {
      return {
        rating: candidate.rating,
        reviewCount: candidate.user_ratings_total,
        category: candidate.types?.[0]?.replace(/_/g, " "),
        assumption:
          "GBP API: details non disponibili, usati dati base da Find Place.",
      };
    }

    const detailsJson = (await detailsResponse.json()) as {
      result?: {
        rating?: number;
        user_ratings_total?: number;
        types?: string[];
        reviews?: Array<{ text?: string; language?: string; rating?: number }>;
        editorial_summary?: { overview?: string };
      };
    };

    const result = detailsJson.result;
    const reviewSignals = summarizeReviews(result?.reviews);

    const positives =
      reviewSignals.positives ?? firstText(result?.editorial_summary?.overview);

    return {
      rating: toNumber(result?.rating ?? candidate.rating),
      reviewCount: toInt(result?.user_ratings_total ?? candidate.user_ratings_total),
      category: result?.types?.[0]?.replace(/_/g, " "),
      positives,
      negatives: reviewSignals.negatives,
      assumption:
        "GBP API: dati estratti da Google Places API (Find Place + Details).",
    };
  } catch {
    return {
      assumption: "GBP API: errore durante estrazione Google Places.",
    };
  }
};

const readApifyDataset = async (
  token: string,
  actorId: string,
  input: Record<string, unknown>,
): Promise<unknown[] | undefined> => {
  const endpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(
    actorId,
  )}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!response.ok) return undefined;
  const payload = (await response.json()) as unknown;
  if (Array.isArray(payload)) return payload;
  return undefined;
};

export const fetchBookingFromApify = async (
  input: BookingProviderInput,
): Promise<BookingProviderResult | undefined> => {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.BOOKING_APIFY_ACTOR_ID;
  if (!token || !actorId || !input.bookingUrl) return undefined;

  const actorInput = {
    url: input.bookingUrl,
    bookingUrl: input.bookingUrl,
    urls: [input.bookingUrl],
    startUrls: [{ url: input.bookingUrl }],
    maxResults: 1,
    maxItems: 1,
    getDetails: true,
    includeReviews: true,
    includeReviewSummary: true,
  };

  try {
    const items = await readApifyDataset(token, actorId, actorInput);
    if (!items?.length) {
      return {
        assumption: "Booking API (Apify): nessun item restituito dall'actor.",
      };
    }

    const first = items[0] as Record<string, unknown>;
    const rating = toNumber(
      first.reviewScore ??
        first.rating ??
        first.score ??
        first.review_rating ??
        first.guestRating,
    );
    const reviewCount = toInt(
      first.reviewsCount ??
        first.reviewCount ??
        first.numberOfReviews ??
        first.totalReviews ??
        first.review_count,
    );

    const positiveText = firstText(
      first.reviewSummaryPositive,
      first.positiveSummary,
      first.prosSummary,
      first.positiveHighlights,
    );
    const negativeText = firstText(
      first.reviewSummaryNegative,
      first.negativeSummary,
      first.consSummary,
      first.negativeHighlights,
    );

    const normalizedRating =
      rating !== undefined ? (rating <= 5 ? clamp(rating * 2, 0, 10) : clamp(rating, 0, 10)) : undefined;

    if (
      normalizedRating === undefined &&
      reviewCount === undefined &&
      !positiveText &&
      !negativeText
    ) {
      return {
        assumption: "Booking API (Apify): item presente ma senza campi rating/reviews utilizzabili.",
      };
    }

    return {
      rating: normalizedRating,
      reviewCount,
      positives: positiveText,
      negatives: negativeText,
      assumption: `Booking API (Apify): dati estratti con actor '${actorId}'.`,
    };
  } catch {
    return {
      assumption: "Booking API (Apify): errore durante chiamata actor.",
    };
  }
};

