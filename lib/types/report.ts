export type SourceState =
  | "accessible"
  | "partially_accessible"
  | "blocked"
  | "not_provided";

export type SourceKey = "website" | "gbp" | "booking";

export interface AuditInput {
  hotelName: string;
  websiteUrl?: string;
  googleBusinessUrl?: string;
  bookingUrl?: string;
  gbpRating?: number;
  gbpReviewCount?: number;
  gbpPrimaryCategory?: string;
  gbpPositiveHighlights?: string;
  gbpNegativeHighlights?: string;
  bookingRating?: number;
  bookingReviewCount?: number;
  bookingPositiveHighlights?: string;
  bookingNegativeHighlights?: string;
  recipientEmail?: string;
}

export interface SourceStatus {
  website: SourceState;
  gbp: SourceState;
  booking: SourceState;
}

export interface SummaryScores {
  global: number;
  website: number;
  gbp: number;
  booking: number;
  brand: number;
  directConversion: number;
}

export interface PriorityItem {
  title: string;
  detail: string;
  impact: string;
  severity: "Bassa" | "Media" | "Alta" | "Critica";
  priority: "P1" | "P2" | "P3";
}

export interface ExecutiveSummary {
  scores: SummaryScores;
  topProblems: PriorityItem[];
  topOpportunities: PriorityItem[];
  mainEconomicRisk: string;
  mainGrowthOpportunity: string;
}

export interface WebsiteRadarMetric {
  metric: string;
  score: number;
}

export interface IssueRow {
  problem: string;
  whyItHurts: string;
  economicImpact: string;
  severity: "Bassa" | "Media" | "Alta" | "Critica";
  recommendation: string;
  priority: "P1" | "P2" | "P3";
}

export interface WebsiteAnalysis {
  radar: WebsiteRadarMetric[];
  criticalIssues: IssueRow[];
}

export interface GbpBarMetric {
  metric: "Local SEO" | "Reputazione" | "Completezza Profilo";
  score: number;
}

export interface LocalCompetitorRow {
  competitor: string;
  rating: string;
  reviews: number;
  strength: string;
  threat: "Bassa" | "Media" | "Alta";
}

export interface GbpIssueRow {
  problem: string;
  whyItHurts: string;
  bookingImpact: string;
  severity: "Bassa" | "Media" | "Alta" | "Critica";
  recommendation: string;
  priority: "P1" | "P2" | "P3";
}

export interface GbpAnalysis {
  metrics: GbpBarMetric[];
  issues: GbpIssueRow[];
  localCompetitors: LocalCompetitorRow[];
}

export interface BookingSentiment {
  name: "Positivo" | "Negativo";
  value: number;
}

export interface BookingFactor {
  factor: string;
  guestPerception: string;
  impact: string;
  severity: "Bassa" | "Media" | "Alta" | "Critica";
  recommendation: string;
  priority: "P1" | "P2" | "P3";
}

export interface BookingAnalysis {
  sentiment: BookingSentiment[];
  physicalInterventions: string[];
  otaOptimizations: string[];
  factors: BookingFactor[];
}

export interface CompetitorRow {
  name: string;
  channel: string;
  strongerWhy: string;
  whereAhead: string;
  threatLevel: "Bassa" | "Media" | "Alta";
}

export interface RevenueInsights {
  directBookingLoss: string;
  otaDependencyRisk: string;
  marginDispersion: string;
  positioningLimits: string;
  growthOpportunity: string;
}

export interface ActionItem {
  activity: string;
  objective: string;
  expectedImpact: string;
  priority: "P1" | "P2" | "P3";
  area: string;
}

export interface ActionPlan {
  from0to30: ActionItem[];
  from30to60: ActionItem[];
  from60to120: ActionItem[];
  from3to6Months: ActionItem[];
}

export interface ChartCollections {
  websiteRadar: WebsiteRadarMetric[];
  gbpBars: GbpBarMetric[];
  bookingSentiment: BookingSentiment[];
}

export interface EmailSummary {
  subject: string;
  body: string;
}

export interface AuditReport {
  id: string;
  generatedAt: string;
  input: AuditInput;
  sourceStatus: SourceStatus;
  assumptions: string[];
  executiveSummary: ExecutiveSummary;
  websiteAnalysis: WebsiteAnalysis;
  gbpAnalysis: GbpAnalysis;
  bookingAnalysis: BookingAnalysis;
  competitors: CompetitorRow[];
  revenueInsights: RevenueInsights;
  actionPlan: ActionPlan;
  charts: ChartCollections;
  emailSummary: EmailSummary;
}

export interface GenerateAuditResponse {
  report: AuditReport;
}
