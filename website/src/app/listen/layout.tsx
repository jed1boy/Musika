import type { Metadata } from "next";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { AuthProvider } from "@/components/player/AuthProvider";
import { NowPlayingBar } from "@/components/player/NowPlayingBar";

export const metadata: Metadata = {
  title: "Musika \u2014 Listen",
  description: "Stream music ad-free in your browser.",
};

export default function ListenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
          {children}
          <NowPlayingBar />
        </div>
      </PlayerProvider>
    </AuthProvider>
  );
}
