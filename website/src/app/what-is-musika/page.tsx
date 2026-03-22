import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What is Musika? | Open-source Android music client",
  description:
    "Musika is an independent, open-source Android music player built around a rich streaming catalog. Learn what it is, how it relates to YouTube Music, and where to get the code.",
};

export default function WhatIsMusikaPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <Navbar />

      <div className="absolute top-0 inset-x-0 h-[480px] md:h-[640px] w-full bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-white/6 via-black to-black -z-10 pointer-events-none" />

      <div className="max-w-[720px] mx-auto px-4 sm:px-6 md:px-12 pt-28 md:pt-36 pb-20 md:pb-28 flex flex-col gap-10 md:gap-12">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="marketing-inline-link text-sm text-white/50 underline underline-offset-4 decoration-white/20 transition-[color,text-decoration-color] duration-200 ease-out-ui"
          >
            ← Back to home
          </Link>
        </nav>

        <header className="flex flex-col gap-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.05] text-balance">
            What is Musika?
          </h1>
          <p className="text-xl md:text-2xl text-white/50 font-light leading-snug">
            A short, human-written overview of the project behind{" "}
            <a
              href="https://usemusika.vercel.app/"
              className="text-white/80 underline underline-offset-4 decoration-white/25 hover:decoration-white/50"
            >
              usemusika.vercel.app
            </a>
            .
          </p>
        </header>

        <div className="flex flex-col gap-8 text-lg md:text-xl text-white/60 font-light leading-relaxed">
          <p>
            <strong className="font-medium text-white/90">Musika</strong> is an
            open-source music client for{" "}
            <strong className="font-medium text-white/90">Android</strong>. The
            public site summarizes features such as ad-free listening, offline
            support, synced lyrics, discovery tools, and playback options aimed at
            people who want their library and playback experience in one place.
          </p>

          <p>
            Musika is{" "}
            <strong className="font-medium text-white/90">not</strong> made by
            Google, YouTube, or YouTube Music. It is an{" "}
            <strong className="font-medium text-white/90">independent</strong>{" "}
            project. It can access a large streaming catalog in ways similar to
            what listeners expect from YouTube Music-style clients; any trademarks
            belong to their owners.
          </p>

          <p>
            The app is released under the{" "}
            <strong className="font-medium text-white/90">GNU General Public
            License v3.0 (GPL-3.0)</strong>. Source code, issues, and releases
            live on GitHub:{" "}
            <a
              href="https://github.com/jed1boy/Musika"
              target="_blank"
              rel="noreferrer"
              className="text-white/85 underline underline-offset-4 decoration-white/25 hover:decoration-white/50"
            >
              github.com/jed1boy/Musika
            </a>
            .
          </p>

          <p>
            Because the code is open source, you can review how it works, build it
            yourself, and install from{" "}
            <strong className="font-medium text-white/90">official release
            assets</strong> on that repository (or other channels the project
            documents). If you are deciding whether to install any app, checking
            the publisher and download source is always a good idea.
          </p>
        </div>
      </div>
    </main>
  );
}
