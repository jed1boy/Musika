'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveElementInfo, type ElementInfo } from 'element-source';

interface PanelState {
  info: ElementInfo;
  message: string;
  copied: boolean;
}

interface HighlightState {
  top: number;
  left: number;
  width: number;
  height: number;
  tagName: string;
}

// Walk up the DOM tree skipping inspector UI elements
function isInspectorEl(el: Element): boolean {
  return el.closest('[data-dev-inspector]') !== null;
}

export default function DevInspector() {
  const [active, setActive] = useState(false);
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hoveredElRef = useRef<Element | null>(null);

  const highlightEl = useCallback((el: Element) => {
    if (isInspectorEl(el)) return;
    hoveredElRef.current = el;
    const rect = el.getBoundingClientRect();
    setHighlight({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      tagName: el.tagName.toLowerCase(),
    });
  }, []);

  const exitActive = useCallback(() => {
    setActive(false);
    setHighlight(null);
    hoveredElRef.current = null;
    document.body.style.cursor = '';
  }, []);

  const toggleActive = useCallback(() => {
    setActive((prev) => {
      if (prev) {
        setHighlight(null);
        hoveredElRef.current = null;
        document.body.style.cursor = '';
        return false;
      }
      document.body.style.cursor = 'crosshair';
      return true;
    });
    setPanel(null);
  }, []);

  // Use mouseover instead of mousemove: fires on every element the cursor enters,
  // e.target is the exact deepest element — not a parent computed from coordinates.
  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      const el = e.target as Element;
      if (!el || el === hoveredElRef.current) return;
      highlightEl(el);
    },
    [highlightEl]
  );

  // Scroll wheel while hovering: walk up (scroll up) or re-highlight current (scroll down)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const current = hoveredElRef.current;
      if (!current) return;
      if (e.deltaY < 0) {
        // scroll up → go to parent
        const parent = current.parentElement;
        if (parent && parent !== document.body && parent !== document.documentElement) {
          highlightEl(parent);
        }
      } else {
        // scroll down → go back to first child element if any
        const child = current.firstElementChild;
        if (child) highlightEl(child);
      }
    },
    [highlightEl]
  );

  const handleClick = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = hoveredElRef.current ?? (e.target as Element);
      if (isInspectorEl(target)) return;
      try {
        const info = await resolveElementInfo(target);
        setPanel({ info, message: '', copied: false });
      } catch {
        // element-source couldn't resolve — silently ignore
      }
      exitActive();
    },
    [exitActive]
  );

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitActive();
        setPanel(null);
      }
      // Arrow up/down to walk the DOM tree
      if (!hoveredElRef.current) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const parent = hoveredElRef.current.parentElement;
        if (parent && parent !== document.body && parent !== document.documentElement) {
          highlightEl(parent);
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const child = hoveredElRef.current.firstElementChild;
        if (child) highlightEl(child);
      }
    },
    [exitActive, highlightEl]
  );

  useEffect(() => {
    if (!active) return;
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [active, handleMouseOver, handleClick, handleGlobalKeyDown, handleWheel]);

  // Escape closes panel when not in inspect mode
  useEffect(() => {
    if (active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  useEffect(() => {
    if (panel) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [panel]);

  const handleCopy = useCallback(async () => {
    if (!panel) return;
    const { info, message } = panel;
    const src = info.source;
    const lines: string[] = [];
    lines.push(`Component: ${src?.componentName ?? info.componentName ?? info.tagName}`);
    if (src?.filePath) {
      const loc = [src.filePath, src.lineNumber, src.columnNumber].filter(Boolean).join(':');
      lines.push(`File: ${loc}`);
    }
    if (info.stack?.length) {
      const stackEntries = info.stack
        .slice(0, 3)
        .map((s) => {
          const loc = [s.filePath, s.lineNumber].filter(Boolean).join(':');
          return `  ${s.componentName}${loc ? ` (${loc})` : ''}`;
        })
        .join('\n');
      lines.push(`Stack:\n${stackEntries}`);
    }
    if (message.trim()) {
      lines.push('');
      lines.push(`Message: ${message.trim()}`);
    }
    await navigator.clipboard.writeText(lines.join('\n'));
    setPanel((prev) => (prev ? { ...prev, copied: true } : null));
    setTimeout(() => setPanel((prev) => (prev ? { ...prev, copied: false } : null)), 2000);
  }, [panel]);

  const handlePanelClose = useCallback(() => setPanel(null), []);

  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') handlePanelClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void handleCopy();
    },
    [handlePanelClose, handleCopy]
  );

  if (process.env.NODE_ENV !== 'development') return null;

  const src = panel?.info.source;
  const componentName = src?.componentName ?? panel?.info.componentName ?? panel?.info.tagName;
  const filePath = src?.filePath ?? '';
  const lineCol = [src?.lineNumber, src?.columnNumber].filter(Boolean).join(':');
  const fileLabel = lineCol ? `${filePath}:${lineCol}` : filePath;

  return (
    <>
      {/* Highlight overlay */}
      {active && highlight && (
        <div
          aria-hidden="true"
          data-dev-inspector
          style={{
            position: 'fixed',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            pointerEvents: 'none',
            zIndex: 9998,
            outline: '2px solid #3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderRadius: 2,
          }}
        >
          {/* Tag label */}
          <span
            style={{
              position: 'absolute',
              top: highlight.top < 22 ? '100%' : '-20px',
              left: 0,
              background: '#3b82f6',
              color: '#fff',
              fontSize: 10,
              fontFamily: 'monospace',
              padding: '1px 5px',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              lineHeight: '16px',
              pointerEvents: 'none',
            }}
          >
            {'<'}{highlight.tagName}{'>'}
          </span>
        </div>
      )}

      {/* Inspect toggle button */}
      <button
        type="button"
        data-dev-inspector
        onClick={toggleActive}
        aria-label={active ? 'Exit inspect mode' : 'Inspect elements'}
        aria-pressed={active}
        style={{ zIndex: 9999 }}
        className={`fixed bottom-4 left-4 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-lg transition-all select-none ${
          active
            ? 'border-blue-500 bg-blue-600 text-white'
            : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
          <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="6" y1="0.5" x2="6" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="9" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0.5" y1="6" x2="3" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {active ? 'Inspecting…' : 'Inspect'}
      </button>

      {/* Panel */}
      {panel && (
        <div
          role="dialog"
          aria-label="Dev Inspector"
          data-dev-inspector
          style={{ zIndex: 9999 }}
          className="fixed bottom-4 right-4 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
          onKeyDown={handlePanelKeyDown}
        >
          <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Dev Inspector
            </span>
            <button
              type="button"
              onClick={handlePanelClose}
              aria-label="Close inspector"
              className="rounded p-0.5 text-zinc-500 transition-colors hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 px-4 py-3">
            <div>
              <p className="text-xs text-zinc-500">Component</p>
              <p className="font-semibold text-white">{componentName}</p>
            </div>
            {fileLabel && (
              <div>
                <p className="text-xs text-zinc-500">Source</p>
                <p className="break-all font-mono text-xs text-zinc-300">{fileLabel}</p>
              </div>
            )}
            {panel.info.stack && panel.info.stack.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500">Stack</p>
                <div className="mt-0.5 space-y-0.5">
                  {panel.info.stack.slice(0, 3).map((s, i) => {
                    const loc = [s.filePath, s.lineNumber].filter(Boolean).join(':');
                    const name = s.componentName ?? 'unknown';
                    return (
                      <p key={`${name}-${s.filePath ?? ''}-${s.lineNumber ?? i}`} className="font-mono text-xs text-zinc-400">
                        {name}
                        {loc && <span className="text-zinc-600"> ({loc})</span>}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 px-4 py-3">
            <label htmlFor="dev-inspector-message" className="mb-1.5 block text-xs text-zinc-500">
              Message to agent <span className="text-zinc-600">(⌘+Enter to copy)</span>
            </label>
            <textarea
              id="dev-inspector-message"
              ref={textareaRef}
              rows={3}
              value={panel.message}
              onChange={(e) => setPanel((prev) => (prev ? { ...prev, message: e.target.value } : null))}
              placeholder="Describe what needs to change…"
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-4 py-3">
            <button
              type="button"
              onClick={handlePanelClose}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 active:bg-zinc-300"
            >
              {panel.copied ? 'Copied!' : 'Copy context'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
