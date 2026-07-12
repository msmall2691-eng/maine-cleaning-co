import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Sparkles, AlertCircle } from "lucide-react";

export type ParsedEstimate = {
  sqft?: number;
  bathrooms?: number;
  frequency?: "weekly" | "biweekly" | "monthly" | "one-time";
  petHair?: "none" | "some" | "heavy";
  condition?: "maintenance" | "moderate" | "heavy";
  category?: "residential" | "deep-clean" | "str" | "commercial";
  transcript: string;
};

const WORD_NUMS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10,
};

/**
 * Client-only Web Speech API wrapper. No LLM, no server round-trip — we
 * regex the transcript for the six fields the calculator cares about and
 * hand the raw transcript back for the notes field.
 *
 * iOS Safari is aggressive about NOT emitting `isFinal: true` until you
 * call `stop()`, and it commonly transcribes "square feet" as just "feet"
 * or "ft squared." The regexes below tolerate all of that.
 */
function parseTranscript(raw: string): ParsedEstimate {
  const t = raw.toLowerCase();
  const out: ParsedEstimate = { transcript: raw.trim() };

  // ── Square footage ─────────────────────────────────
  // 1. Explicit "sq ft" / "square feet" / "sqft"
  let sqftMatch = t.match(
    /(\d[\d,]*)\s*(?:sq(?:uare)?\.?\s*(?:ft|feet|foot)|sqft)/
  );
  // 2. "N ft squared" / "N feet squared" (how iOS often renders "ft²")
  if (!sqftMatch) {
    sqftMatch = t.match(/(\d[\d,]*)\s*(?:ft|feet|foot)\.?\s*squared/);
  }
  // 3. Fallback: plain "N ft" / "N feet" when N is in the sqft range
  if (!sqftMatch) {
    const m = t.match(/(\d[\d,]*)\s*(?:ft|feet|foot)\b/);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (n >= 300 && n <= 12000) sqftMatch = m;
    }
  }
  if (sqftMatch) {
    const n = parseInt(sqftMatch[1].replace(/,/g, ""), 10);
    if (n >= 400 && n <= 12000) out.sqft = n;
  }

  // ── Bathrooms ──────────────────────────────────────
  // Half-word first: "three and a half bath[room]s"
  const bathHalfWord = t.match(
    /(one|two|three|four|five|six)\s*(?:and\s*a\s*half|½|and\s*half)\s*bath/
  );
  // Decimal / plain digit: "2.5 bath" or "3 bathrooms"
  const bathDecimal = t.match(/(\d(?:\.\d)?)\s*(?:bath|bathroom)/);
  // Word number for whole baths: "three bathrooms"
  const bathWord = t.match(/(one|two|three|four|five|six)\s*bath/);
  if (bathHalfWord) out.bathrooms = (WORD_NUMS[bathHalfWord[1]] ?? 0) + 0.5;
  else if (bathDecimal) {
    const n = parseFloat(bathDecimal[1]);
    if (n >= 1 && n <= 6) out.bathrooms = n;
  } else if (bathWord) {
    const n = WORD_NUMS[bathWord[1]] ?? 0;
    if (n >= 1 && n <= 6) out.bathrooms = n;
  }

  // ── Frequency ─────────────────────────────────────
  if (/(bi[-\s]?weekly|every\s*other\s*week|twice\s*a\s*month|every\s*two\s*weeks)/.test(t))
    out.frequency = "biweekly";
  else if (/(one[-\s]?time|just\s*once|single\s*clean|only\s*once)/.test(t))
    out.frequency = "one-time";
  else if (/(monthly|once\s*a\s*month|every\s*month)/.test(t)) out.frequency = "monthly";
  else if (/weekly|every\s*week/.test(t)) out.frequency = "weekly";

  // ── Pet hair ──────────────────────────────────────
  if (/no\s*(pet|dog|cat)/.test(t)) out.petHair = "none";
  else if (/(heavy|lots?\s*of|many)\s*(pet|dog|cat|hair)/.test(t)) out.petHair = "heavy";
  else if (/(pet|dog|cat|puppy|kitten)/.test(t)) out.petHair = "some";

  // ── Home condition ─────────────────────────────────
  if (/(very\s*dirty|filthy|heavy\s*dirt|really\s*dirty|hasn'?t\s*been\s*cleaned)/.test(t))
    out.condition = "heavy";
  else if (/(kind\s*of\s*dirty|bit\s*dirty|somewhat\s*dirty|moderate)/.test(t))
    out.condition = "moderate";
  else if (/(well\s*maintained|pretty\s*clean|tidy|light\s*touch)/.test(t))
    out.condition = "maintenance";

  // ── Service category ───────────────────────────────
  if (/(deep\s*clean|move[-\s]?in|move[-\s]?out|top\s*to\s*bottom)/.test(t))
    out.category = "deep-clean";
  else if (/(airbnb|vrbo|vacation\s*rental|str|short[-\s]?term|turnover|guest)/.test(t))
    out.category = "str";
  else if (/(commercial|office|business|janitorial|workplace)/.test(t))
    out.category = "commercial";
  else if (/(home|house|apartment|condo|residential)/.test(t))
    out.category = "residential";

  return out;
}

type Props = {
  onParse: (result: ParsedEstimate) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

export function VoiceInput({ onParse }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: SR;
      webkitSpeechRecognition?: SR;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: SR;
      webkitSpeechRecognition?: SR;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec: SR = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    // Locally-scoped accumulators — do NOT rely on React state inside
    // onend, because iOS often never fires isFinal until stop() is called
    // and the closure's `transcript` from useState will be stale.
    let finalText = "";
    let latestInterim = "";
    let gotAnyResult = false;

    rec.onresult = (e: {
      results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
    }) => {
      gotAnyResult = true;
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      latestInterim = interim;
      setTranscript((finalText + " " + interim).trim());
    };

    rec.onerror = (ev: { error?: string }) => {
      setListening(false);
      const err = ev?.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setError("Microphone permission denied — enable it in Settings.");
      } else if (err === "no-speech") {
        setError("I didn't catch that — try again a bit closer to the mic.");
      } else if (err === "audio-capture") {
        setError("No microphone detected on this device.");
      } else if (err) {
        setError(`Voice error (${err}) — please try again.`);
      }
      window.setTimeout(() => setError(null), 5000);
    };

    rec.onend = () => {
      setListening(false);
      const text = (finalText + " " + latestInterim).replace(/\s+/g, " ").trim();
      if (!text) {
        if (gotAnyResult) {
          setError("Nothing heard — try again a little closer to the mic.");
        } else {
          setError("Couldn't hear you — check the mic and try again.");
        }
        window.setTimeout(() => setError(null), 5000);
        return;
      }
      const parsed = parseTranscript(text);
      onParse(parsed);
      const filled: string[] = [];
      if (parsed.category) filled.push("service");
      if (parsed.sqft) filled.push(`${parsed.sqft.toLocaleString()} sq ft`);
      if (parsed.bathrooms) {
        const b = parsed.bathrooms;
        const label = b % 1 === 0.5 ? `${Math.floor(b)}½ bath` : `${b} bath`;
        filled.push(label);
      }
      if (parsed.frequency) filled.push(parsed.frequency);
      if (parsed.petHair) filled.push(`pets: ${parsed.petHair}`);
      if (parsed.condition) filled.push(`condition: ${parsed.condition}`);
      setConfirmation(
        filled.length
          ? `Filled: ${filled.join(" · ")}`
          : `Heard "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}" — added to notes`
      );
      window.setTimeout(() => setConfirmation(null), 7000);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setTranscript("");
      setError(null);
    } catch {
      setListening(false);
      setError("Couldn't start voice input. Try again.");
      window.setTimeout(() => setError(null), 5000);
    }
  }, [onParse]);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="voice-input">
      <button
        type="button"
        onClick={() => (listening ? stop() : start())}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border transition-all px-3.5 py-2.5 ${
          listening
            ? "bg-primary/12 border-primary/40 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
            : "bg-muted/40 border-border/60 hover:bg-muted/60 hover:border-border"
        }`}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        data-testid="button-voice-toggle"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              listening ? "bg-primary/25 text-primary" : "bg-primary/12 text-primary"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </span>
          <span className="flex flex-col text-left min-w-0">
            <span className="text-[13px] font-semibold text-foreground leading-tight truncate">
              {listening ? "Listening…" : "Describe it in your own words"}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {listening
                ? transcript || "Speak now"
                : "Tap the mic · we'll fill the form for you"}
            </span>
          </span>
        </span>
        {listening && (
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="block w-[3px] rounded-full bg-primary"
                animate={{ height: ["6px", "14px", "6px"] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        )}
      </button>

      <AnimatePresence>
        {confirmation && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2 text-[11px] text-emerald-500/90 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-2.5 py-1.5"
          >
            <Sparkles className="w-3 h-3 mt-[1px] flex-shrink-0" />
            <span>{confirmation}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2 text-[11px] text-amber-500/95 bg-amber-500/8 border border-amber-500/25 rounded-lg px-2.5 py-1.5"
          >
            <AlertCircle className="w-3 h-3 mt-[1px] flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
