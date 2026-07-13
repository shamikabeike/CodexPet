import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

function useBlinking(): boolean {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      return undefined;
    }

    const timers = new Set<number>();
    let active = true;
    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };

    const schedule = () => {
      later(() => {
        if (!active) {
          return;
        }

        const doubleBlink = Math.random() < 0.24;
        setBlinking(true);
        later(() => setBlinking(false), 145);

        if (doubleBlink) {
          later(() => setBlinking(true), 245);
          later(() => setBlinking(false), 385);
        }

        later(schedule, doubleBlink ? 540 : 300);
      }, 3_800 + Math.random() * 5_200);
    };

    schedule();
    return () => {
      active = false;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return blinking;
}

export function CatFace() {
  const { messages } = useI18n();
  const blinking = useBlinking();

  return (
    <div
      className={`cat-face ${blinking ? "is-blinking" : ""}`}
      data-blinking={blinking}
      role="img"
      aria-label={messages.catFaceAria}
    >
      <span className="whiskers whiskers-left" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="cat-eye cat-eye-left" aria-hidden="true">
        <span className="cat-pupil">
          <i />
        </span>
      </span>
      <svg className="cat-muzzle" viewBox="0 0 42 30" aria-hidden="true">
        <path className="cat-nose" d="M21 8c-3.7 0-5.4 2.1-3 4.7L21 15l3-2.3c2.4-2.6.7-4.7-3-4.7Z" />
        <path d="M21 14v3.2c0 4-3 6.4-6.5 6.4-3.2 0-5.7-2.1-6.3-5.1" />
        <path d="M21 17.2c0 4 3 6.4 6.5 6.4 3.2 0 5.7-2.1 6.3-5.1" />
      </svg>
      <span className="cat-eye cat-eye-right" aria-hidden="true">
        <span className="cat-pupil">
          <i />
        </span>
      </span>
      <span className="whiskers whiskers-right" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
