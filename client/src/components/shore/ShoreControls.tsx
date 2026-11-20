import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Waves, Pause } from "lucide-react";
import { useMotion } from "@/lib/motion";

/**
 * The two switches the shoreline page owes its visitor: stop the motion, and
 * start (or stop) the sound.
 *
 * They sit together, pinned under the navbar, because they are the same kind
 * of thing — "this page is doing something, here is how to make it stop" —
 * and because a motion control buried at the bottom of a page built out of
 * motion is a control for nobody.
 */

const AUDIO_KEY = "mcc-ambient-audio";

/** Reduced motion ↔ full motion. */
export function MotionToggle({ className = "" }: { className?: string }) {
  const { reduced, toggle } = useMotion();

  return (
    <button
      type="button"
      onClick={toggle}
      // A switch, so it reports its state rather than just its label. Checked
      // means "motion is on", which is the thing being switched — not
      // "reduced is on", which would invert the mental model of every other
      // switch on the web.
      role="switch"
      aria-checked={!reduced}
      className={`shore-focus inline-flex items-center gap-2 rounded-full border border-deep-muted/30 bg-deep/70 px-3 py-2 text-xs font-medium text-deep-foreground backdrop-blur transition-colors hover:border-deep-accent/60 ${className}`}
      data-testid="button-motion-toggle"
    >
      {reduced ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Waves className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{reduced ? "Motion off" : "Motion on"}</span>
    </button>
  );
}

/**
 * Ambient surf.
 *
 * Never autoplays. That is not caution, it is the rule — WCAG 2.1 SC 1.4.2
 * requires a control for any sound that runs past three seconds, and every
 * browser blocks unprompted audio anyway. So the button IS the feature: it
 * starts silent, and the visitor asks for the sea.
 *
 * What it remembers is the CHOICE, not the playback. A returning visitor who
 * turned it on last time still arrives to silence, because a page that starts
 * making noise on load is hostile however explicitly you once consented — but
 * the button is primed, so one click brings it back.
 */
export function AmbientAudioToggle({ className = "" }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  const fadeRef = useRef<number | null>(null);

  const TARGET_VOLUME = 0.32;

  const clearFade = () => {
    if (fadeRef.current !== null) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  };

  /** Ramp the volume rather than cutting it — a hard start on surf is a thud. */
  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const el = audioRef.current;
    if (!el) return;
    clearFade();
    const step = (target - el.volume) / 18;
    fadeRef.current = window.setInterval(() => {
      const next = el.volume + step;
      const done = step > 0 ? next >= target : next <= target;
      el.volume = Math.min(1, Math.max(0, done ? target : next));
      if (done) {
        clearFade();
        onDone?.();
      }
    }, 28);
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;

    if (playing) {
      fadeTo(0, () => el.pause());
      setPlaying(false);
      try {
        window.localStorage.setItem(AUDIO_KEY, "off");
      } catch {
        /* ignore */
      }
      return;
    }

    el.volume = 0;
    el.play()
      .then(() => {
        setPlaying(true);
        fadeTo(TARGET_VOLUME);
        try {
          window.localStorage.setItem(AUDIO_KEY, "on");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        // Autoplay policy, a missing codec, or no audio device. Say so by
        // disabling the control rather than leaving a button that lies.
        setAvailable(false);
      });
  }, [playing, fadeTo]);

  // Pause when the tab goes to the background. Audio from a tab you cannot
  // see is the single most-complained-about behaviour on the web, and the
  // visitor asked for waves *while looking at the sea*, not while reading
  // their email.
  useEffect(() => {
    const onVisibility = () => {
      const el = audioRef.current;
      if (!el) return;
      if (document.hidden && !el.paused) {
        el.pause();
      } else if (!document.hidden && playing && el.paused) {
        el.play().catch(() => setAvailable(false));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [playing]);

  useEffect(() => () => clearFade(), []);

  if (!available) return null;

  return (
    <>
      {/* preload="none" — 460KB that most visitors never ask for should not
          be on the critical path. It downloads on the first click. */}
      <audio ref={audioRef} loop preload="none" aria-hidden="true">
        <source src="/media/waves-ambient.m4a" type="audio/mp4" />
        <source src="/media/waves-ambient.ogg" type="audio/ogg" />
      </audio>
      <button
        type="button"
        onClick={toggle}
        role="switch"
        aria-checked={playing}
        className={`shore-focus inline-flex items-center gap-2 rounded-full border border-deep-muted/30 bg-deep/70 px-3 py-2 text-xs font-medium text-deep-foreground backdrop-blur transition-colors hover:border-deep-accent/60 ${className}`}
        data-testid="button-audio-toggle"
      >
        {playing ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}
        <span>{playing ? "Sound on" : "Sound off"}</span>
      </button>
    </>
  );
}

/** Both switches, in the corner of the hero. */
export function ShoreControls() {
  return (
    <div
      className="pointer-events-auto flex flex-wrap items-center gap-2"
      // Grouped and named, so a screen-reader user meets them as a pair of
      // page settings rather than two unexplained switches.
      role="group"
      aria-label="Page settings"
    >
      <MotionToggle />
      <AmbientAudioToggle />
    </div>
  );
}
