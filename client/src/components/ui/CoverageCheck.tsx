import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MapPin, Search, Sparkles, X, AlertCircle, ArrowRight, Phone } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { COVERAGE_INDEX as COMMUNITIES } from "@/lib/coverage-index";

// Rough geographic center of our Southern Maine service area — used only
// for distance display, not "am I served" gating. Placed near the Saco /
// Buxton corridor so the number reads as "distance across Southern Maine"
// rather than "distance to one specific town."
const AREA_CENTER = { lat: 43.60, lng: -70.55, name: "Southern Maine" };
const MAX_MILES = 95; // Comfortable reach across York + Cumberland County.



function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3959;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Business-hour-aware "next available slot" — deterministic per town so it
// doesn't flicker between renders. Prefers Tue/Wed/Thu, skips Sunday.
function nextSlot(seed: string) {
  const hash = seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const base = new Date();
  base.setHours(8, 0, 0, 0);
  const offset = 2 + Math.abs(hash % 5); // 2–6 days out
  base.setDate(base.getDate() + offset);
  // Skip Sunday
  if (base.getDay() === 0) base.setDate(base.getDate() + 1);
  return base;
}

function formatSlot(d: Date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
}

type MatchResult = {
  town: string;
  miles: number;
  served: boolean;
  slot: Date;
};

function findMatch(raw: string): MatchResult | null {
  const q = raw.trim().toLowerCase();
  if (!q) return null;
  // ZIP-first (5 digits)
  if (/^\d{5}$/.test(q)) {
    const byZip = COMMUNITIES.find((c) => c.zip === q);
    if (byZip) {
      const miles = milesBetween(AREA_CENTER, byZip);
      return { town: byZip.name, miles, served: miles <= MAX_MILES, slot: nextSlot(byZip.name) };
    }
    return null;
  }
  // Name — exact then contains
  const exact = COMMUNITIES.find((c) => c.name.toLowerCase() === q);
  const contains = COMMUNITIES.find((c) => c.name.toLowerCase().includes(q));
  const found = exact ?? contains;
  if (!found) return null;
  const miles = milesBetween(AREA_CENTER, found);
  return { town: found.name, miles, served: miles <= MAX_MILES, slot: nextSlot(found.name) };
}

const SUGGEST_LIMIT = 5;

export function CoverageCheck() {
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestBoxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    if (/^\d{5}$/.test(q)) return [];
    return COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, SUGGEST_LIMIT);
  }, [query]);

  const runCheck = (raw: string) => {
    setChecking(true);
    setNotFound(false);
    // Small artificial delay so the "checking…" state reads
    window.setTimeout(() => {
      const match = findMatch(raw);
      if (match) {
        setResult(match);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
      setChecking(false);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    runCheck(query);
    inputRef.current?.blur();
    setFocused(false);
  };

  const pickSuggestion = (name: string) => {
    setQuery(name);
    runCheck(name);
    setFocused(false);
    inputRef.current?.blur();
  };

  const clearAll = () => {
    setQuery("");
    setResult(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  const scrollToEstimate = () => {
    const el = document.getElementById("get-estimate");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.location.href = "/#get-estimate";
  };

  // Close suggestion dropdown on outside click
  useEffect(() => {
    if (!focused) return;
    const onClick = (e: MouseEvent) => {
      if (
        suggestBoxRef.current &&
        !suggestBoxRef.current.contains(e.target as Node) &&
        e.target !== inputRef.current
      ) {
        setFocused(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [focused]);

  return (
    <div className="max-w-3xl mx-auto" data-testid="coverage-check">
      <div className="relative rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-[0_4px_28px_rgba(0,0,0,0.14)] p-4 sm:p-5">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] sm:text-sm font-bold text-foreground leading-tight">
                Do we serve your neighborhood?
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Type your town or ZIP · instant answer
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative w-full sm:w-auto sm:min-w-[280px]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-muted-foreground/70 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setResult(null);
                  setNotFound(false);
                }}
                onFocus={() => setFocused(true)}
                placeholder="e.g. Portland or 04101"
                className="w-full h-10 pl-9 pr-9 rounded-full bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                data-testid="input-coverage-query"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="absolute right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-secondary/70 transition-colors"
                  aria-label="Clear"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Autocomplete suggestions */}
            <AnimatePresence>
              {focused && suggestions.length > 0 && (
                <motion.div
                  ref={suggestBoxRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 top-full left-0 right-0 mt-1.5 rounded-xl border border-border bg-popover shadow-[0_8px_24px_rgba(0,0,0,0.16)] overflow-hidden"
                  data-testid="coverage-suggestions"
                >
                  {suggestions.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onMouseDown={(e) => {
                        // onMouseDown so the click fires before onBlur closes the dropdown
                        e.preventDefault();
                        pickSuggestion(c.name);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left text-[13px] hover:bg-secondary/60 transition-colors"
                    >
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {c.zip}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Checking / result panel */}
        <AnimatePresence mode="wait">
          {checking && (
            <motion.div
              key="checking"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Checking coverage…
            </motion.div>
          )}

          {!checking && result && (
            <motion.div
              key={`result-${result.town}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`mt-3 rounded-xl p-3 sm:p-3.5 border ${
                result.served
                  ? "bg-emerald-500/8 border-emerald-500/25"
                  : "bg-amber-500/8 border-amber-500/25"
              }`}
              data-testid={`coverage-result-${result.served ? "served" : "unserved"}`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result.served ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-500 dark:text-amber-400"
                  }`}
                >
                  {result.served ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] sm:text-sm font-bold text-foreground leading-tight">
                    {result.served ? `Yes — we serve ${result.town}` : `${result.town} is just outside our zone`}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground/70" />
                      In our Southern Maine area · ~{result.miles.toFixed(0)} mi from our route hub
                    </span>
                    {result.served && (
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400/70" />
                        Next opening: {formatSlot(result.slot)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {result.served ? (
                      <button
                        type="button"
                        onClick={scrollToEstimate}
                        className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors"
                        data-testid="button-coverage-estimate"
                      >
                        Get instant estimate <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <a
                          href={companyInfo.contact.phoneHref}
                          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call for a custom quote
                        </a>
                        <button
                          type="button"
                          onClick={scrollToEstimate}
                          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-border text-foreground text-[12px] font-semibold hover:bg-secondary/60 transition-colors"
                        >
                          Request anyway
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!checking && notFound && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 rounded-xl p-3 border border-border bg-secondary/40"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">
                    We couldn't match that spelling
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Try a nearby town or your 5-digit ZIP · or{" "}
                    <a
                      href={companyInfo.contact.phoneHref}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      call us
                    </a>{" "}
                    and we'll figure it out.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
