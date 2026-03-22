import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ScoreCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}/100</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-zinc-400">{description}</CardContent>
    </Card>
  );
}
