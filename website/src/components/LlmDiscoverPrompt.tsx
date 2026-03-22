"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";

const SITE_URL = "https://usemusika.vercel.app/";
const LLMS_TXT_URL = `${SITE_URL}llms.txt`;

/** Paste-friendly lines when a quick-open link does not work as expected. */
const REFERENCE_URLS_CLIPBOARD = `${SITE_URL}\n${LLMS_TXT_URL}`;

/** Device-neutral question for any assistant or search. */
export const LLM_DISCOVER_PROMPT = `I came across Musika (${SITE_URL}). You can also read ${LLMS_TXT_URL} for more about the project. What is Musika, how is it licensed, and is it built or endorsed by Google or YouTube?`;

/**
 * Build a destination URL: one query param whose value is the full prompt string.
 * The entire prompt (including any https:// URLs inside it) must be passed as a single
 * encodeURIComponent value—never splice a raw URL into the outer query string.
 */
function buildAssistantLink(base: string, param: string, text: string): string {
  const trimmed = base.replace(/\?$/, "");
  const joiner = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${joiner}${param}=${encodeURIComponent(text)}`;
}

const LLM_PROVIDERS = [
  {
    id: "chatgpt" as const,
    label: "ChatGPT",
    base: "https://chatgpt.com/",
    param: "q",
    logo: {
      src: "https://svgl.app/library/openai_dark.svg",
      width: 96,
      height: 28,
    },
  },
  {
    id: "claude" as const,
    label: "Claude",
    base: "https://claude.ai/new",
    param: "q",
    logo: {
      src: "https://svgl.app/library/claude-ai-icon.svg",
      width: 32,
      height: 32,
    },
  },
  {
    id: "gemini" as const,
    label: "Gemini",
    base: "https://gemini.google.com/app",
    param: "q",
    logo: {
      src: "https://svgl.app/library/gemini.svg",
      width: 88,
      height: 32,
    },
  },
  {
    id: "perplexity" as const,
    label: "Perplexity",
    base: "https://www.perplexity.ai/search",
    param: "q",
    logo: {
      src: "https://svgl.app/library/perplexity.svg",
      width: 36,
      height: 36,
    },
  },
] as const;

function assistantHref(
  provider: (typeof LLM_PROVIDERS)[number],
  prompt: string,
): string {
  return buildAssistantLink(provider.base, provider.param, prompt);
}

type CopyKind = "prompt" | "refs";

export function LlmDiscoverPrompt() {
  const [copied, setCopied] = useState<CopyKind | null>(null);

  const flash = useCallback((kind: CopyKind) => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(LLM_DISCOVER_PROMPT);
      flash("prompt");
    } catch {
      setCopied(null);
    }
  }, [flash]);

  const copyReferenceUrls = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(REFERENCE_URLS_CLIPBOARD);
      flash("refs");
    } catch {
      setCopied(null);
    }
  }, [flash]);

  return (
    <section
      className="w-full flex flex-col gap-8 md:gap-10 py-4 md:py-8 border-t border-white/10"
      aria-labelledby="llm-discover-heading"
    >
      <div className="max-w-3xl">
        <h2
          id="llm-discover-heading"
          className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white text-balance"
        >
          Ask your assistant
        </h2>
      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        <div className="rounded-2xl md:rounded-3xl border border-white/15 bg-white/4 p-4 md:p-6 backdrop-blur-sm">
          <pre className="font-mono text-sm md:text-base text-white/85 whitespace-pre-wrap wrap-break-word leading-relaxed">
            {LLM_DISCOVER_PROMPT}
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              type="button"
              onClick={copyPrompt}
              className="marketing-ghost-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/20 bg-transparent text-white text-base font-semibold tracking-tight active:scale-[0.97] transition-[transform,background-color,border-color] duration-200 ease-out-ui w-full sm:w-auto"
            >
              {copied === "prompt" ? (
                <>
                  <Check size={20} strokeWidth={2} aria-hidden />
                  Copied prompt
                </>
              ) : (
                <>
                  <Copy size={20} strokeWidth={2} aria-hidden />
                  Copy prompt
                </>
              )}
            </button>
            <button
              type="button"
              onClick={copyReferenceUrls}
              className="marketing-ghost-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/20 bg-transparent text-white text-base font-semibold tracking-tight active:scale-[0.97] transition-[transform,background-color,border-color] duration-200 ease-out-ui w-full sm:w-auto"
            >
              {copied === "refs" ? (
                <>
                  <Check size={20} strokeWidth={2} aria-hidden />
                  Copied links
                </>
              ) : (
                <>
                  <Link2 size={20} strokeWidth={2} aria-hidden />
                  Copy website links
                </>
              )}
            </button>
          </div>

          <div className="text-sm md:text-base text-white/45 text-center sm:text-left">
            <Link
              href="/what-is-musika"
              className="marketing-inline-link text-white/70 underline underline-offset-4 decoration-white/30 transition-[color,text-decoration-color] duration-200 ease-out-ui"
            >
              Read about Musika here (no assistant needed)
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="text-xs font-medium tracking-widest uppercase text-white/35">
          Open in
        </div>
        <ul
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          role="list"
        >
          {LLM_PROVIDERS.map((p) => {
            const href = assistantHref(p, LLM_DISCOVER_PROMPT);
            return (
              <li key={p.id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ask in ${p.label} (opens in a new tab)`}
                  className="marketing-llm-tile flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/3 px-4 py-5 min-h-[104px] active:scale-[0.97] transition-[transform,background-color,border-color] duration-200 ease-out-ui"
                >
                  <Image
                    src={p.logo.src}
                    alt=""
                    width={p.logo.width}
                    height={p.logo.height}
                    className="marketing-llm-tile-logo h-7 md:h-8 w-auto max-h-8 object-contain object-center opacity-90 transition-opacity duration-200 ease-out-ui"
                  />
                  <span className="marketing-llm-tile-label flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/55 transition-colors duration-200 ease-out-ui">
                    {p.label}
                    <ExternalLink
                      size={12}
                      strokeWidth={2}
                      className="opacity-60"
                      aria-hidden
                    />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="text-[11px] text-white/25">
          Brand logos:{" "}
          <a
            href="https://svgl.app/"
            target="_blank"
            rel="noreferrer"
            className="marketing-subtle-link underline underline-offset-2 decoration-white/15 transition-[color,text-decoration-color] duration-200 ease-out-ui"
          >
            SVGL
          </a>
        </div>
      </div>
    </section>
  );
}
