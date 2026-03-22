import { AuditReport } from "@/lib/types/report";

const KEY_PREFIX = "hotel-target-report";

export const saveReport = (report: AuditReport) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${KEY_PREFIX}:${report.id}`, JSON.stringify(report));
};

export const loadReport = (id: string): AuditReport | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${KEY_PREFIX}:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuditReport;
  } catch {
    return null;
  }
};
