"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const TOOLS = [
  { id: "draft", label: "Draft" },
  { id: "align", label: "Align" },
  { id: "export", label: "Export" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

type GhostStamp = {
  id: number;
  toolId: ToolId;
  label: string;
};

export type GhostReprintProps = {
  className?: string;
  /** Demo loop for gallery cards — cursor + ghost stamps. */
  autoPlay?: boolean;
  autoPlayDuration?: number;
};

export function GhostReprint({
  className,
  autoPlay = false,
  autoPlayDuration = 4200,
}: GhostReprintProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bedRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const reduced = useRef(false);
  const nextGhostId = useRef(0);
  const [active, setActive] = useState<ToolId>("draft");
  const [pressing, setPressing] = useState(false);
  const [ghosts, setGhosts] = useState<GhostStamp[]>([]);

  const tool = TOOLS.find((t) => t.id === active) ?? TOOLS[0];

  const setCursor = useCallback((visible: boolean, x = 0, y = 0) => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;
    root.dataset.cursor = visible ? "true" : "false";
    if (visible) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const printGhost = useCallback((toolId: ToolId, label: string) => {
    if (reduced.current) return;

    const ghostId = ++nextGhostId.current;
    setGhosts((current) => [...current.slice(-4), { id: ghostId, toolId, label }]);
    window.setTimeout(() => {
      setGhosts((current) => current.filter((ghost) => ghost.id !== ghostId));
    }, 2800);
  }, []);

  const pick = useCallback(
    (id: ToolId, withPrint = true) => {
      const label = TOOLS.find((t) => t.id === id)?.label ?? id;
      setActive(id);

      if (!withPrint) return;

      setPressing(true);
      window.setTimeout(() => setPressing(false), 220);
      requestAnimationFrame(() => printGhost(id, label));
    },
    [printGhost],
  );

  const clearGhosts = useCallback(() => {
    setGhosts([]);
    setPressing(false);
    setCursor(false);
  }, [setCursor]);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!autoPlay || reduced.current) return;

    let cancelled = false;
    const timers = new Set<number>();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          resolve();
        }, ms);
        timers.add(id);
      });

    const moveCursorToTool = async (id: ToolId) => {
      const bed = bedRef.current;
      const btn = bed?.querySelector<HTMLElement>(`[data-tool="${id}"]`);
      if (!bed || !btn) return;
      const bedBox = bed.getBoundingClientRect();
      const btnBox = btn.getBoundingClientRect();
      const x = btnBox.left - bedBox.left + btnBox.width * 0.65;
      const y = btnBox.top - bedBox.top + btnBox.height * 0.55;
      setCursor(true, x, y);
      await wait(240);
    };

    const run = async () => {
      while (!cancelled) {
        clearGhosts();
        setActive("draft");
        await wait(320);
        if (cancelled) break;

        for (const t of TOOLS) {
          if (cancelled) break;
          await moveCursorToTool(t.id);
          if (cancelled) break;
          pick(t.id, true);
          await wait(Math.max(760, autoPlayDuration / 3.1));
        }

        setCursor(false);
        await wait(900);
      }
    };

    void run();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      clearGhosts();
    };
  }, [autoPlay, autoPlayDuration, clearGhosts, pick, setCursor]);

  return (
    <div
      ref={rootRef}
      className={["gr-root", className].filter(Boolean).join(" ")}
      data-cursor="false"
      data-autoplay={autoPlay ? "true" : "false"}
    >
      <div ref={bedRef} className="gr-bed">
        <div className="gr-ghosts" aria-hidden="true">
          {ghosts.map((ghost) => (
            <div
              key={ghost.id}
              className="gr-stamp"
              data-tool={ghost.toolId}
            >
              <span className="gr-stamp-layer gr-stamp-c">{ghost.label}</span>
              <span className="gr-stamp-layer gr-stamp-m">{ghost.label}</span>
              <span className="gr-stamp-layer gr-stamp-k">{ghost.label}</span>
            </div>
          ))}
        </div>

        <div
          className="gr-plate"
          data-press={pressing ? "true" : "false"}
        >
          <span className="gr-reg gr-reg-tl" aria-hidden="true" />
          <span className="gr-reg gr-reg-tr" aria-hidden="true" />
          <span className="gr-reg gr-reg-bl" aria-hidden="true" />
          <span className="gr-reg gr-reg-br" aria-hidden="true" />

          <p className="gr-imprint" aria-live="polite">
            {tool.label}
          </p>

          <div className="gr-tools" role="toolbar" aria-label="Print tools">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="gr-tool"
                data-tool={t.id}
                data-active={t.id === active ? "true" : "false"}
                aria-pressed={t.id === active}
                onClick={() => {
                  if (!autoPlay) pick(t.id, true);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {autoPlay ? (
          <span ref={cursorRef} className="gr-cursor" aria-hidden="true">
            <svg viewBox="0 0 24 32" fill="none">
              <path
                d="M1 1v26.5l6.2-6.1 3.7 8.9 3.6-1.5-3.7-8.8H22L1 1Z"
                fill="#fff"
                stroke="#111"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : null}
      </div>
    </div>
  );
}
