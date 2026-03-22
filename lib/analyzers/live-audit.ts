import { AuditReport, GbpIssueRow, PriorityItem, SourceState, WebsiteRadarMetric } from "@/lib/types/report";

type WebsiteProbeInput = {
  url: string;
  html: string;
  hotelName?: string;
};

type GbpProbeInput = {
  html: string;
};

type GbpManualInput = {
  rating?: number;
  reviewCount?: number;
  category?: string;
  positives?: string;
  negatives?: string;
};

type BookingProbeInput = {
  html: string;
};

type BookingManualInput = {
  rating?: number;
  reviewCount?: number;
  positives?: string;
  negatives?: string;
};

type LiveAuditPayload = {
  website?: WebsiteProbeInput;
  gbp?: GbpProbeInput;
  gbpManual?: GbpManualInput;
  booking?: BookingProbeInput;
  bookingManual?: BookingManualInput;
  sourceStatus: {
    website: SourceState;
    gbp: SourceState;
    booking: SourceState;
  };
};

type WebsiteSignal = {
  radar: WebsiteRadarMetric[];
  assumptions: string[];
  issues: AuditReport["websiteAnalysis"]["criticalIssues"];
  topProblems: PriorityItem[];
  topOpportunities: PriorityItem[];
  websiteScore: number;
  directConversion: number;
  brandingSignal: number;
};

type GbpSignal = {
  assumptions: string[];
  score: number;
  metrics: AuditReport["gbpAnalysis"]["metrics"];
  issues: GbpIssueRow[];
};

type BookingSignal = {
  assumptions: string[];
  score: number;
  sentiment: AuditReport["bookingAnalysis"]["sentiment"];
  factors: AuditReport["bookingAnalysis"]["factors"];
  physicalInterventions: string[];
  otaOptimizations: string[];
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const stripScriptsAndStyles = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

const toText = (html: string) =>
  stripScriptsAndStyles(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countMatches = (value: string, regex: RegExp) => {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matcher = new RegExp(regex.source, flags);
  const matches = value.match(matcher);
  return matches?.length ?? 0;
};

const getMetaContent = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const namePattern = new RegExp(
    `<meta[^>]*(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const contentPattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${escaped}["'][^>]*>`,
    "i",
  );
  return namePattern.exec(html)?.[1]?.trim() ?? contentPattern.exec(html)?.[1]?.trim();
};

const extractHrefs = (html: string) =>
  Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => !!value);

const analyzeWebsite = ({ url, html, hotelName }: WebsiteProbeInput): WebsiteSignal => {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const metaDescription = getMetaContent(html, "description");
  const viewport = getMetaContent(html, "viewport");
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  const ogSiteName = getMetaContent(html, "og:site_name");
  const ogImage = getMetaContent(html, "og:image");
  const langPresent = /<html[^>]*\slang=["'][^"']+["'][^>]*>/i.test(html);
  const navPresent = /<nav[\s>]/i.test(html);
  const formCount = countMatches(html, /<form[\s>]/i);
  const scriptCount = countMatches(html, /<script[\s>]/i);
  const imageTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((match) => match[0]);
  const imageCount = imageTags.length;
  const altCount = imageTags.filter((tag) => /alt=["'][^"']*["']/i.test(tag)).length;
  const lazyCount = imageTags.filter((tag) => /loading=["']lazy["']/i.test(tag)).length;
  const headingCount = countMatches(html, /<h[1-6][\s>]/i);
  const h1Count = countMatches(html, /<h1[\s>]/i);
  const hrefs = extractHrefs(html);
  const hostname = new URL(url).hostname;
  const internalLinks = hrefs.filter((href) => {
    if (href.startsWith("/")) return true;
    if (!/^https?:\/\//i.test(href)) return false;
    try {
      return new URL(href).hostname === hostname;
    } catch {
      return false;
    }
  }).length;
  const externalLinks = hrefs.filter((href) => /^https?:\/\//i.test(href)).length - internalLinks;

  const text = toText(html);
  const textLower = text.toLowerCase();
  const wordCount = textLower.split(/\s+/).filter(Boolean).length;
  const ctaCount = countMatches(
    textLower,
    /(prenota ora|prenota|book now|book your stay|book|check availability|verifica disponibilit|richiedi preventivo|contattaci)/i,
  );
  const bookingEngineSignals = countMatches(
    textLower,
    /(booking engine|best rate|miglior tariffa|direct booking|prenotazione diretta|book direct)/i,
  );
  const contactSignals = countMatches(textLower, /(tel:|telefono|phone|email|whatsapp|\+\d{2,})/i);
  const faqSignals = countMatches(textLower, /(faq|domande frequenti|policy|cancellation|termini|condizioni)/i);
  const preconnectSignals = countMatches(html, /rel=["'](?:preconnect|preload)["']/i);
  const webpSignals = countMatches(html, /\.(webp|avif)(["'?])/i);
  const mediaQueryHints = countMatches(html, /(?:@media|max-width|min-width|viewport)/i);
  const altRatio = imageCount ? altCount / imageCount : 0;
  const lazyRatio = imageCount ? lazyCount / imageCount : 0;
  const brandToken = (hotelName ?? title ?? "")
    .toLowerCase()
    .replace(/hotel/g, "")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 2)[0];
  const brandMentions = brandToken ? countMatches(textLower, new RegExp(`\\b${brandToken}\\b`, "i")) : 0;

  const seoScore = clamp(
    35 +
      (title ? 12 : 0) +
      (metaDescription ? 12 : 0) +
      (canonical ? 8 : 0) +
      (langPresent ? 7 : 0) +
      (h1Count === 1 ? 14 : h1Count > 1 ? 7 : 0) +
      (headingCount >= 8 ? 8 : headingCount >= 4 ? 4 : 0) +
      (internalLinks >= 20 ? 8 : internalLinks >= 10 ? 4 : 0),
    25,
    96,
  );

  const uxScore = clamp(
    38 +
      (navPresent ? 12 : 0) +
      (contactSignals > 0 ? 10 : 0) +
      (faqSignals > 0 ? 8 : 0) +
      (formCount > 0 ? 9 : 0) +
      (internalLinks >= 15 ? 9 : internalLinks >= 8 ? 5 : 0) +
      (wordCount >= 800 ? 8 : wordCount >= 450 ? 4 : 0),
    28,
    95,
  );

  const uiScore = clamp(
    42 +
      (imageCount >= 8 ? 10 : imageCount >= 3 ? 6 : 0) +
      (altRatio >= 0.8 ? 16 : altRatio >= 0.55 ? 10 : altRatio >= 0.3 ? 4 : -3) +
      (ogImage ? 8 : 0) +
      (countMatches(html, /rel=["']icon["']/i) > 0 ? 6 : 0) +
      (headingCount >= 6 ? 5 : 0),
    30,
    94,
  );

  const mobileScore = clamp(
    28 +
      (viewport ? 32 : 0) +
      (mediaQueryHints >= 3 ? 15 : mediaQueryHints >= 1 ? 8 : 0) +
      (ctaCount >= 2 ? 8 : ctaCount >= 1 ? 4 : 0) +
      (formCount > 0 ? 8 : 0) +
      (countMatches(html, /type=["']tel["']/i) > 0 ? 5 : 0),
    20,
    95,
  );

  const performanceScore = clamp(
    60 +
      (lazyRatio >= 0.7 ? 12 : lazyRatio >= 0.35 ? 7 : imageCount > 8 ? -8 : 0) +
      (preconnectSignals > 0 ? 8 : 0) +
      (webpSignals > 0 ? 8 : 0) +
      (scriptCount > 25 ? -20 : scriptCount > 16 ? -10 : 0) +
      (imageCount > 35 ? -16 : imageCount > 20 ? -8 : 0),
    18,
    92,
  );

  const conversionScore = clamp(
    28 +
      Math.min(28, ctaCount * 6) +
      Math.min(18, bookingEngineSignals * 7) +
      (formCount > 0 ? 10 : 0) +
      (contactSignals > 0 ? 10 : 0),
    22,
    94,
  );

  const brandingScore = clamp(
    40 +
      (title ? 12 : 0) +
      (ogSiteName ? 10 : 0) +
      (brandMentions >= 5 ? 12 : brandMentions >= 2 ? 7 : 0) +
      (h1Count > 0 ? 8 : 0),
    25,
    96,
  );

  const radar: WebsiteRadarMetric[] = [
    { metric: "SEO", score: seoScore },
    { metric: "UX", score: uxScore },
    { metric: "UI", score: uiScore },
    { metric: "Mobile", score: mobileScore },
    { metric: "Performance", score: performanceScore },
    { metric: "Conversione", score: conversionScore },
    { metric: "Branding", score: brandingScore },
  ];

  const issues: AuditReport["websiteAnalysis"]["criticalIssues"] = [];

  if (!viewport) {
    issues.push({
      problem: "Meta viewport assente o incompleto",
      whyItHurts: "La resa mobile risulta poco ottimizzata e aumenta l'attrito nel funnel diretto.",
      economicImpact: "Perdita potenziale 8-14% conversioni da smartphone.",
      severity: "Critica",
      recommendation: "Inserire viewport responsive e verificare breakpoints chiave della pagina principale.",
      priority: "P1",
    });
  }

  if (ctaCount < 2 || bookingEngineSignals < 1) {
    issues.push({
      problem: "Call-to-action di prenotazione poco evidenti",
      whyItHurts: `Sono stati rilevati ${ctaCount} segnali CTA e ${bookingEngineSignals} riferimenti alla prenotazione diretta.`,
      economicImpact: "Riduzione della quota diretta e maggiore dispersione verso OTA.",
      severity: "Alta",
      recommendation: "Rendere persistente la CTA 'Prenota ora' e rinforzare il messaggio Best Rate sul funnel.",
      priority: "P1",
    });
  }

  if (!metaDescription || !canonical || h1Count !== 1) {
    issues.push({
      problem: "Struttura SEO on-page incompleta",
      whyItHurts: "Meta description/canonical/H1 non sono pienamente allineati agli standard SEO tecnici.",
      economicImpact: "Minore visibilità su query transazionali ad alta intenzione.",
      severity: "Alta",
      recommendation: "Allineare title, description, canonical e gerarchia heading su tutte le pagine principali.",
      priority: "P1",
    });
  }

  if (scriptCount > 16 || (imageCount > 12 && lazyRatio < 0.3)) {
    issues.push({
      problem: "Peso pagina e asset non ottimizzati",
      whyItHurts: `Rilevati ${scriptCount} script, ${imageCount} immagini e lazy loading su ${Math.round(
        lazyRatio * 100,
      )}% delle immagini.`,
      economicImpact: "Aumento bounce rate e perdita traffico organico qualificato.",
      severity: "Alta",
      recommendation: "Ridurre JS non essenziale, comprimere immagini e adottare lazy loading in modo sistemico.",
      priority: "P1",
    });
  }

  if (issues.length < 3) {
    issues.push({
      problem: "Architettura contenuti migliorabile per scelta camera",
      whyItHurts: "Il percorso informativo non semplifica confronto e decisione rapida lato utente.",
      economicImpact: "Possibile riduzione 4-8% della conversione su sessioni qualificate.",
      severity: "Media",
      recommendation: "Introdurre blocchi comparativi camere/benefit e CTA contestuali in ogni sezione.",
      priority: "P2",
    });
  }

  const sortedRadar = [...radar].sort((a, b) => a.score - b.score);

  const topProblems: PriorityItem[] = sortedRadar.slice(0, 2).map((row) => ({
    title: `${row.metric} sotto benchmark`,
    detail: `L'area ${row.metric} registra ${row.score}/100 nel check reale del sito.`,
    impact: "Riduzione potenziale di visibilità organica e/o conversione diretta.",
    severity: row.score < 45 ? "Critica" : row.score < 60 ? "Alta" : "Media",
    priority: row.score < 60 ? "P1" : "P2",
  }));

  const topOpportunities: PriorityItem[] = sortedRadar.slice(-2).map((row) => ({
    title: `${row.metric} già competitivo`,
    detail: `L'area ${row.metric} mostra segnali solidi (${row.score}/100) su cui scalare.`,
    impact: "Base pronta per aumentare quota diretta e performance commerciale.",
    severity: "Media",
    priority: "P2",
  }));

  const websiteScore = clamp(radar.reduce((acc, row) => acc + row.score, 0) / radar.length, 20, 97);
  const assumptions = [
    `Sito analizzato su HTML pubblico: ${wordCount} parole, ${internalLinks} link interni, ${externalLinks} link esterni.`,
    `Segnali conversione rilevati: ${ctaCount} CTA testuali e ${formCount} form.`,
  ];

  return {
    radar,
    assumptions,
    issues: issues.slice(0, 5),
    topProblems,
    topOpportunities,
    websiteScore,
    directConversion: conversionScore,
    brandingSignal: brandingScore,
  };
};

const normalizeRatingTo100 = (rawValue: number) => {
  if (rawValue <= 5) return clamp(rawValue * 20);
  if (rawValue <= 10) return clamp(rawValue * 10);
  if (rawValue <= 100) return clamp(rawValue);
  return 0;
};

type JsonRecord = Record<string, unknown>;

const parseNumberValue = (input: string, integer = false) => {
  if (integer) {
    const digits = input.replace(/[^\d]/g, "");
    if (!digits) return undefined;
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const normalized = input.replace(/\s+/g, "").replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match?.[0]) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseNumberValue(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const toInteger = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = parseNumberValue(value, true);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const collectJsonRecords = (value: unknown, out: JsonRecord[]) => {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonRecords(item, out);
    return;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    out.push(record);
    for (const nested of Object.values(record)) {
      collectJsonRecords(nested, out);
    }
  }
};

const parseJsonLdRecords = (html: string) => {
  const scripts = Array.from(
    html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
  const records: JsonRecord[] = [];

  for (const script of scripts) {
    const raw = script[1]?.trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      collectJsonRecords(parsed, records);
    } catch {
      continue;
    }
  }

  return records;
};

const getNodeTypes = (node: JsonRecord) => {
  const rawType = node["@type"];
  if (typeof rawType === "string") return [rawType.toLowerCase()];
  if (Array.isArray(rawType)) {
    return rawType
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());
  }
  return [];
};

const extractAggregateSignals = (records: JsonRecord[], typeHints: string[]) => {
  const hints = typeHints.map((hint) => hint.toLowerCase());
  const signal = {
    rating: undefined as number | undefined,
    reviewCount: undefined as number | undefined,
    hasAddress: false,
    hasPhone: false,
    hasOpeningHours: false,
    hasGeo: false,
    hasImage: false,
    hasPriceRange: false,
  };

  for (const node of records) {
    const types = getNodeTypes(node);
    const matchesType =
      types.length === 0 || hints.some((hint) => types.some((entry) => entry.includes(hint)));
    if (!matchesType) continue;

    if (!signal.hasAddress && node.address) signal.hasAddress = true;
    if (!signal.hasPhone && (node.telephone || node.contactPoint)) signal.hasPhone = true;
    if (!signal.hasOpeningHours && (node.openingHours || node.openingHoursSpecification)) {
      signal.hasOpeningHours = true;
    }
    if (!signal.hasGeo && node.geo) signal.hasGeo = true;
    if (!signal.hasImage && node.image) signal.hasImage = true;
    if (!signal.hasPriceRange && node.priceRange) signal.hasPriceRange = true;

    const aggregate = (node.aggregateRating ?? node.reviewRating) as JsonRecord | undefined;
    if (!aggregate || typeof aggregate !== "object") continue;

    const rating = toNumber(aggregate.ratingValue ?? aggregate.rating ?? aggregate.bestRating);
    const reviewCount = toInteger(
      aggregate.reviewCount ?? aggregate.ratingCount ?? aggregate.reviewTotal,
    );

    if (rating && !signal.rating) signal.rating = rating;
    if (reviewCount && !signal.reviewCount) signal.reviewCount = reviewCount;
  }

  return signal;
};

const countRegexHits = (value: string, patterns: RegExp[]) =>
  patterns.reduce((acc, pattern) => acc + countMatches(value, pattern), 0);

const extractFirstNumber = (html: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match?.[1]) continue;
    const parsed = parseNumberValue(match[1]);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const extractFirstInteger = (html: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match?.[1]) continue;
    const parsed = parseNumberValue(match[1], true);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const analyzeGbp = ({ html }: GbpProbeInput): GbpSignal | undefined => {
  const records = parseJsonLdRecords(html);
  const aggregate = extractAggregateSignals(records, [
    "LocalBusiness",
    "LodgingBusiness",
    "Hotel",
    "Place",
  ]);

  const rating =
    aggregate.rating ??
    extractFirstNumber(html, [
      /"ratingValue"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
      /ratingValue["'>:\s]+(\d+(?:[.,]\d+)?)/i,
      /\brating[^0-9]{0,25}(\d+(?:[.,]\d+)?)/i,
      /rated[^0-9]{0,25}(\d+(?:[.,]\d+)?)\s*(?:out of|\/)\s*5/i,
      /(\d+(?:[.,]\d+)?)\s*(?:out of|\/)\s*5\b/i,
    ]);
  const reviewCount =
    aggregate.reviewCount ??
    extractFirstInteger(html, [
      /"reviewCount"\s*:\s*"?(\d[\d.,\s]{0,12})"?/i,
      /reviewCount["'>:\s]+(\d[\d.,\s]{0,12})/i,
      /(\d[\d.,\s]{0,12})\s+reviews?\b/i,
      /(\d[\d.,\s]{0,12})\s+recensioni\b/i,
    ]);
  const text = toText(html).toLowerCase();
  const postSignals = countRegexHits(text, [
    /\bpost\b/i,
    /\bofferte?\b/i,
    /\beventi\b/i,
    /\bupdate\b/i,
  ]);
  const serviceSignals = countRegexHits(text, [
    /\bservizi\b/i,
    /\bamenities\b/i,
    /\bwi[- ]?fi\b/i,
    /\bspa\b/i,
    /\bparking|parcheggio\b/i,
  ]);
  const completenessFlags = [
    aggregate.hasAddress || /streetaddress|indirizzo|address/i.test(html),
    aggregate.hasPhone || /telephone|telefono|tel[:\s]/i.test(html),
    aggregate.hasOpeningHours || /openinghours|orari|hours/i.test(html),
    aggregate.hasGeo || /latitude|longitude|coordinate/i.test(html),
    aggregate.hasImage || /"photo"|image/i.test(html),
    aggregate.hasPriceRange || /pricerange|fascia prezzo|price range/i.test(html),
    serviceSignals > 0,
    postSignals > 0,
  ];
  const completenessDetected = completenessFlags.filter(Boolean).length;

  if (!rating && !reviewCount && completenessDetected < 2) return undefined;

  const reputation = rating ? normalizeRatingTo100(rating) : clamp(42 + completenessDetected * 4, 25, 80);
  const volumeBoost = reviewCount ? Math.min(18, Math.log10(reviewCount + 1) * 6.5) : 0;
  const localSeo = clamp(reputation * 0.58 + volumeBoost + completenessDetected * 2.5, 24, 95);
  const completeness = clamp(25 + completenessDetected * 10 + (reviewCount ? 12 : 0), 20, 95);
  const score = clamp((localSeo * 0.35 + reputation * 0.45 + completeness * 0.2) / 1, 26, 96);

  const issues: GbpIssueRow[] = [];

  if (completeness < 65) {
    issues.push({
      problem: "Profilo GBP incompleto o poco strutturato",
      whyItHurts:
        "Attributi chiave, servizi o contenuti visual ridotti limitano ranking locale e fiducia immediata.",
      bookingImpact: "Minor CTR da Local Pack e minore propensione al contatto diretto.",
      severity: completeness < 50 ? "Alta" : "Media",
      recommendation: "Completare attributi, servizi, media e aggiornamenti ricorrenti con CTA commerciale.",
      priority: "P1",
    });
  }

  if (!reviewCount || reviewCount < 80) {
    issues.push({
      problem: "Volume recensioni non competitivo",
      whyItHurts: "Una base recensioni limitata riduce autorevolezza rispetto ai competitor locali.",
      bookingImpact: "Perdita visibilità su ricerche geolocalizzate con alta intenzione.",
      severity: "Media",
      recommendation:
        "Attivare workflow post-stay per aumentare recensioni recenti e distribuzione rating stabile.",
      priority: "P2",
    });
  }

  if (reputation < 80) {
    issues.push({
      problem: "Reputazione GBP sotto soglia premium",
      whyItHurts:
        "Un rating non competitivo riduce fiducia percepita e capacità di difendere ADR e conversione.",
      bookingImpact: "Minore qualità del traffico in ingresso e riduzione lead dirette.",
      severity: reputation < 70 ? "Alta" : "Media",
      recommendation: "Gestire risposte recensioni con SLA <48h e piano continuo di quality recovery.",
      priority: "P1",
    });
  }

  if (issues.length === 0) {
    issues.push({
      problem: "Presidio GBP buono ma scalabile",
      whyItHurts: "Senza cadenza editoriale costante si perde slancio competitivo sul local intent.",
      bookingImpact: "Opportunità non sfruttate su keyword ad alta conversione.",
      severity: "Media",
      recommendation: "Pianificare calendario post, media e offerte locali su base mensile.",
      priority: "P2",
    });
  }

  const assumptions = [
    `GBP: ${
      rating
        ? `rating pubblico ${rating}${reviewCount ? ` su ${Math.round(reviewCount)} recensioni` : ""}`
        : "rating non disponibile, analisi basata su completezza profilo"
    }.`,
    `Segnali completezza rilevati: ${completenessDetected}/8.`,
  ];

  return {
    assumptions,
    score,
    metrics: [
      { metric: "Local SEO", score: localSeo },
      { metric: "Reputazione", score: reputation },
      { metric: "Completezza Profilo", score: completeness },
    ],
    issues,
  };
};

const hasManualGbpData = (manual?: GbpManualInput) =>
  !!(
    manual?.rating !== undefined ||
    manual?.reviewCount !== undefined ||
    manual?.category ||
    manual?.positives ||
    manual?.negatives
  );

const analyzeGbpManual = (manual: GbpManualInput): GbpSignal | undefined => {
  if (!hasManualGbpData(manual)) return undefined;

  const reputation =
    manual.rating !== undefined
      ? clamp(normalizeRatingTo100(manual.rating), 0, 100)
      : clamp(48 + (manual.positives ? 8 : 0) - (manual.negatives ? 6 : 0), 22, 88);
  const localSeo = clamp(
    reputation * 0.55 +
      (manual.reviewCount ? Math.min(16, Math.log10(manual.reviewCount + 1) * 6.5) : 0) +
      (manual.category ? 8 : 0),
    18,
    95,
  );
  const completeness = clamp(
    42 +
      (manual.category ? 16 : 0) +
      (manual.reviewCount ? 14 : 0) +
      (manual.positives ? 8 : 0) +
      (manual.negatives ? 5 : 0),
    20,
    92,
  );
  const score = clamp(localSeo * 0.35 + reputation * 0.45 + completeness * 0.2, 20, 95);

  const issues: GbpIssueRow[] = [
    {
      problem: "Analisi GBP derivata da input manuale",
      whyItHurts:
        "Senza estrazione diretta dal profilo, alcune dinamiche ranking locali possono risultare parzialmente non visibili.",
      bookingImpact: "Priorità locale attendibile ma da confermare con accesso diretto alla scheda.",
      severity: "Media",
      recommendation: "Integrare accesso diretto GBP/API per validazione automatica periodica.",
      priority: "P1",
    },
    {
      problem: "Governance reputazionale da strutturare",
      whyItHurts:
        manual.negatives?.trim() ?? "La mancanza di monitoraggio continuo può peggiorare CTR e fiducia locale.",
      bookingImpact: "Impatto su chiamate dirette, indicazioni e visite sito dal Local Pack.",
      severity: reputation < 75 ? "Alta" : "Media",
      recommendation:
        "Definire playbook recensioni con SLA risposte <48h e monitoraggio mensile sentiment locale.",
      priority: "P1",
    },
  ];

  return {
    assumptions: [
      "GBP: analisi generata da input manuali validati forniti dall'utente (fallback accesso limitato).",
      `Dati manuali GBP: rating ${
        manual.rating !== undefined ? `${manual.rating}/5` : "non fornito"
      }, recensioni ${manual.reviewCount !== undefined ? manual.reviewCount : "non fornite"}${
        manual.category ? `, categoria '${manual.category}'` : ""
      }.`,
    ],
    score,
    metrics: [
      { metric: "Local SEO", score: localSeo },
      { metric: "Reputazione", score: reputation },
      { metric: "Completezza Profilo", score: completeness },
    ],
    issues,
  };
};

const analyzeBooking = ({ html }: BookingProbeInput): BookingSignal | undefined => {
  const records = parseJsonLdRecords(html);
  const aggregate = extractAggregateSignals(records, [
    "Hotel",
    "LodgingBusiness",
    "Accommodation",
    "Product",
  ]);

  const rating =
    aggregate.rating ??
    extractFirstNumber(html, [
      /"reviewScore"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
      /"ratingValue"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
      /(?:review|guest)\s*score[^0-9]{0,20}(\d+(?:[.,]\d+)?)/i,
      /(?:valutazione|voto|punteggio)\s*ospiti[^0-9]{0,20}(\d+(?:[.,]\d+)?)/i,
      /review score[^0-9]*(\d+(?:[.,]\d+)?)/i,
      /scored[^0-9]*(\d+(?:[.,]\d+)?)/i,
      /punteggio[^0-9]*(\d+(?:[.,]\d+)?)/i,
      /(\d+(?:[.,]\d+)?)\s*\/\s*10\b/i,
    ]);
  const reviewCount =
    aggregate.reviewCount ??
    extractFirstInteger(html, [
      /"reviewCount"\s*:\s*"?(\d[\d.,\s]{0,12})"?/i,
      /"reviews?_count"\s*:\s*"?(\d[\d.,\s]{0,12})"?/i,
      /based on[^0-9]{0,20}(\d[\d.,\s]{1,12})\s+reviews?\b/i,
      /su[^0-9]{0,20}(\d[\d.,\s]{1,12})\s+recensioni\b/i,
      /(\d[\d.,\s]{1,12})\s+reviews?\b/i,
      /(\d[\d.,\s]{1,12})\s+recensioni\b/i,
    ]);
  const text = toText(html).toLowerCase();
  const positiveKeywords = [
    /\bexcellent\b/i,
    /\bgreat\b/i,
    /\bfantastic\b/i,
    /\bclean\b/i,
    /\bfriendly\b/i,
    /\bcomfortable\b/i,
    /\bcolazione\b/i,
    /\bbreakfast\b/i,
    /\bposizione\b|\blocation\b/i,
  ];
  const negativeKeywords = [
    /\bdirty\b|\bsporco\b/i,
    /\bnoise\b|\brumore\b|\bnoisy\b/i,
    /\bcold\b|\bfredd[oa]\b/i,
    /\bsmall\b|\bpiccol[oa]\b/i,
    /\bold\b|\bdatat[oa]\b/i,
    /\bbad\b|\bscarso\b/i,
    /\bslow\b|\blento\b/i,
  ];
  const positiveHits = countRegexHits(text, positiveKeywords);
  const negativeHits = countRegexHits(text, negativeKeywords);

  if (!rating && !reviewCount && positiveHits + negativeHits < 3) return undefined;

  const qualitativeBase = clamp(
    56 + Math.min(14, positiveHits * 2.2) - Math.min(18, negativeHits * 2.8),
    26,
    86,
  );
  const baseSentiment = rating
    ? normalizeRatingTo100(rating)
    : reviewCount
      ? clamp(52 + Math.min(12, reviewCount / 100), 35, 88)
      : qualitativeBase;
  const cleanlinessNeg = countMatches(text, /(dirty|sporco|pulizia scarsa|unclean)/i);
  const noiseNeg = countMatches(text, /(noise|rumore|noisy|insonorizz)/i);
  const breakfastPos = countMatches(text, /(breakfast|colazione|buffet)/i);
  const positive = clamp(baseSentiment + Math.min(8, positiveHits) - Math.min(10, negativeHits), 25, 96);
  const negative = clamp(100 - positive, 0, 100);
  const score = clamp(positive - 8 + (reviewCount ? Math.min(4, Math.log10(reviewCount + 1)) : 0), 22, 97);

  const factors: AuditReport["bookingAnalysis"]["factors"] = [
    {
      factor: "Qualità del sonno / rumore",
      guestPerception:
        noiseNeg > 0 ? "Nei contenuti pubblici compaiono segnali relativi al rumore." : "Segnali misti, tema da monitorare.",
      impact: "Incide direttamente su reputazione business e recensioni 6-8+.",
      severity: noiseNeg > 1 || score < 70 ? "Alta" : "Media",
      recommendation: "Interventi su insonorizzazione + comunicazione camera più adatta al target.",
      priority: "P1",
    },
    {
      factor: "Pulizia percepita",
      guestPerception:
        cleanlinessNeg > 0 ? "Sono presenti menzioni negative sulla pulizia." : "Percezione generalmente stabile.",
      impact: "Driver chiave della conversione su OTA e fiducia pre-prenotazione.",
      severity: cleanlinessNeg > 0 ? "Alta" : "Media",
      recommendation: "Audit housekeeping e checklist qualità sulle camere ad alta rotazione.",
      priority: "P1",
    },
    {
      factor: "Colazione e servizi inclusi",
      guestPerception: breakfastPos > 0 ? "Tema citato con frequenza nei contenuti pubblici." : "Copertura informativa parziale.",
      impact: "Può aumentare valore percepito e ADR sostenibile.",
      severity: "Media",
      recommendation: "Valorizzare foto/benefit in prima schermata OTA e nella room description.",
      priority: "P2",
    },
  ];

  const assumptions = [
    rating
      ? `Booking: punteggio recensioni pubblico ${rating}${
          reviewCount ? ` su ${Math.round(reviewCount)} recensioni` : ""
        }.`
      : reviewCount
        ? `Booking: rating non disponibile, volume recensioni rilevato ${Math.round(reviewCount)}.`
        : "Booking: rating/volume non esposti; sentiment stimato da segnali testuali pubblici.",
    `Segnali testuali rilevati: ${positiveHits} positivi / ${negativeHits} negativi.`,
  ];

  return {
    assumptions,
    score,
    sentiment: [
      { name: "Positivo", value: positive },
      { name: "Negativo", value: negative },
    ],
    factors,
    physicalInterventions: [
      "Migliorare insonorizzazione delle camere esposte su strada.",
      "Standardizzare controllo qualità housekeeping nei picchi stagionali.",
      "Aggiornare set-up bagno e illuminazione nelle tipologie standard.",
    ],
    otaOptimizations: [
      "Riorganizzare le prime foto della pagina OTA con focus su camera, bagno e colazione.",
      "Rinforzare headline e benefit esclusivi con copy orientato alla conversione.",
      "Allineare naming camere ai principali driver cercati dagli ospiti.",
    ],
  };
};

const hasManualBookingData = (manual?: BookingManualInput) =>
  !!(manual?.rating !== undefined || manual?.reviewCount !== undefined || manual?.positives || manual?.negatives);

const analyzeBookingManual = (manual: BookingManualInput): BookingSignal | undefined => {
  if (!hasManualBookingData(manual)) return undefined;

  const rating =
    manual.rating !== undefined ? clamp(normalizeRatingTo100(manual.rating), 0, 100) : undefined;
  const reviewCount = manual.reviewCount;
  const positive = clamp(
    (rating ?? 55) +
      (reviewCount ? Math.min(5, Math.log10(reviewCount + 1)) : 0) +
      (manual.positives ? 4 : 0) -
      (manual.negatives ? 3 : 0),
    10,
    96,
  );
  const negative = clamp(100 - positive, 0, 100);
  const score = clamp(positive - 6, 15, 95);

  const positiveText = manual.positives?.trim();
  const negativeText = manual.negatives?.trim();

  const factors: AuditReport["bookingAnalysis"]["factors"] = [
    {
      factor: "Punteggio recensioni complessivo",
      guestPerception:
        manual.rating !== undefined
          ? `Dato manuale fornito: ${manual.rating}/10${
              reviewCount !== undefined ? ` su ${reviewCount} recensioni` : ""
            }.`
          : "Punteggio non fornito: stima basata su altre evidenze manuali.",
      impact: "Influenza fiducia pre-prenotazione, ADR sostenibile e ranking interno OTA.",
      severity: score < 65 ? "Alta" : score < 78 ? "Media" : "Bassa",
      recommendation:
        "Aggiornare periodicamente rating e volume recensioni per mantenere allineata l'analisi commerciale.",
      priority: "P1",
    },
    {
      factor: "Pattern positivi dichiarati",
      guestPerception: positiveText ?? "Non forniti.",
      impact: "I driver positivi guidano conversione e pricing premium sulla pagina OTA.",
      severity: positiveText ? "Bassa" : "Media",
      recommendation:
        "Mappare i pattern positivi nei primi contenuti visual/testuali della pagina Booking.",
      priority: "P2",
    },
    {
      factor: "Pattern negativi dichiarati",
      guestPerception: negativeText ?? "Non forniti.",
      impact: "I pattern negativi impattano reputazione e tasso di cancellazione.",
      severity: negativeText ? "Alta" : "Media",
      recommendation:
        "Creare piano correttivo su criticità ricorrenti e monitorare impatto su rating trimestrale.",
      priority: "P1",
    },
  ];

  return {
    assumptions: [
      "Booking: analisi generata da input manuali validati forniti dall'utente (fallback anti-bot).",
      `Dati manuali Booking: rating ${
        manual.rating !== undefined ? `${manual.rating}/10` : "non fornito"
      }, recensioni ${reviewCount !== undefined ? reviewCount : "non fornite"}.`,
    ],
    score,
    sentiment: [
      { name: "Positivo", value: positive },
      { name: "Negativo", value: negative },
    ],
    factors,
    physicalInterventions: [
      "Allineare gli interventi fisici alle criticità emerse dai feedback manuali forniti.",
      "Validare trimestralmente l'impatto degli interventi sul rating Booking.",
    ],
    otaOptimizations: [
      "Aggiornare copy e media della pagina OTA in base ai driver positivi e negativi condivisi.",
      "Sincronizzare headline/camera benefits con i pattern reputazionali reali raccolti.",
    ],
  };
};

const mergeGbpSignals = (base: GbpSignal, manual: GbpSignal): GbpSignal => {
  const manualMap = new Map(manual.metrics.map((metric) => [metric.metric, metric.score]));
  const mergedMetrics = base.metrics.map((metric) => {
    const manualScore = manualMap.get(metric.metric);
    if (manualScore === undefined) return metric;
    return { ...metric, score: clamp(metric.score * 0.55 + manualScore * 0.45, 0, 100) };
  });

  return {
    assumptions: [
      ...base.assumptions,
      ...manual.assumptions,
      "GBP: metriche finali combinate (estrazione URL + dati manuali).",
    ],
    score: clamp(base.score * 0.55 + manual.score * 0.45, 0, 100),
    metrics: mergedMetrics,
    issues: [...manual.issues, ...base.issues].slice(0, 5),
  };
};

const mergeBookingSignals = (base: BookingSignal, manual: BookingSignal): BookingSignal => {
  return {
    assumptions: [
      ...base.assumptions,
      ...manual.assumptions,
      "Booking: metriche finali combinate (estrazione URL + dati manuali).",
    ],
    score: clamp(base.score * 0.6 + manual.score * 0.4, 0, 100),
    sentiment: [
      {
        name: "Positivo",
        value: clamp(
          (base.sentiment.find((item) => item.name === "Positivo")?.value ?? 0) * 0.6 +
            (manual.sentiment.find((item) => item.name === "Positivo")?.value ?? 0) * 0.4,
          0,
          100,
        ),
      },
      {
        name: "Negativo",
        value: clamp(
          (base.sentiment.find((item) => item.name === "Negativo")?.value ?? 0) * 0.6 +
            (manual.sentiment.find((item) => item.name === "Negativo")?.value ?? 0) * 0.4,
          0,
          100,
        ),
      },
    ],
    factors: [...manual.factors, ...base.factors].slice(0, 5),
    physicalInterventions: Array.from(
      new Set([...manual.physicalInterventions, ...base.physicalInterventions]),
    ).slice(0, 6),
    otaOptimizations: Array.from(new Set([...manual.otaOptimizations, ...base.otaOptimizations])).slice(
      0,
      6,
    ),
  };
};

const applyGbpUnavailable = (report: AuditReport, reason: string) => {
  report.gbpAnalysis.metrics = [
    { metric: "Local SEO", score: 0 },
    { metric: "Reputazione", score: 0 },
    { metric: "Completezza Profilo", score: 0 },
  ];
  report.charts.gbpBars = report.gbpAnalysis.metrics;
  report.gbpAnalysis.localCompetitors = [];
  report.gbpAnalysis.issues = [
    {
      problem: "Dati Google Business non verificabili",
      whyItHurts: reason,
      bookingImpact: "Impossibile misurare con affidabilità ranking locale e impatto su prenotazioni.",
      severity: "Media",
      recommendation: "Fornire URL GBP accessibile o integrazione API Google Places per audit completo.",
      priority: "P1",
    },
  ];
};

const applyBookingUnavailable = (report: AuditReport, reason: string) => {
  report.bookingAnalysis.sentiment = [
    { name: "Positivo", value: 0 },
    { name: "Negativo", value: 0 },
  ];
  report.charts.bookingSentiment = report.bookingAnalysis.sentiment;
  report.bookingAnalysis.physicalInterventions = [
    "Fonte Booking non verificabile: impossibile derivare interventi fisici da dati reali.",
  ];
  report.bookingAnalysis.otaOptimizations = [
    "Fonte Booking non verificabile: impossibile derivare ottimizzazioni OTA evidence-based.",
  ];
  report.bookingAnalysis.factors = [
    {
      factor: "Copertura recensioni Booking",
      guestPerception: "Non verificabile con i dati pubblici attualmente disponibili.",
      impact: reason,
      severity: "Media",
      recommendation: "Fornire URL Booking accessibile o export recensioni per analisi completa.",
      priority: "P1",
    },
  ];
};

const recomputeSummaryScores = (report: AuditReport) => {
  const website = report.executiveSummary.scores.website;
  const gbp = report.executiveSummary.scores.gbp;
  const booking = report.executiveSummary.scores.booking;
  const directConversion = report.executiveSummary.scores.directConversion;
  const brand = clamp((report.executiveSummary.scores.brand + website) / 2, 20, 98);

  report.executiveSummary.scores.brand = brand;
  report.executiveSummary.scores.global = clamp(
    website * 0.33 + gbp * 0.26 + booking * 0.25 + directConversion * 0.16,
    20,
    98,
  );
};

export const enrichReportWithLiveData = (report: AuditReport, payload: LiveAuditPayload): AuditReport => {
  const enriched: AuditReport = structuredClone(report);
  const liveAssumptions: string[] = [];

  if (payload.sourceStatus.website === "accessible" && payload.website?.html) {
    const websiteSignal = analyzeWebsite(payload.website);
    enriched.websiteAnalysis.radar = websiteSignal.radar;
    enriched.charts.websiteRadar = websiteSignal.radar;
    enriched.websiteAnalysis.criticalIssues = websiteSignal.issues;
    enriched.executiveSummary.scores.website = websiteSignal.websiteScore;
    enriched.executiveSummary.scores.directConversion = websiteSignal.directConversion;
    enriched.executiveSummary.scores.brand = clamp((enriched.executiveSummary.scores.brand + websiteSignal.brandingSignal) / 2, 20, 98);

    enriched.executiveSummary.topProblems = [
      ...websiteSignal.topProblems,
      ...enriched.executiveSummary.topProblems,
    ].slice(0, 5);
    enriched.executiveSummary.topOpportunities = [
      ...websiteSignal.topOpportunities,
      ...enriched.executiveSummary.topOpportunities,
    ].slice(0, 5);
    liveAssumptions.push(...websiteSignal.assumptions);
  }

  let gbpSignal: GbpSignal | undefined;
  let gbpFallbackReason: string | undefined;

  if (payload.sourceStatus.gbp !== "not_provided" && payload.gbp?.html) {
    gbpSignal = analyzeGbp(payload.gbp);
    if (!gbpSignal) {
      enriched.sourceStatus.gbp = "partially_accessible";
      gbpFallbackReason =
        "La sorgente GBP è raggiungibile ma il contenuto pubblico non espone rating/attributi utilizzabili.";
    }
  } else if (payload.sourceStatus.gbp === "accessible") {
    enriched.sourceStatus.gbp = "partially_accessible";
    gbpFallbackReason = "La sorgente GBP non ha restituito contenuto HTML parsabile.";
  } else if (payload.sourceStatus.gbp !== "not_provided") {
    gbpFallbackReason = "La sorgente GBP risulta bloccata o parzialmente accessibile.";
  } else if (hasManualGbpData(payload.gbpManual)) {
    gbpFallbackReason = "URL GBP non fornito: analisi basata su evidenze manuali.";
  }

  if (gbpSignal) {
    const manualSignal = analyzeGbpManual(payload.gbpManual ?? {});
    const finalGbpSignal = manualSignal ? mergeGbpSignals(gbpSignal, manualSignal) : gbpSignal;

    enriched.gbpAnalysis.metrics = finalGbpSignal.metrics;
    enriched.charts.gbpBars = finalGbpSignal.metrics;
    enriched.gbpAnalysis.issues = finalGbpSignal.issues;
    enriched.executiveSummary.scores.gbp = finalGbpSignal.score;
    liveAssumptions.push(...finalGbpSignal.assumptions);
    if (payload.sourceStatus.gbp !== "accessible") {
      liveAssumptions.push(
        "GBP: fonte parzialmente accessibile, metriche calcolate sui dati pubblici estratti disponibili.",
      );
    }
  } else if (gbpFallbackReason) {
    const manualSignal = analyzeGbpManual(payload.gbpManual ?? {});
    if (manualSignal) {
      enriched.sourceStatus.gbp = "partially_accessible";
      enriched.gbpAnalysis.metrics = manualSignal.metrics;
      enriched.charts.gbpBars = manualSignal.metrics;
      enriched.gbpAnalysis.issues = manualSignal.issues;
      enriched.gbpAnalysis.localCompetitors = [];
      enriched.executiveSummary.scores.gbp = manualSignal.score;
      liveAssumptions.push(...manualSignal.assumptions);
      liveAssumptions.push(`GBP: estrazione URL limitata (${gbpFallbackReason}) ma compensata con dati manuali.`);
    } else if (payload.sourceStatus.gbp !== "not_provided") {
      applyGbpUnavailable(
        enriched,
        `${gbpFallbackReason} Per analisi completa aggiungi rating, recensioni e pattern manuali GBP.`,
      );
      liveAssumptions.push(
        "GBP parziale: fornisci dati manuali (rating, review count, highlights) per completare l'analisi.",
      );
    }
  }

  let bookingSignal: BookingSignal | undefined;
  let bookingFallbackReason: string | undefined;

  if (payload.sourceStatus.booking !== "not_provided" && payload.booking?.html) {
    bookingSignal = analyzeBooking(payload.booking);
    if (!bookingSignal) {
      enriched.sourceStatus.booking = "partially_accessible";
      bookingFallbackReason =
        "La sorgente Booking è raggiungibile ma non espone dati recensioni chiaramente parsabili.";
    }
  } else if (payload.sourceStatus.booking === "accessible") {
    enriched.sourceStatus.booking = "partially_accessible";
    bookingFallbackReason = "La sorgente Booking non ha restituito contenuto HTML parsabile.";
  } else if (payload.sourceStatus.booking !== "not_provided") {
    bookingFallbackReason = "La sorgente Booking risulta bloccata o parzialmente accessibile.";
  } else if (hasManualBookingData(payload.bookingManual)) {
    bookingFallbackReason = "URL Booking non fornito: analisi basata su evidenze manuali.";
  }

  if (bookingSignal) {
    const manualSignal = analyzeBookingManual(payload.bookingManual ?? {});
    const finalBookingSignal = manualSignal
      ? mergeBookingSignals(bookingSignal, manualSignal)
      : bookingSignal;

    enriched.bookingAnalysis.sentiment = finalBookingSignal.sentiment;
    enriched.charts.bookingSentiment = finalBookingSignal.sentiment;
    enriched.bookingAnalysis.factors = finalBookingSignal.factors;
    enriched.bookingAnalysis.physicalInterventions = finalBookingSignal.physicalInterventions;
    enriched.bookingAnalysis.otaOptimizations = finalBookingSignal.otaOptimizations;
    enriched.executiveSummary.scores.booking = finalBookingSignal.score;
    liveAssumptions.push(...finalBookingSignal.assumptions);
    if (payload.sourceStatus.booking !== "accessible") {
      liveAssumptions.push(
        "Booking: fonte parzialmente accessibile, sentiment/driver stimati da contenuti pubblici estratti.",
      );
    }
  } else if (bookingFallbackReason) {
    const manualSignal = analyzeBookingManual(payload.bookingManual ?? {});
    if (manualSignal) {
      if (payload.sourceStatus.booking === "not_provided") {
        enriched.sourceStatus.booking = "partially_accessible";
      }
      enriched.bookingAnalysis.sentiment = manualSignal.sentiment;
      enriched.charts.bookingSentiment = manualSignal.sentiment;
      enriched.bookingAnalysis.factors = manualSignal.factors;
      enriched.bookingAnalysis.physicalInterventions = manualSignal.physicalInterventions;
      enriched.bookingAnalysis.otaOptimizations = manualSignal.otaOptimizations;
      enriched.executiveSummary.scores.booking = manualSignal.score;
      liveAssumptions.push(...manualSignal.assumptions);
      liveAssumptions.push(`Booking: estrazione URL limitata (${bookingFallbackReason}) ma compensata con dati manuali.`);
    } else {
      applyBookingUnavailable(
        enriched,
        `${bookingFallbackReason} Per analisi completa aggiungi rating, numero recensioni e pattern positivi/negativi.`,
      );
      liveAssumptions.push(
        "Booking parziale: fornisci dati manuali (rating, review count, highlights) per completare l'analisi.",
      );
    }
  }

  recomputeSummaryScores(enriched);
  if (liveAssumptions.length > 0) {
    enriched.assumptions = [...liveAssumptions, ...enriched.assumptions].slice(0, 12);
  }

  return enriched;
};
