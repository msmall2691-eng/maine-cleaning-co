import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Sparkles } from "lucide-react";

export type ParsedEstimate = {
  sqft?: number;
  bathrooms?: number;
  frequency?: "weekly" | "biweekly" | "monthly" | "one-time";
  petHair?: "none" | "some" | "heavy";
  condition?: "maintenance" | "moderate" | "heavy";
  category?: "residential" | "deep-clean" | "str" | "commercial";
  transcript: string;
};

/**
 * Client-only Web Speech API wrapper. No LLM, no server round-trip — we
 * regex the transcript for the six fields the calculator cares about and
 * hand the raw transcript back for the notes field. Failing to parse a
 * field just leaves it alone.
 */
function parseTranscript(raw: string): ParsedEstimate {
  const t = raw.toLowerCase();
  const out: ParsedEstimate = { transcript: raw.trim() };

  // Square footage — accepts "2500 square feet", "2,500 sqft", "1500 sq ft"
  const sqftMatch = t.match(/(\d[\d,]*)\s*(?:sq(?:uare)?\.?\s*(?:ft|feet)|sqft)/);
  if (sqftMatch) {
    const n = parseInt(sqftMatch[1].replace(/,/g, ""), 10);
    if (n >= 400 && n <= 12000) out.sqft = n;
  }

  // Bathrooms — supports "2.5 bathrooms", "two and a half baths", plain "3 baths"
  const bathHalfWord = t.match(
    /(one|two|three|four|five|six)\s*(?:and\s*a\s*half|½)\s*bath/
  );
  const bathDecimal = t.match(/(\d(?:\.\d)?)\s*(?:bath|bathroom)/);
  const wordNums: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  };
  if (bathHalfWord) out.bathrooms = (wordNums[bathHalfWord[1]] ?? 0) + 0.5;
  else if (bathDecimal) {
    const n = parseFloat(bathDecimal[1]);
    if (n >= 1 && n <= 6) out.bathrooms = n;
  }

  // Frequency — order matters (biweekly / monthly before weekly)
  if (
    /(bi[-\s]?weekly|every\s*other\s*week|twice\s*a\s*month|every\s*two\s*weeks)/.test(t)
  )
    out.frequency = "biweekly";
  else if (/(one[-\s]?time|just\s*once|single\s*clean|only\s*once)/.test(t))
    out.frequency = "one-time";
  else if (/(monthly|once\s*a\s*month|every\s*month)/.test(t)) out.frequency = "monthly";
  else if (/weekly|every\s*week/.test(t)) out.frequency = "weekly";

  // Pet hair — "no pets" wins over "pet"
  if (/no\s*(pet|dog|cat)/.test(t)) out.petHair = "none";
  else if (/(heavy|lots?\s*of|many)\s*(pet|dog|cat|hair)/.test(t)) out.petHair = "heavy";
  else if (/(pet|dog|cat|puppy|kitten)/.test(t)) out.petHair = "some";

  // Home condition
  if (/(very\s*dirty|filthy|heavy\s*dirt|really\s*dirty|hasn'?t\s*been\s*cleaned)/.test(t))
    out.condition = "heavy";
  else if (
    /(kind\s*of\s*dirty|bit\s*dirty|somewhat\s*dirty|moderate)/.test(t)
  )
    out.condition = "moderate";
  else if (/(well\s*maintained|pretty\s*clean|tidy|light\s*touch)/.test(t))
    out.condition = "maintenance";

  // Service category
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

    let finalText = "";

    rec.onresult = (e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(finalText + interim);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      const text = (finalText || transcript).trim();
      if (text) {
        const parsed = parseTranscript(text);
        onParse(parsed);
        const filled: string[] = [];
        if (parsed.category) filled.push("service");
        if (parsed.sqft) filled.push(`${parsed.sqft.toLocaleString()} sq ft`);
        if (parsed.bathrooms) filled.push(`${parsed.bathrooms} bath`);
        if (parsed.frequency) filled.push(parsed.frequency);
        if (parsed.petHair) filled.push(`pets: ${parsed.petHair}`);
        if (parsed.condition) filled.push(`condition: ${parsed.condition}`);
        setConfirmation(
          filled.length
            ? `Filled: ${filled.join(" · ")}`
            : "Heard you — added to notes."
        );
        window.setTimeout(() => setConfirmation(null), 6000);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setTranscript("");
    } catch {
      setListening(false);
    }
  }, [onParse, transcript]);

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
      </AnimatePresence>
    </div>
  );
}
