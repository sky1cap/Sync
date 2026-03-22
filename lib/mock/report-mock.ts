import { AuditInput, AuditReport, SourceState, SourceStatus } from "@/lib/types/report";

const toId = () =>
  `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const hashString = (value: string) =>
  value
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000, 17);

const resolveSourceState = (
  url: string | undefined,
  source: "website" | "gbp" | "booking",
): SourceState => {
  if (!url) return "not_provided";

  const lowered = url.toLowerCase();

  if (source === "gbp" && !lowered.includes("google")) return "partially_accessible";
  if (source === "booking" && !lowered.includes("booking")) return "partially_accessible";
  if (lowered.includes("private") || lowered.includes("login")) return "blocked";

  return "accessible";
};

const baseFromState = (state: SourceState, max: number, min = 30) => {
  switch (state) {
    case "accessible":
      return max;
    case "partially_accessible":
      return Math.max(min, max - 12);
    case "blocked":
      return Math.max(min, max - 18);
    case "not_provided":
      return min;
    default:
      return min;
  }
};

export const buildMockReport = (
  input: AuditInput,
  options?: {
    sourceStatusOverride?: Partial<SourceStatus>;
    assumptionsPrefix?: string[];
  },
): AuditReport => {
  const id = toId();
  const seed = hashString(`${input.hotelName}${input.websiteUrl ?? ""}`);

  const defaultSourceStatus: SourceStatus = {
    website: resolveSourceState(input.websiteUrl, "website"),
    gbp: resolveSourceState(input.googleBusinessUrl, "gbp"),
    booking: resolveSourceState(input.bookingUrl, "booking"),
  };

  const sourceStatus: SourceStatus = {
    website: options?.sourceStatusOverride?.website ?? defaultSourceStatus.website,
    gbp: options?.sourceStatusOverride?.gbp ?? defaultSourceStatus.gbp,
    booking: options?.sourceStatusOverride?.booking ?? defaultSourceStatus.booking,
  };

  const websiteScore = baseFromState(sourceStatus.website, 74 + (seed % 9));
  const gbpScore = baseFromState(sourceStatus.gbp, 69 + (seed % 8));
  const bookingScore = baseFromState(sourceStatus.booking, 71 + (seed % 7));
  const brandScore = Math.round((websiteScore + gbpScore + bookingScore) / 3) - 4;
  const directConversion = Math.max(32, websiteScore - 10);
  const global = Math.round(
    (websiteScore * 0.33 + gbpScore * 0.28 + bookingScore * 0.26 + directConversion * 0.13) /
      1,
  );

  const assumptions: string[] = [...(options?.assumptionsPrefix ?? [])];

  if (sourceStatus.website !== "accessible") {
    assumptions.push(
      "Analisi sito web parziale: alcune sezioni non sono state verificate in modo completo.",
    );
  }
  if (sourceStatus.gbp !== "accessible") {
    assumptions.push(
      "Google Business Profile non pienamente accessibile: insight basati su segnali disponibili.",
    );
  }
  if (sourceStatus.booking !== "accessible") {
    assumptions.push(
      "Pagina Booking non completamente verificata: trend reputazionali stimati su dati limitati.",
    );
  }
  if (assumptions.length === 0) {
    assumptions.push("Tutte le fonti fornite risultano accessibili e coerenti per un audit preliminare.");
  }

  const report: AuditReport = {
    id,
    generatedAt: new Date().toISOString(),
    input,
    sourceStatus,
    assumptions,
    executiveSummary: {
      scores: {
        global,
        website: websiteScore,
        gbp: gbpScore,
        booking: bookingScore,
        brand: brandScore,
        directConversion,
      },
      topProblems: [
        {
          title: "Messaggio di valore poco differenziante",
          detail: "Homepage focalizzata su camere ma poco orientata a benefici percepiti dal target premium.",
          impact: "Riduzione tasso di conversione diretta nelle visite da mobile.",
          severity: "Alta",
          priority: "P1",
        },
        {
          title: "Velocità mobile non competitiva",
          detail: "Core Web Vitals disallineati nei template principali.",
          impact: "Perdita di traffico organico e aumento bounce rate.",
          severity: "Alta",
          priority: "P1",
        },
        {
          title: "Gestione recensioni non sistemica",
          detail: "Tempo di risposta irregolare e tono non allineato al posizionamento.",
          impact: "Erosione fiducia su pubblico ad alto valore.",
          severity: "Media",
          priority: "P2",
        },
        {
          title: "Funnel diretto frammentato",
          detail: "CTA distribuite senza priorità visiva coerente.",
          impact: "Dispersione domanda verso OTA.",
          severity: "Alta",
          priority: "P1",
        },
        {
          title: "Contenuti locali poco profondi",
          detail: "Pagine territoriali con scarso allineamento SEO local intent.",
          impact: "Visibilità ridotta su query ad alta intenzione.",
          severity: "Media",
          priority: "P2",
        },
      ],
      topOpportunities: [
        {
          title: "Pacchetti diretti value-added",
          detail: "Bundle esclusivi non presenti in modo evidente.",
          impact: "Incremento conversione diretta e ADR medio.",
          severity: "Alta",
          priority: "P1",
        },
        {
          title: "Ottimizzazione scheda GBP",
          detail: "Categorie secondarie, servizi e post non strutturati.",
          impact: "Aumento quota traffico locale ad alta intenzione.",
          severity: "Media",
          priority: "P2",
        },
        {
          title: "Matrice di risposta recensioni",
          detail: "Playbook operativo per recensioni positive e negative.",
          impact: "Miglioramento percezione affidabilità brand.",
          severity: "Media",
          priority: "P2",
        },
        {
          title: "CRO mobile booking widget",
          detail: "Ridurre attrito in 3 passaggi chiave del funnel.",
          impact: "+8-14% conversione diretta stimata.",
          severity: "Alta",
          priority: "P1",
        },
        {
          title: "Storytelling visivo camere e servizi",
          detail: "Riorganizzare asset fotografici per journey di scelta.",
          impact: "Aumento tempo pagina e intenzione prenotazione.",
          severity: "Media",
          priority: "P3",
        },
      ],
      mainEconomicRisk:
        "Dipendenza crescente dalle OTA con erosione marginale stimata tra 8% e 14% sul potenziale prenotazioni dirette.",
      mainGrowthOpportunity:
        "Reingegnerizzare funnel diretto + pricing comunicato può incrementare quota diretta del 10-18% in 120 giorni.",
    },
    websiteAnalysis: {
      radar: [
        { metric: "SEO", score: Math.max(28, websiteScore - 7) },
        { metric: "UX", score: Math.max(30, websiteScore - 5) },
        { metric: "UI", score: Math.max(34, websiteScore - 3) },
        { metric: "Mobile", score: Math.max(26, websiteScore - 11) },
        { metric: "Performance", score: Math.max(24, websiteScore - 13) },
        { metric: "Conversione", score: Math.max(30, directConversion) },
        { metric: "Branding", score: Math.max(33, brandScore - 2) },
      ],
      criticalIssues: [
        {
          problem: "Hero e above-the-fold con proposta valore non orientata al target",
          whyItHurts:
            "Riduce chiarezza dell'offerta e aumenta il tempo necessario per decidere la prenotazione.",
          economicImpact: "Perdita stimata 6-9 prenotazioni dirette/mese.",
          severity: "Alta",
          recommendation:
            "Ridefinire headline, proof points e CTA primaria con messaggio centrato su benefici misurabili.",
          priority: "P1",
        },
        {
          problem: "Velocità caricamento mobile sotto benchmark di categoria",
          whyItHurts: "Influenza ranking SEO e abbandono delle sessioni da adv/search.",
          economicImpact: "Costo opportunità stimato 4-7k EUR/mese.",
          severity: "Critica",
          recommendation:
            "Compressione immagini next-gen, lazy loading intelligente e razionalizzazione script terzi.",
          priority: "P1",
        },
        {
          problem: "Architettura informazioni camere poco comparabile",
          whyItHurts: "Difficile confronto fra room type, aumenta indecisione utente.",
          economicImpact: "Riduzione conversione funnel camere 9-12%.",
          severity: "Media",
          recommendation: "Aggiungere matrice comparativa, filtri rapidi e pricing context.",
          priority: "P2",
        },
      ],
    },
    gbpAnalysis: {
      metrics: [
        { metric: "Local SEO", score: Math.max(30, gbpScore - 6) },
        { metric: "Reputazione", score: Math.max(34, gbpScore - 3) },
        { metric: "Completezza Profilo", score: Math.max(28, gbpScore - 8) },
      ],
      issues: [
        {
          problem: "Categorie secondarie non allineate ai servizi ad alta redditività",
          whyItHurts: "Riduce copertura su query locali transazionali.",
          bookingImpact: "Visibilità locale inferiore su ricerche competitive.",
          severity: "Alta",
          recommendation:
            "Ricalibrare categorie + servizi e creare piano post settimanale orientato a conversione.",
          priority: "P1",
        },
        {
          problem: "Risposte alle recensioni non consistenti",
          whyItHurts: "Penalizza fiducia e percezione di affidabilità operativa.",
          bookingImpact: "Minor CTR dalla scheda verso sito/telefono.",
          severity: "Media",
          recommendation:
            "Standardizzare tono, tempi e rubriche risposta su base SLA 48h.",
          priority: "P2",
        },
      ],
      localCompetitors: [
        {
          competitor: "Palazzo Riviera Boutique",
          rating: "4.6",
          reviews: 982,
          strength: "Profilo completo + contenuti foto recenti",
          threat: "Alta",
        },
        {
          competitor: "Grand Avenue Suites",
          rating: "4.5",
          reviews: 734,
          strength: "Elevata frequenza risposte recensioni",
          threat: "Media",
        },
        {
          competitor: "Urban Harbor Hotel",
          rating: "4.4",
          reviews: 640,
          strength: "Migliore presidio keyword locali",
          threat: "Media",
        },
      ],
    },
    bookingAnalysis: {
      sentiment: [
        { name: "Positivo", value: Math.max(58, bookingScore + 12) },
        { name: "Negativo", value: Math.max(12, 100 - (bookingScore + 12)) },
      ],
      physicalInterventions: [
        "Ridurre rumorosità notturna nelle camere su strada con interventi fonoassorbenti.",
        "Upgrade materassi e topper in camere standard per migliorare qualità percepita del sonno.",
        "Migliorare illuminazione bagno e specchi per percezione premium nelle recensioni foto.",
      ],
      otaOptimizations: [
        "Ristrutturare headline e punti forza in prime 150 battute della pagina OTA.",
        "Aggiornare galleria con storytelling servizi ad alto margine (spa, rooftop, breakfast).",
        "Inserire policy flessibili e vantaggi prenotazione diretta in copy comparativo.",
      ],
      factors: [
        {
          factor: "Pulizia",
          guestPerception: "Generalmente positiva ma con picchi negativi su alta stagione.",
          impact: "Influenza rating complessivo e fiducia pre-prenotazione.",
          severity: "Media",
          recommendation: "Audit housekeeping e checklist qualità su camere turnover rapido.",
          priority: "P2",
        },
        {
          factor: "Colazione",
          guestPerception: "Buona varietà, ma percezione valore/prezzo non uniforme.",
          impact: "Impatta soddisfazione e recensioni dettagliate.",
          severity: "Media",
          recommendation: "Riposizionare offerta breakfast e comunicarla meglio in OTA.",
          priority: "P3",
        },
        {
          factor: "Rapporto qualità/prezzo",
          guestPerception: "Variabile in base al periodo e alla camera.",
          impact: "Aumenta sensibilità prezzo e confronto con competitor.",
          severity: "Alta",
          recommendation: "Allineare pricing narrative con servizi distintivi e upsell.",
          priority: "P1",
        },
      ],
    },
    competitors: [
      {
        name: "Palazzo Riviera Boutique",
        channel: "Sito + GBP + Booking",
        strongerWhy: "Brand positioning più netto e funnel diretto più lineare",
        whereAhead: "SEO locale, recensioni recenti, UX mobile",
        threatLevel: "Alta",
      },
      {
        name: "Grand Avenue Suites",
        channel: "Booking + Meta",
        strongerWhy: "Allineamento prezzo/beneficio più credibile",
        whereAhead: "Valore percepito e visibilità OTA",
        threatLevel: "Media",
      },
      {
        name: "Urban Harbor Hotel",
        channel: "Google Maps + OTA",
        strongerWhy: "Presidio recensioni e contenuti local intent",
        whereAhead: "Ranking locale e fiducia immediata",
        threatLevel: "Media",
      },
    ],
    revenueInsights: {
      directBookingLoss:
        "Scenario attuale: perdita probabile 12-18% delle prenotazioni dirette potenziali per attrito nel funnel e messaging debole.",
      otaDependencyRisk:
        "Rischio crescente di dipendenza OTA se non viene aumentata quota diretta nei prossimi 2 trimestri.",
      marginDispersion:
        "Dispersione di marginalità dovuta a commissioni e mismatch tra pricing e valore percepito del brand.",
      positioningLimits:
        "Posizionamento percepito non sufficientemente distinto rispetto ai competitor di pari fascia.",
      growthOpportunity:
        "Roadmap combinata CRO + reputazione + local SEO può aumentare ADR, RevPAR e quota diretta in modo sostenibile.",
    },
    actionPlan: {
      from0to30: [
        {
          activity: "Revisione hero, CTA e key message homepage",
          objective: "Ridurre attrito decisionale iniziale",
          expectedImpact: "+4-6% click verso booking engine",
          priority: "P1",
          area: "Marketing + UX",
        },
        {
          activity: "Playbook risposta recensioni",
          objective: "Migliorare fiducia e coerenza tone of voice",
          expectedImpact: "Aumento sentiment positivo percepito",
          priority: "P1",
          area: "Reputation",
        },
      ],
      from30to60: [
        {
          activity: "Ottimizzazione velocità mobile",
          objective: "Migliorare Core Web Vitals",
          expectedImpact: "Incremento traffico organico qualificato",
          priority: "P1",
          area: "Tech + SEO",
        },
        {
          activity: "Aggiornamento pagina Booking con nuova galleria",
          objective: "Rafforzare valore percepito",
          expectedImpact: "+0.2-0.4 punti rating qualità percepita",
          priority: "P2",
          area: "OTA",
        },
      ],
      from60to120: [
        {
          activity: "Refactor pagine camere + comparatore",
          objective: "Aumentare conversione su traffico caldo",
          expectedImpact: "+8-12% conversione sezione camere",
          priority: "P1",
          area: "CRO",
        },
        {
          activity: "Piano contenuti local intent",
          objective: "Aumentare copertura keyword ad alta intenzione",
          expectedImpact: "Crescita ranking locale e lead diretti",
          priority: "P2",
          area: "SEO",
        },
      ],
      from3to6Months: [
        {
          activity: "Programma loyalty diretto + CRM automation",
          objective: "Ridurre dipendenza OTA",
          expectedImpact: "Aumento repeat booking e marginalità",
          priority: "P2",
          area: "Commerciale",
        },
        {
          activity: "Refresh visual identity digitale",
          objective: "Riposizionare hotel in fascia premium distintiva",
          expectedImpact: "Miglioramento ADR e percezione brand",
          priority: "P3",
          area: "Brand",
        },
      ],
    },
    charts: {
      websiteRadar: [
        { metric: "SEO", score: Math.max(28, websiteScore - 7) },
        { metric: "UX", score: Math.max(30, websiteScore - 5) },
        { metric: "UI", score: Math.max(34, websiteScore - 3) },
        { metric: "Mobile", score: Math.max(26, websiteScore - 11) },
        { metric: "Performance", score: Math.max(24, websiteScore - 13) },
        { metric: "Conversione", score: Math.max(30, directConversion) },
        { metric: "Branding", score: Math.max(33, brandScore - 2) },
      ],
      gbpBars: [
        { metric: "Local SEO", score: Math.max(30, gbpScore - 6) },
        { metric: "Reputazione", score: Math.max(34, gbpScore - 3) },
        { metric: "Completezza Profilo", score: Math.max(28, gbpScore - 8) },
      ],
      bookingSentiment: [
        { name: "Positivo", value: Math.max(58, bookingScore + 12) },
        { name: "Negativo", value: Math.max(12, 100 - (bookingScore + 12)) },
      ],
    },
    emailSummary: {
      subject: `Audit digitale ${input.hotelName}: opportunità di crescita e piano operativo`,
      body: `Gentile Team ${input.hotelName},\n\nabbiamo completato un audit preliminare su sito web, Google Business Profile e Booking.com.\n\nSintesi: il punteggio globale è ${global}/100, con margine rilevante su conversione diretta, presidio reputazionale e posizionamento commerciale.\n\nPriorità operative consigliate:\n1) Ottimizzazione funnel diretto e performance mobile\n2) Miglioramento governance recensioni e scheda GBP\n3) Allineamento value proposition e contenuti OTA\n\nCon un piano esecutivo in 120 giorni stimiamo un incremento progressivo di quota diretta, ADR e marginalità.\n\nResto a disposizione per condividere roadmap, KPI e tempi di implementazione.\n\nCordiali saluti,\nHotel Target`,
    },
  };

  if (sourceStatus.booking === "not_provided") {
    report.bookingAnalysis.physicalInterventions = [
      "Fonte Booking non fornita: suggerire acquisizione dati recensioni OTA per priorità interventi fisici.",
    ];
    report.bookingAnalysis.otaOptimizations = [
      "Fonte Booking non fornita: impossibile verificare asset e copy OTA in questa analisi preliminare.",
    ];
    report.bookingAnalysis.factors = [
      {
        factor: "Copertura recensioni OTA",
        guestPerception: "Non verificabile senza URL Booking.",
        impact: "Gap di visibilità su driver reputazionali.",
        severity: "Media",
        recommendation: "Fornire fonte OTA e storico recensioni per analisi completa.",
        priority: "P1",
      },
    ];
    report.charts.bookingSentiment = [
      { name: "Positivo", value: 0 },
      { name: "Negativo", value: 0 },
    ];
  }

  if (sourceStatus.gbp === "not_provided") {
    report.gbpAnalysis.issues = [
      {
        problem: "URL Google Business Profile non fornito",
        whyItHurts: "Impossibile verificare ranking locale e qualità presidio reputazionale.",
        bookingImpact: "Perdita di opportunità su ricerche geolocalizzate.",
        severity: "Media",
        recommendation: "Condividere URL GBP per audit locale completo.",
        priority: "P1",
      },
    ];
    report.gbpAnalysis.localCompetitors = [];
    report.charts.gbpBars = [
      { metric: "Local SEO", score: 0 },
      { metric: "Reputazione", score: 0 },
      { metric: "Completezza Profilo", score: 0 },
    ];
  }

  return report;
};
