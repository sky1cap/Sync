import type { Metadata } from "next";
import { KaraokeListenApp } from "@/components/karaoke-listen/karaoke-listen-app";

export const metadata: Metadata = {
  title: "Karaoke Listen",
  description:
    "A responsive web karaoke app that listens on entry, identifies songs, and shows synced lyrics instantly.",
};

export default function HomePage() {
  return <KaraokeListenApp />;
}
