import type { Metadata } from "next";
import { KaraokeListenAppV2 } from "@/components/karaoke-listen/karaoke-listen-app-v2";

export const metadata: Metadata = {
  title: "Karaoke Listen V2",
  description: "Alternative karaoke layout variant wired to the same recognition and lyric-sync backend.",
};

export default function KaraokeV2Page() {
  return <KaraokeListenAppV2 />;
}

