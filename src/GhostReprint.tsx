"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const TOOLS = [
  { id: "draft", label: "Draft", fill: "34%", copy: "Compose a first impression." },
  { id: "align", label: "Align", fill: "62%", copy: "Lock type to the plate." },
  { id: "export", label: "Export", fill: "90%", copy: "Press — leave the ghost." },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

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
  const liveRef = useRef<HTMLDivElement>(null);
  const ghostsRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const reduced = useRef(false);
  const [active, setActive] = useState<ToolId>("draft");

  const tool = TOOLS.find((t) => t.id === active) ?? TOOLS[0];

  const setCursor = useCallback((visible: boolean, x = 0, y = 0) => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;
    root.dataset.cursor = visible ? "true" : "false";
    if (visible) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const printGhost = useCallback(() => {
    const live = liveRef.current;
    const ghosts = ghostsRef.current;
    if (!live || !ghosts || reduced.current) return;

    const stamp = live.cloneNode(true) as HTMLElement;
    stamp.setAttribute("aria-hidden", "true");
    stamp.querySelectorAll("button").forEach((btn) => {
      btn.setAttribute("tabindex", "-1");
      btn.setAttribute("disabled", "true");
    });
    ghosts.appendChild(stamp);
    window.setTimeout(() => stamp.remove(), 2500);
  }, []);

  const pick = useCallback(
    (id: ToolId, withPrint = true) => {
      setActive(id);
      if (withPrint) {
        requestAnimationFrame(() => printGhost());
      }
    },
    [printGhost],
  );

  const clearGhosts = useCallback(() => {
    const ghosts = ghostsRef.current;
    if (ghosts) ghosts.replaceChildren();
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
      const btn = liveRef.current?.querySelector<HTMLElement>(
        `[data-tool="${id}"]`,
      );
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
          await wait(Math.max(700, autoPlayDuration / 3.1));
        }

        setCursor(false);
        await wait(1000);
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
        <div ref={ghostsRef} className="gr-ghosts" aria-hidden="true" />
        <div ref={liveRef} className="gr-live">
          <div
            className="gr-plate"
            style={{ "--gr-fill": tool.fill } as CSSProperties}
          >
            <div className="gr-top">
              <p className="gr-mark">Ghost reprint</p>
              <div className="gr-lamps" aria-hidden="true">
                {TOOLS.map((t) => (
                  <span
                    key={t.id}
                    className="gr-lamp"
                    data-on={t.id === active ? "true" : "false"}
                  />
                ))}
              </div>
            </div>
            <h3 className="gr-title">Press, then leave.</h3>
            <p className="gr-copy">{tool.copy}</p>
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
            <div className="gr-meter" aria-hidden="true">
              <span />
            </div>
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
