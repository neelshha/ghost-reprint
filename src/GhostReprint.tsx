"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACTIONS = [
  { id: "keep", label: "Keep", tone: "constructive" as const },
  { id: "delete", label: "Delete", tone: "destructive" as const },
] as const;

type ActionId = (typeof ACTIONS)[number]["id"];
type Tone = (typeof ACTIONS)[number]["tone"];

export type GhostReprintProps = {
  className?: string;
  /** Demo loop for gallery cards — cursor + toned ripples. */
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const ghostsRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const reduced = useRef(false);
  const [flash, setFlash] = useState<Tone | null>(null);

  const setCursor = useCallback((visible: boolean, x = 0, y = 0) => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;
    root.dataset.cursor = visible ? "true" : "false";
    if (visible) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const printGhost = useCallback((tone: Tone) => {
    const dialog = dialogRef.current;
    const ghosts = ghostsRef.current;
    if (!dialog || !ghosts || reduced.current) return;

    const stamp = dialog.cloneNode(true) as HTMLElement;
    stamp.setAttribute("aria-hidden", "true");
    stamp.removeAttribute("role");
    stamp.removeAttribute("aria-labelledby");
    stamp.removeAttribute("aria-describedby");
    stamp.dataset.tone = tone;
    stamp.classList.add("gr-ghost");
    stamp.querySelectorAll("button").forEach((btn) => {
      btn.setAttribute("tabindex", "-1");
      btn.setAttribute("disabled", "true");
    });
    ghosts.appendChild(stamp);
    window.setTimeout(() => stamp.remove(), 1400);
  }, []);

  const pick = useCallback(
    (id: ActionId, withPrint = true) => {
      const action = ACTIONS.find((a) => a.id === id);
      if (!action) return;

      if (!withPrint) return;

      setFlash(action.tone);
      window.setTimeout(() => setFlash(null), 420);
      requestAnimationFrame(() => printGhost(action.tone));
    },
    [printGhost],
  );

  const clearGhosts = useCallback(() => {
    const ghosts = ghostsRef.current;
    if (ghosts) ghosts.replaceChildren();
    setFlash(null);
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

    const moveCursorToAction = async (id: ActionId) => {
      const bed = bedRef.current;
      const btn = dialogRef.current?.querySelector<HTMLElement>(
        `[data-action="${id}"]`,
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
        await wait(380);
        if (cancelled) break;

        for (const action of ACTIONS) {
          if (cancelled) break;
          await moveCursorToAction(action.id);
          if (cancelled) break;
          pick(action.id, true);
          await wait(Math.max(900, autoPlayDuration / 2.1));
        }

        setCursor(false);
        await wait(1100);
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
      data-flash={flash ?? undefined}
    >
      <div ref={bedRef} className="gr-bed">
        <div ref={ghostsRef} className="gr-ghosts" aria-hidden="true" />
        <div
          ref={dialogRef}
          className="gr-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="gr-title"
          aria-describedby="gr-copy"
        >
          <h3 id="gr-title" className="gr-title">
            Discard draft?
          </h3>
          <p id="gr-copy" className="gr-copy">
            Keep a copy, or delete it for good.
          </p>
          <div className="gr-actions">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="gr-action"
                data-action={action.id}
                data-tone={action.tone}
                onClick={() => {
                  if (!autoPlay) pick(action.id, true);
                }}
              >
                {action.label}
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
