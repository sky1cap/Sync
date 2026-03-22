import { ReportPageClient } from "@/components/report/report-page-client";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportPageClient reportId={id} />;
}
