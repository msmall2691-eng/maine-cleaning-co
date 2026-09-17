import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Link, useLocation } from "wouter";
import {
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Send,
  Loader2,
  Phone,
  Clock,
  Mail,
  ClipboardCheck,
  MessageSquare,
  MapPin,
  Camera,
  X,
  User,
  ArrowRight,
  Home,
  Sparkles,
  Waves,
  Building2,
  Info,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { RESPONSE_REPLY, RESPONSE_CONFIRM } from "@/lib/response-time";
import { ResponseNote } from "@/components/ui/ResponseNote";
import { VoiceInput, type ParsedEstimate } from "@/components/ui/VoiceInput";
import { computeEstimate } from "@shared/pricing";

type ServiceCategory = "residential" | "deep-clean" | "str" | "commercial";
type Frequency = "weekly" | "biweekly" | "monthly" | "one-time";
type HomeCondition = "maintenance" | "moderate" | "heavy";
type PetHair = "none" | "some" | "heavy";
type EntryMethod = "owner-home" | "lockbox" | "hidden-key" | "gate-code" | "other";
type FocusArea = "kitchen" | "bathrooms" | "floors" | "dusting" | "laundry";
// Canonical arrival-window values — shared contract with the server +
// Bright-Space. Display labels live in ARRIVAL_WINDOW_OPTIONS below.
type ArrivalWindow = "morning" | "afternoon" | "evening" | "flexible";
const ARRIVAL_WINDOW_OPTIONS: { value: ArrivalWindow; label: string }[] = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12–4pm)" },
  { value: "evening", label: "Evening (4–7pm)" },
  { value: "flexible", label: "Flexible / any time" },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Deliberately loose — just enough to catch "meg@gmail" / "meg gmail.com"
// typos INLINE instead of letting the server 422 into a toast the customer
// has to decode. The server's zod .email() remains the real gate.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Seg<T extends string>({
  options,
  value,
  onChange,
  id,
}: {
  options: { id: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="flex rounded-xl bg-muted/40 p-1 gap-0.5 w-full overflow-hidden border border-border/40">
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            data-testid={`${id}-${o.id}`}
            className={`flex-1 py-2 px-1.5 rounded-lg text-[12.5px] sm:text-[13px] font-medium transition-all text-center leading-snug min-h-[44px] flex items-center justify-center gap-1.5 ${
              active
                ? "bg-primary/15 text-foreground ring-1 ring-primary/40 font-semibold shadow-[inset_0_1px_0_hsl(var(--primary)/0.1)]"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "opacity-60"}`} />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface AddressSuggestion {
  display: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

function AddressInput({ value, onChange, onZipDetected }: { value: string; onChange: (v: string) => void; onZipDetected: (zip: string) => void }) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 5) { setSuggestions([]); return; }
    setLoading(true);
    // Nominatim frequently returns a road-level hit even when the customer
    // typed a specific house number — because that OSM node lacks a building
    // record on the road. Without this fallback we'd throw away the "155" in
    // "155 Keystone Dr" and ship the quote to the wrong (road-only) address.
    // Grab the leading number/unit off the raw query so we can graft it back
    // onto a road-only Nominatim result (audit L2, July-2026).
    const typedLeadingNumber = (query.trim().match(/^(\d+[a-zA-Z]?)\s+/)?.[1]) || "";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Maine, USA")}&format=json&countrycodes=us&addressdetails=1&limit=5`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "MaineCleaningCo-Website-Estimate"
          }
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      const mapped: AddressSuggestion[] = data
        .filter((r: any) => r.address?.state === "Maine" || r.address?.state === "ME")
        .map((r: any) => {
          const houseNum = r.address?.house_number || r.address?.building || r.address?.house_name;
          const road = r.address?.road || "";
          let street: string;
          if (houseNum) {
            street = `${houseNum} ${road}`.trim();
          } else if (road) {
            // No house number in the OSM hit — reuse the number the customer
            // just typed so the resulting street reads "155 Keystone Drive"
            // instead of the plain "Keystone Drive" the old code shipped.
            street = typedLeadingNumber ? `${typedLeadingNumber} ${road}` : road;
          } else {
            street = r.display_name.split(",")[0].trim();
          }
          return {
            display: (r.display_name?.split(", United States")[0] || r.display_name).trim(),
            street,
            city: r.address?.city || r.address?.town || r.address?.village || "",
            state: "ME",
            zip: r.address?.postcode || "",
          };
        });
      setSuggestions(mapped);
      setShowSuggestions(mapped.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    const full = [s.street, s.city, s.state, s.zip].filter(Boolean).join(", ");
    onChange(full);
    if (s.zip) onZipDetected(s.zip);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin pointer-events-none" />}
      <Input
        placeholder="Start typing your address..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        className="input-field !pl-9"
        data-testid="input-address"
        autoComplete="off"
      />
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectSuggestion(s)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0 flex items-start gap-2"
              data-testid={`suggestion-address-${i}`}
            >
              <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground leading-snug">{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Category selector card ── */
const categories: { id: ServiceCategory; label: string; sub: string; icon: any; color: string; bg: string }[] = [
  { id: "residential", label: "Residential", sub: "Weekly · Biweekly · Monthly", icon: Home, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "deep-clean", label: "Deep Clean", sub: "Top-to-bottom refresh", icon: Sparkles, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "str", label: "Vacation Rental", sub: "Airbnb & STR turnovers", icon: Waves, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { id: "commercial", label: "Commercial", sub: "Offices & businesses", icon: Building2, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
];

interface InstantEstimateProps {
  defaultCategory?: ServiceCategory;
  // When true the component reframes itself for the /book route: header
  // reads "Book Your Cleaning" instead of "Get Your Instant Estimate", and
  // the step-3 booking panel opens auto-expanded so the customer isn't
  // asked "want to book a date?" — they came here to book.
  bookingIntent?: boolean;
}

export function InstantEstimate({ defaultCategory, bookingIntent = false }: InstantEstimateProps = {}) {
  const [, navigate] = useLocation();

  // Determine initial category: prop > URL param > default "residential"
  const initialCategory = (): ServiceCategory => {
    if (defaultCategory) return defaultCategory;
    const params = new URLSearchParams(window.location.search);
    const svc = params.get("service");
    const valid: ServiceCategory[] = ["residential", "deep-clean", "str", "commercial"];
    if (svc && valid.includes(svc as ServiceCategory)) return svc as ServiceCategory;
    return "residential";
  };

  const [category, setCategory] = useState<ServiceCategory>(initialCategory);
  const [sqft, setSqft] = useState([2000]);
  const [frequency, setFrequency] = useState<Frequency>("biweekly");
  const [petHair, setPetHair] = useState<PetHair>("none");
  const [condition, setCondition] = useState<HomeCondition>("maintenance");
  const [bathrooms, setBathrooms] = useState(2);
  const [zip, setZip] = useState("");

  // Pet hair, condition and ZIP sit behind a disclosure in step 1 (see the
  // comment at that panel). All three have defaults that price correctly, so
  // the form opens short. Two rules keep this from becoming hidden state:
  // the panel force-opens the moment any of them goes off-default — which is
  // how VoiceInput's parsed values reveal themselves rather than silently
  // changing the price — and the summary line always names what is set.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsDirty = petHair !== "none" || condition !== "maintenance" || zip.trim() !== "";
  useEffect(() => {
    if (detailsDirty) setDetailsOpen(true);
  }, [detailsDirty]);
  const detailSummary = useMemo(() => {
    const parts: string[] = [];
    if (petHair !== "none") parts.push(petHair === "some" ? "Some pets" : "Heavy pet hair");
    if (condition !== "maintenance") parts.push(condition === "moderate" ? "Moderate condition" : "Heavy condition");
    if (zip.trim()) parts.push(`ZIP ${zip.trim()}`);
    return parts.length > 0 ? parts.join(" · ") : "Optional — all set to the usual defaults";
  }, [petHair, condition, zip]);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // "Essentials" for a real booking — the six fields cleaners actually
  // need on-site that the estimator itself doesn't ask (bedrooms / entry /
  // parking / pets specifics / focus areas / special instructions). Kept
  // in one place so the payload builder can spread them.
  const [bedrooms, setBedrooms] = useState(3);
  const [entryMethod, setEntryMethod] = useState<EntryMethod>("owner-home");
  const [arrivalWindow, setArrivalWindow] = useState<ArrivalWindow>("flexible");
  const [parkingNotes, setParkingNotes] = useState("");
  const [petsDetail, setPetsDetail] = useState("");
  const [focusAreas, setFocusAreas] = useState<Record<FocusArea, boolean>>({
    kitchen: false, bathrooms: false, floors: false, dusting: false, laundry: false,
  });
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Short-term-rental extras. STR is a custom-quote path (no instant number),
  // but these specifics let the operator quote a turnover accurately and the
  // cleaner arrive prepared. They ride the intake payload as structured fields
  // and land on the Bright-Space request (custom_fields for the free-text ones,
  // native columns for guests/bedrooms/bathrooms).
  const [guests, setGuests] = useState<number | "">("");
  const [listingUrl, setListingUrl] = useState("");
  const [turnoverDay, setTurnoverDay] = useState("");
  const [petsAllowed, setPetsAllowed] = useState("");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  // The intake row id returned by /api/intake/submit — passed into the
  // booking payload so the server links booking_requests.intake_id and the
  // operator sees one journey, not two unrelated rows.
  const [intakeId, setIntakeId] = useState<number | null>(null);
  // Capability URL returned by /api/booking/submit — the customer's
  // self-service edit/cancel page. Shown on the success step (and emailed
  // when they left an email).
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const [portalCreated, setPortalCreated] = useState(false);
  const [portalLoggedIn, setPortalLoggedIn] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [bookingDate, setBookingDate] = useState("");
  const [addressEligible, setAddressEligible] = useState<boolean | null>(null);
  const [addressDistance, setAddressDistance] = useState<number | null>(null);
  const [addressCheckMsg, setAddressCheckMsg] = useState("");
  const [checkingAddress, setCheckingAddress] = useState(false);
  // Distinguishes "the eligibility lookup couldn't determine an answer"
  // (network error / rate limit / timeout / un-geocodable address) from a
  // POSITIVE out-of-area determination. When true we fail OPEN — the booking
  // form is enabled anyway (the server re-checks on submit and also fails
  // open) and a gentle note tells the customer we'll confirm the area.
  const [addressCheckFailed, setAddressCheckFailed] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const { toast } = useToast();

  // Idempotency key for the current VISIT, not just one submission attempt.
  // The step 1/2 intake submit and the step 3 booking submit are the SAME
  // customer visit — Bright-Space can only collapse them into one Lead if
  // both forwards carry the same key (codex P1 on PR #36), so this must
  // survive from the first `submit` call through `bookingMutation`. Also
  // covers retries (React Query auto-retry, a double-click) and the Express
  // layer's dual-forward to Bright-Space. Rotated only once the visit is
  // truly over — after a successful booking, or resetForm() starting a new
  // one. See Bright-Space PR #507.
  const idempotencyKeyRef = useRef<string | null>(null);
  const currentIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          // Fallback for legacy browsers without crypto.randomUUID — good
          // enough for dedup purposes; the string never goes on the wire in
          // a security-sensitive place.
          : `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    }
    return idempotencyKeyRef.current;
  };
  const rotateIdempotencyKey = () => { idempotencyKeyRef.current = null; };

  const isCustomQuote = category === "str" || category === "commercial";
  const cleanType = category === "deep-clean" ? "deep" : "standard";

  // Client-side mirror of the server's "phone or email required" refine —
  // an uncontactable lead is a dead lead, so block submit inline instead of
  // bouncing the customer off a 422.
  const hasContactMethod = Boolean(contactPhone.trim() || contactEmail.trim());
  const emailInvalid = contactEmail.trim() !== "" && !EMAIL_RE.test(contactEmail.trim());
  // Lenient typo-catcher, NOT a strict validator: a non-empty phone with
  // fewer than 7 digits ("call me", "555") can never be dialed, and the
  // server silently strips it to null — so flag it inline before submit
  // instead of losing the only way to reach the customer. 7+ digits passes.
  const phoneInvalid = contactPhone.trim() !== "" && contactPhone.replace(/\D/g, "").length < 7;

  // Voice input → fill fields. Pricing formulas untouched — we're only
  // driving the same setters the manual controls drive.
  const applyVoice = useCallback((p: ParsedEstimate) => {
    if (p.category) setCategory(p.category);
    if (p.sqft) setSqft([clamp(p.sqft, 500, 6000)]);
    if (typeof p.bathrooms === "number") {
      const rounded = Math.round(p.bathrooms * 2) / 2;
      setBathrooms(clamp(rounded, 1, 6));
    }
    if (p.frequency) setFrequency(p.frequency);
    if (p.petHair) setPetHair(p.petHair);
    if (p.condition) setCondition(p.condition);
    // Fold the raw transcript into notes so cleaners see the exact request
    if (p.transcript) {
      setContactNotes((prev) => (prev ? `${prev}\n${p.transcript}` : p.transcript));
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 3 - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 2MB limit.`, variant: "destructive" });
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast({ title: "Invalid file type", description: "Only JPEG, PNG, and WebP are accepted.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => prev.length < 3 ? [...prev, reader.result as string] : prev);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Labor-hour pricing engine — the MATH lives in @shared/pricing
  // (computeEstimate), which the server recompute (server/lib/quoteEngine.ts)
  // imports too, so the number shown here and the number the operator is
  // quoted are the same code and cannot drift. Bright-Space has a Python port
  // in backend/modules/booking/pricing.py pinned to the same shared vector
  // file (shared/pricing-vectors.json); a parity test in each repo fails if
  // any of the three drift. Change a rate/constant ONLY in @shared/pricing,
  // mirror it in the Python port, and regenerate the vectors.
  const engine = useMemo(() => {
    if (isCustomQuote) return { min: 0, max: 0, labor: 0, deep: 1 };
    const est = computeEstimate({
      sqft: sqft[0],
      bathrooms,
      cleanType,
      frequency,
      condition,
      petHair,
    });
    return { min: est.min, max: est.max, labor: est.labor, deep: est.deepMult };
  }, [bathrooms, condition, frequency, petHair, sqft, cleanType, isCustomQuote]);

  const freqLabel: Record<Frequency, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };
  const typeLabel = cleanType === "standard" ? "Standard" : "Deep Clean";

  const submit = useMutation({
    mutationFn: async () => {
      const serviceTypeMap: Record<ServiceCategory, string> = {
        residential: "standard",
        "deep-clean": "deep",
        str: "vacation-rental",
        commercial: "commercial",
      };
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sqft: isCustomQuote ? undefined : sqft[0],
          serviceType: serviceTypeMap[category],
          frequency: isCustomQuote ? undefined : frequency,
          petHair: isCustomQuote ? undefined : petHair,
          condition: isCustomQuote ? undefined : condition,
          // Send the true (possibly half-) bath count the estimate was priced
          // on — NOT Math.round(...). Rounding here made the server recompute
          // on a different bath count and quote the operator a different price
          // than the customer just saw. STR collects baths too (for quoting),
          // so send it on both paths.
          bathrooms: isCustomQuote ? (category === "str" ? bathrooms : undefined) : bathrooms,
          estimateMin: engine.min || undefined,
          estimateMax: engine.max || undefined,
          // STR turnover details — structured so they land on the Bright-Space
          // request instead of being buried in the free-text note. Only sent
          // for the STR custom-quote flow.
          bedrooms: category === "str" ? bedrooms : undefined,
          guests: category === "str" && guests !== "" ? guests : undefined,
          listingUrl: category === "str" && listingUrl.trim() ? listingUrl.trim() : undefined,
          turnoverDay: category === "str" && turnoverDay ? turnoverDay : undefined,
          petsAllowed: category === "str" && petsAllowed ? petsAllowed : undefined,
          name: contactName || null,
          email: contactEmail || null,
          phone: contactPhone || null,
          notes: contactNotes || null,
          zip: zip || null,
          address: contactAddress || null,
          photos: photos.length > 0 ? photos : undefined,
          source: "website_form",
          idempotencyKey: currentIdempotencyKey(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const fieldErrors = json?.errors && typeof json.errors === "object"
          ? Object.entries(json.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
              .join("; ")
          : "";
        throw new Error(fieldErrors ? `${json?.message || "Failed"} — ${fieldErrors}` : (json?.message || "Failed"));
      }
      return json;
    },
    onSuccess: (data) => {
      setStep(3);
      // Remember the intake row so the follow-on booking submit can link
      // booking_requests.intake_id back to this submission.
      if (typeof data?.id === "number") setIntakeId(data.id);
      if (data?.portalCreated) setPortalCreated(true);
      if (data?.existingAccount) setExistingAccount(true);
      if (data?.emailSent === false) setEmailSent(false);
      // Do NOT rotate here. Step 3 leads straight into bookingMutation for
      // the same visit — Bright-Space can only collapse the intake forward
      // and the booking forward into one Lead if both carry the SAME key
      // (codex P1 on PR #36). The key rotates only once this visit is truly
      // done: after a successful booking, or when resetForm() starts a new one.
      toast({ title: "Request sent!", description: "We'll be in touch soon." });
    },
    onError: () => { toast({ title: "Something went wrong", description: "Please try again or call us directly.", variant: "destructive" }); },
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const serviceTypeMap: Record<ServiceCategory, string> = {
        residential: "standard",
        "deep-clean": "deep",
        str: "str",
        commercial: "commercial",
      };
      const selectedFocus = (Object.keys(focusAreas) as FocusArea[]).filter(k => focusAreas[k]);
      const res = await fetch("/api/booking/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail || null,
          phone: contactPhone,
          address: contactAddress,
          zip: zip || null,
          serviceType: serviceTypeMap[category],
          frequency: isCustomQuote ? null : frequency,
          sqft: isCustomQuote ? null : sqft[0],
          bedrooms: isCustomQuote ? null : bedrooms,
          // True (possibly half-) bath count — see the intake submit above.
          // The server recomputes the trusted estimate on this exact value and
          // rounds only when writing the integer column, so the operator's
          // price matches the one the customer was shown.
          bathrooms: isCustomQuote ? null : bathrooms,
          petHair: isCustomQuote ? null : petHair,
          condition: isCustomQuote ? null : condition,
          estimateMin: engine.min || null,
          estimateMax: engine.max || null,
          requestedDate: bookingDate,
          distanceMiles: addressDistance,
          // Link this booking to the step-1/2 intake row (same visit).
          intakeId,
          // The six essentials the cleaner needs on-site. Sent as top-level
          // fields; Bright-Space stores them in LeadIntake.custom_fields
          // (JSON), so no schema migration is required to land them.
          entryMethod: isCustomQuote ? null : entryMethod,
          arrivalWindow: isCustomQuote ? null : arrivalWindow,
          parkingNotes: parkingNotes.trim() || null,
          petsDetail: petsDetail.trim() || null,
          focusAreas: selectedFocus.length ? selectedFocus : null,
          specialInstructions: specialInstructions.trim() || null,
          idempotencyKey: currentIdempotencyKey(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const fieldErrors = json?.errors && typeof json.errors === "object"
          ? Object.entries(json.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
              .join("; ")
          : "";
        throw new Error(fieldErrors ? `${json?.message || "Booking failed"} — ${fieldErrors}` : (json?.message || "Failed"));
      }
      return json;
    },
    onSuccess: (data) => {
      setBookingSubmitted(true);
      setStep(4);
      // Self-service edit/cancel link for the success screen.
      if (typeof data?.manageUrl === "string") setManageUrl(data.manageUrl);
      // The visit is complete — rotate so a subsequent booking (after
      // resetForm, or a second independent /book submission in the same
      // page session) gets its own fresh key instead of colliding with
      // this one in Bright-Space's dedup.
      rotateIdempotencyKey();
      toast({ title: "Booking request sent!", description: RESPONSE_CONFIRM });
    },
    onError: (err: Error) => {
      toast({ title: "Booking failed", description: err.message || "Please try again or call us.", variant: "destructive" });
    },
  });

  const checkAddressEligibility = useCallback(async (address: string) => {
    if (address.length < 10) return;
    setCheckingAddress(true);
    setAddressCheckFailed(false);
    // Helper: couldn't determine → fail OPEN. Leave addressEligible null (no
    // green "you're in the area" claim) but flag the fallback so the booking
    // form still opens with a soft note.
    const failOpen = () => {
      setAddressEligible(null);
      setAddressDistance(null);
      setAddressCheckMsg("");
      setAddressCheckFailed(true);
    };
    try {
      const res = await fetch("/api/booking/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      // Server error (5xx/4xx) — flaky lookup, not a real answer. Fail open.
      if (!res.ok) { failOpen(); return; }
      const data = await res.json();
      if (data.eligible === true) {
        setAddressEligible(true);
        setAddressDistance(data.distanceMiles ?? null);
        setAddressCheckMsg(data.message || "");
        setAddressCheckFailed(false);
      } else if (data.eligible === false && data.distanceMiles != null) {
        // POSITIVE out-of-area: geocoded successfully AND beyond the radius.
        // This is the ONLY case that hard-blocks booking.
        setAddressEligible(false);
        setAddressDistance(data.distanceMiles ?? null);
        setAddressCheckMsg(data.message || "");
        setAddressCheckFailed(false);
      } else {
        // eligible=false with no distance → geocode returned nothing / couldn't
        // determine. Not a positive rejection — fail open.
        failOpen();
      }
    } catch {
      // Network error / timeout — fail open.
      failOpen();
    } finally {
      setCheckingAddress(false);
    }
  }, []);

  // Minimum bookable date. Was today + 2 (a hard "we need lead time" gate);
  // relaxed to tomorrow so customers can genuinely book anytime while we
  // still get one calendar day to confirm and dispatch. Same-day requests
  // that come in through this form would collide with the confirmation
  // window; the copy on the panel points those callers at the phone.
  const minBookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // The date input's `min` stops the picker, but a typed/stale date can
  // still land under the lead-time floor — catch it inline instead of
  // letting the server 400 into a toast. ISO strings compare lexically.
  const bookingDateTooSoon = bookingDate !== "" && bookingDate < minBookingDate;

  // Auto-run the address check as soon as step 3 has a name+phone+address
  // and hasn't been checked yet — one less click between the estimate and
  // the booking form. Runs once per unique address so re-renders don't
  // spam /validate-address.
  useEffect(() => {
    if (
      step === 3 &&
      !isCustomQuote &&
      addressEligible === null &&
      !addressCheckFailed &&
      !checkingAddress &&
      contactAddress && contactAddress.length >= 10 &&
      contactName && contactPhone
    ) {
      checkAddressEligibility(contactAddress);
    }
  }, [step, isCustomQuote, addressEligible, addressCheckFailed, checkingAddress, contactAddress, contactName, contactPhone, checkAddressEligibility]);

  const resetForm = () => {
    setStep(1);
    setIntakeId(null);
    setManageUrl(null);
    setPortalCreated(false);
    setPortalLoggedIn(false);
    setExistingAccount(false);
    setEmailSent(true);
    setBookingDate("");
    setAddressEligible(null);
    setAddressDistance(null);
    setAddressCheckMsg("");
    setAddressCheckFailed(false);
    setBookingSubmitted(false);
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactNotes("");
    setContactAddress("");
    setPhotos([]);
    setArrivalWindow("flexible");
    submit.reset();
    bookingMutation.reset();
    // A user who submits the intake step (gets an estimate lead), then
    // resets the form to start over — with the same or different details —
    // is starting a genuinely new visit. Give it a fresh key so it doesn't
    // collide with the abandoned one in Bright-Space's dedup.
    rotateIdempotencyKey();
  };

  // Screen-reader announcement for the multi-step wizard. A visually-hidden
  // aria-live region (below) reads this whenever the step changes so
  // non-visual users know the form advanced. Custom-quote is a 2-step flow
  // (details → confirmation); the estimate/booking flow is 4 steps.
  const bookingDone = step === 4 || (step === 3 && bookingSubmitted);
  const stepAnnouncement = isCustomQuote
    ? (bookingDone || step >= 3 ? "Quote request sent" : "Step 1 of 2: your details")
    : bookingDone
      ? "Step 4 of 4: booking confirmed"
      : step === 1
        ? "Step 1 of 4: build your estimate"
        : step === 2
          ? "Step 2 of 4: your details"
          : "Step 3 of 4: request sent — book your cleaning";

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-[0_2px_16px_rgba(0,0,0,0.15),0_8px_32px_rgba(0,0,0,0.1)] w-full max-w-full overflow-hidden card-gradient-border" data-testid="card-instant-estimate">
      {/* Wizard step announcer — visually hidden, read by screen readers on step change. */}
      <div className="sr-only" role="status" aria-live="polite" data-testid="wizard-step-status">{stepAnnouncement}</div>
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2" data-testid="text-instant-estimate-title">
              {!isCustomQuote && (
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </span>
              )}
              {isCustomQuote ? "Request a Custom Quote" : "Instant Estimate"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isCustomQuote
                ? `Pricing for ${category === "str" ? "vacation rentals" : "commercial spaces"} varies — we'll get back to you quickly.`
                : "Adjust the details for an instant price range."}
            </p>
          </div>
        </div>
        {step === 1 && !isCustomQuote && (
          <div className="mt-3">
            <VoiceInput onParse={applyVoice} />
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-6">

        {/* ── Category Selector (always visible in step 1) ── */}
        {step === 1 && (
          <div className="mb-6">
            <label className="label-sm">What type of property?</label>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    data-testid={`category-${cat.id}`}
                    className={`flex items-start gap-2.5 p-4 rounded-xl border text-left transition-all min-h-[80px] ${
                      active
                        ? `${cat.bg} border-opacity-80 ring-1 ring-primary/25 shadow-sm`
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? cat.bg : "bg-muted/40"}`}>
                      <Icon className={`w-3.5 h-3.5 ${active ? cat.color : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-semibold leading-tight ${active ? "text-foreground" : "text-foreground/70"}`}>{cat.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{cat.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Calculator (residential / deep-clean) ── */}
          {step === 1 && !isCustomQuote && (
            <motion.div key="s1-calc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">

              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="label-sm !mb-0">Square footage</label>
                  <span className="text-lg font-bold text-primary tabular-nums" data-testid="value-sqft">
                    {sqft[0].toLocaleString()}
                    <span className="text-xs font-medium text-muted-foreground ml-1">sq ft</span>
                  </span>
                </div>
                <Slider value={sqft} onValueChange={setSqft} min={500} max={6000} step={100} className="w-full" data-testid="slider-sqft" aria-label={`Square footage, currently ${sqft[0].toLocaleString()} square feet`} aria-valuetext={`${sqft[0].toLocaleString()} square feet`} />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] text-muted-foreground">500</span>
                  <span className="text-[10.5px] text-muted-foreground/80 font-medium">
                    {(() => {
                      const s = sqft[0];
                      if (s < 800) return "≈ studio / small condo";
                      if (s < 1300) return "≈ 1–2 bedroom";
                      if (s < 1900) return "≈ 2–3 bedroom";
                      if (s < 2700) return "≈ 3–4 bedroom";
                      if (s < 3600) return "≈ 4–5 bedroom";
                      return "≈ large home";
                    })()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">6,000+</span>
                </div>
              </div>

              {/* Bathrooms. The eleven-dot fill rail and its "Tap + / − ·
                  half-baths count too" caption were replaced by the number
                  itself between the two buttons: the rail encoded the value a
                  second time, less precisely, and the caption explained a
                  control that a plus and a minus sign already explain. */}
              <div>
                <label className="label-sm" id="label-bathrooms">Bathrooms</label>
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-labelledby="label-bathrooms"
                >
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setBathrooms(v => Math.max(1, Math.round((v - 0.5) * 2) / 2))}
                    data-testid="button-bath-minus"
                    aria-label={`Decrease bathrooms, currently ${bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)} and a half` : bathrooms}`}
                  >&minus;</button>
                  <div
                    className="flex-1 h-12 rounded-xl bg-muted/30 border border-border/40 flex items-baseline justify-center gap-1.5"
                    data-testid="value-bathrooms"
                  >
                    <span className="text-lg font-bold text-primary tabular-nums">
                      {bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)}½` : bathrooms}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {bathrooms === 1 ? "bath" : "baths"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setBathrooms(v => Math.min(6, Math.round((v + 0.5) * 2) / 2))}
                    data-testid="button-bath-plus"
                    aria-label={`Increase bathrooms, currently ${bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)} and a half` : bathrooms}`}
                  >+</button>
                </div>
              </div>

              {category === "residential" && (
                <div>
                  <label className="label-sm">Frequency</label>
                  <Seg
                    options={[
                      { id: "weekly" as Frequency, label: "Weekly" },
                      { id: "biweekly" as Frequency, label: "Biweekly" },
                      { id: "monthly" as Frequency, label: "Monthly" },
                      { id: "one-time" as Frequency, label: "One-time" },
                    ]}
                    value={frequency} onChange={setFrequency} id="seg-freq"
                  />
                </div>
              )}

              {/* Pet hair, condition and ZIP live behind a disclosure.
                  Every one of them has a sensible default and the estimate is
                  correct without touching any of them, so showing all three
                  up front tripled the apparent length of the form for no gain.
                  Nothing is lost: the fields keep their state, they still
                  price, and they still submit. The panel opens itself and
                  stays open whenever a value is off-default (including when
                  VoiceInput fills it), and the summary line below the toggle
                  shows what is set while it's shut, so this is never hidden
                  state the customer can't see. */}
              <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors min-h-[48px]"
                  aria-expanded={detailsOpen}
                  aria-controls="estimate-details-panel"
                  data-testid="button-toggle-details"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Pets, condition &amp; ZIP
                    </span>
                    <span className="block text-[11.5px] text-muted-foreground truncate">
                      {detailSummary}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${detailsOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {detailsOpen && (
                  <div id="estimate-details-panel" className="px-4 pb-4 pt-1 space-y-4 border-t border-border/40">
                    <div>
                      <label className="label-sm">Pet hair</label>
                      <Seg
                        options={[{ id: "none" as PetHair, label: "None" }, { id: "some" as PetHair, label: "Some" }, { id: "heavy" as PetHair, label: "Heavy" }]}
                        value={petHair} onChange={setPetHair} id="seg-pet"
                      />
                    </div>
                    <div>
                      <label className="label-sm">Home condition</label>
                      <Seg
                        options={[{ id: "maintenance" as HomeCondition, label: "Maintained" }, { id: "moderate" as HomeCondition, label: "Moderate" }, { id: "heavy" as HomeCondition, label: "Heavy" }]}
                        value={condition} onChange={setCondition} id="seg-cond"
                      />
                    </div>
                    <div>
                      <label className="label-sm" htmlFor="input-zip">ZIP code <span className="font-normal text-muted-foreground">(optional)</span></label>
                      <Input
                        id="input-zip"
                        placeholder="e.g. 04101"
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                        className="h-10 rounded-xl border-border bg-card mt-1"
                        data-testid="input-zip"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        pattern="\d{5}(-\d{4})?"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* The price. Was a three-stop gradient with two blurred colour
                  blobs behind it; on a panel that already carried ten bordered
                  blocks, the loudest decoration in the form sat on the one
                  element that didn't need any help being noticed. One flat
                  tint, and the availability line folded in from what used to
                  be a separate blue banner below it. */}
              <div className="rounded-2xl bg-primary/[0.07] border border-primary/20 p-5">
                <div className="flex items-center gap-1.5 mb-1.5" data-testid="label-range">
                  <Sparkles className="w-3 h-3 text-primary/70" />
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Estimated range
                  </span>
                </div>
                <div className="text-3xl sm:text-[2.4rem] font-bold text-foreground tracking-tight" data-testid="text-range">
                  {fmt(engine.min)}<span className="text-muted-foreground font-normal mx-1.5 text-xl sm:text-2xl">–</span>{fmt(engine.max)}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5" data-testid="text-summary">
                  <span className="text-[11px] font-medium bg-muted/60 border border-border/40 text-muted-foreground rounded-full px-2 py-0.5">
                    {sqft[0].toLocaleString()} sq ft
                  </span>
                  <span className="text-[11px] font-medium bg-muted/60 border border-border/40 text-muted-foreground rounded-full px-2 py-0.5">
                    {bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)}½` : bathrooms} bath
                  </span>
                  <span className="text-[11px] font-medium bg-muted/60 border border-border/40 text-muted-foreground rounded-full px-2 py-0.5">
                    {typeLabel}
                  </span>
                  {category === "residential" && (
                    <span className="text-[11px] font-medium bg-muted/60 border border-border/40 text-muted-foreground rounded-full px-2 py-0.5">
                      {freqLabel[frequency]}
                    </span>
                  )}
                  {condition !== "maintenance" && (
                    <span className="text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5">
                      {condition === "moderate" ? "Moderate condition" : "Heavy condition"}
                    </span>
                  )}
                  {petHair !== "none" && (
                    <span className="text-[11px] font-medium bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full px-2 py-0.5">
                      {petHair === "some" ? "Some pets" : "Heavy pet hair"}
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-primary/15 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-availability">
                    <Clock className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" aria-hidden="true" />
                    <span><span className="font-semibold text-foreground">Typical availability:</span> 3-7 business days</span>
                  </span>
                  <span className="text-xs text-muted-foreground italic" data-testid="text-disclaimer">
                    Non-binding estimate. Final price confirmed after review.
                  </span>
                </div>
              </div>

              <Button className="w-full h-[52px] rounded-xl text-base font-bold shadow-md group min-h-[48px]" onClick={() => setStep(2)} data-testid="button-review">
                Review &amp; Submit <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 1: Custom Quote (STR / Commercial) ── */}
          {step === 1 && isCustomQuote && (
            <motion.div key="s1-custom" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">

              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Custom pricing required</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    {category === "str"
                      ? "Vacation rental turnovers depend on property size, guest turnover schedule, and same-day flip requirements. We'll send you a tailored quote quickly."
                      : "Commercial cleaning pricing depends on your space, frequency, and specific requirements. We'll follow up with a custom proposal."}
                  </p>
                </div>
              </div>

              {category === "str" && (
                <div className="space-y-3">
                  <p className="label-sm">Rental details <span className="font-normal text-muted-foreground">(helps us quote your turnover)</span></p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground" htmlFor="str-bedrooms">Bedrooms</label>
                      <Input id="str-bedrooms" type="number" min={0} max={20} step={1} value={bedrooms}
                        onChange={e => setBedrooms(clamp(parseInt(e.target.value || "0", 10), 0, 20))}
                        className="input-field" data-testid="input-str-bedrooms" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground" htmlFor="str-bathrooms">Bathrooms</label>
                      {/* min 1, not 0 — the server schema requires ≥1 bath and a
                          0 here sailed all the way to a 422 after submit. */}
                      <Input id="str-bathrooms" type="number" min={1} max={20} step={0.5} value={bathrooms}
                        onChange={e => setBathrooms(clamp(Math.round((parseFloat(e.target.value || "1")) * 2) / 2, 1, 20))}
                        className="input-field" data-testid="input-str-bathrooms" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground" htmlFor="str-guests">Max guests</label>
                      <Input id="str-guests" type="number" min={0} max={50} step={1} value={guests}
                        onChange={e => setGuests(e.target.value === "" ? "" : clamp(parseInt(e.target.value, 10), 0, 50))}
                        className="input-field" data-testid="input-str-guests" />
                    </div>
                  </div>
                  <Input placeholder="Airbnb / VRBO listing link (optional)" type="url" value={listingUrl}
                    onChange={e => setListingUrl(e.target.value)} className="input-field" data-testid="input-str-listing" inputMode="url" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={turnoverDay} onChange={e => setTurnoverDay(e.target.value)}
                      className="input-field" data-testid="select-str-turnover" aria-label="Turnover day">
                      <option value="">Turnover day…</option>
                      <option value="Flexible">Flexible</option>
                      <option value="Same-day flip">Same-day flip</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                    <select value={petsAllowed} onChange={e => setPetsAllowed(e.target.value)}
                      className="input-field" data-testid="select-str-pets" aria-label="Does the rental allow pets">
                      <option value="">Pets allowed?…</option>
                      <option value="No pets">No pets</option>
                      <option value="Dogs">Dogs</option>
                      <option value="Cats">Cats</option>
                      <option value="Dogs & cats">Dogs & cats</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Real labels, not placeholder-only — placeholders vanish the
                    moment the customer types, and screen readers never see
                    them. Mirrors the labeled residential step-2 fields. */}
                <p className="label-sm">Your contact info</p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="custom-name">Name</label>
                  <Input id="custom-name" placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)} className="input-field" data-testid="input-name" autoComplete="name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="custom-phone">Phone</label>
                  <Input id="custom-phone" placeholder="Phone number" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input-field" data-testid="input-phone" autoComplete="tel" inputMode="tel" aria-invalid={phoneInvalid || undefined} aria-describedby={phoneInvalid ? "custom-phone-error" : undefined} />
                  {phoneInvalid && (
                    <p id="custom-phone-error" role="alert" className="text-[11px] text-destructive mt-1 ml-1" data-testid="error-phone">
                      That phone number doesn't look complete.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="custom-email">Email</label>
                  <Input id="custom-email" placeholder="Email address" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input-field" data-testid="input-email" autoComplete="email" inputMode="email" aria-invalid={emailInvalid || undefined} aria-describedby={emailInvalid ? "custom-email-error" : undefined} />
                  {emailInvalid && (
                    <p id="custom-email-error" role="alert" className="text-[11px] text-destructive mt-1 ml-1" data-testid="error-email">
                      That email doesn't look right — double-check it before sending.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Property address</label>
                  <AddressInput value={contactAddress} onChange={setContactAddress} onZipDetected={setZip} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="custom-notes">Details</label>
                  <Input
                    id="custom-notes"
                    placeholder={
                      category === "str"
                        ? "# of bedrooms, how often guests turn over, any extras..."
                        : "Type of business, sq footage, days/times needed..."
                    }
                    value={contactNotes}
                    onChange={e => setContactNotes(e.target.value)}
                    className="input-field"
                    data-testid="input-notes"
                  />
                </div>
              </div>

              <div>
                <p className="label-sm">Property photos <span className="font-normal text-muted-foreground">(optional, up to 3)</span></p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group" data-testid={`photo-preview-${idx}`}>
                      <img src={photo} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-photo-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      data-testid="button-add-photo"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>

              <Button
                className="w-full h-[52px] rounded-xl text-base font-bold shadow-md group min-h-[48px]"
                disabled={submit.isPending || !hasContactMethod || emailInvalid || phoneInvalid}
                onClick={() => submit.mutate()}
                data-testid="button-submit-custom"
              >
                {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Send Quote Request</>}
              </Button>
              {!hasContactMethod && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center leading-relaxed flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Add a phone or email so we can send your quote.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                {RESPONSE_REPLY}
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Contact + confirm (residential/deep) ── */}
          {step === 2 && !isCustomQuote && (
            <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
              <h4 className="text-base font-semibold text-foreground text-center">Almost there! Just a few details.</h4>
              <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 p-5 rounded-xl text-center">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Your estimate</div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight" data-testid="text-review-range">
                  {fmt(engine.min)}<span className="text-muted-foreground font-normal mx-1.5 text-lg sm:text-xl">–</span>{fmt(engine.max)}
                </div>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {sqft[0].toLocaleString()} sq ft · {bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)}½` : bathrooms} bath · {typeLabel}{category === "residential" ? ` · ${freqLabel[frequency]}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">Non-binding. Final price confirmed after review.</p>
              </div>

              <div className="space-y-3.5">
                {/* Not "all optional" any more — a lead with no phone AND no
                    email is uncontactable and forwarded as "Unknown". The
                    server enforces the same rule (intakeSubmitSchema refine). */}
                <p className="label-sm">Contact info <span className="font-normal text-muted-foreground">(phone or email required)</span></p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                  <Input placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)} className="input-field !h-11" data-testid="input-name" autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="step2-phone" className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <Input id="step2-phone" placeholder="Phone number" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input-field !h-11" data-testid="input-phone" autoComplete="tel" inputMode="tel" aria-invalid={phoneInvalid || undefined} aria-describedby={phoneInvalid ? "step2-phone-error" : undefined} />
                  {phoneInvalid && (
                    <p id="step2-phone-error" role="alert" className="text-[11px] text-destructive mt-1 ml-1" data-testid="error-phone">
                      That phone number doesn't look complete.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="step2-email" className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <Input id="step2-email" placeholder="Email address" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input-field !h-11" data-testid="input-email" autoComplete="email" inputMode="email" aria-invalid={emailInvalid || undefined} aria-describedby={emailInvalid ? "step2-email-error" : undefined} />
                  {emailInvalid ? (
                    <p id="step2-email-error" role="alert" className="text-[11px] text-destructive mt-1 ml-1" data-testid="error-email">
                      That email doesn't look right — double-check it before submitting.
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-1 ml-1">Enter your email to receive a copy of this request.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                  <AddressInput
                    value={contactAddress}
                    onChange={setContactAddress}
                    onZipDetected={(z) => setZip(z)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <Input placeholder="Anything else? (optional)" value={contactNotes} onChange={e => setContactNotes(e.target.value)} className="input-field !h-11" data-testid="input-notes" />
                </div>
              </div>

              <div>
                <p className="label-sm">Property photos <span className="font-normal text-muted-foreground">(optional, up to 3)</span></p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group" data-testid={`photo-preview-${idx}`}>
                      <img src={photo} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-photo-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      data-testid="button-add-photo"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>

              <ul className="space-y-1.5 text-[13px] text-muted-foreground">
                {["All living areas, kitchens & bathrooms", "Eco-friendly products (Melaleuca & Sal Suds)", "Bonded and insured crew"].map((t, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t}</li>
                ))}
              </ul>

              <div className="flex gap-3">
                <Button variant="outline" className="h-[52px] px-5 sm:px-6 rounded-xl border-border text-sm font-medium" onClick={() => setStep(1)} data-testid="button-back">Back</Button>
                <Button className="flex-1 h-[52px] text-base rounded-xl shadow-md font-bold" disabled={submit.isPending || !hasContactMethod || emailInvalid || phoneInvalid} onClick={() => submit.mutate()} data-testid="button-submit">
                  {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Submit Request</>}
                </Button>
              </div>
              {!hasContactMethod && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center leading-relaxed flex items-center justify-center gap-1 !mt-3">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Add a phone or email so we can send your quote.
                </p>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Success + Book a Date ── */}
          {step === 3 && !bookingSubmitted && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="py-5 sm:py-8 space-y-6">
              <div className="text-center">
                <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground" data-testid="text-success-title">
                  {isCustomQuote ? "Quote Request Sent!" : "Request Sent!"}
                </h3>
                {!isCustomQuote && (
                  <p className="text-foreground text-lg mt-2 font-medium">
                    Estimate range: <span className="font-bold text-foreground">{fmt(engine.min)} – {fmt(engine.max)}</span>
                  </p>
                )}
                {contactEmail && emailSent ? (
                  <p className="text-muted-foreground text-xs mt-1.5">
                    Confirmation sent to <span className="font-medium text-foreground">{contactEmail}</span>
                  </p>
                ) : contactEmail && !emailSent ? (
                  <p className="text-muted-foreground text-xs mt-1.5">
                    We'll reach out to <span className="font-medium text-foreground">{contactEmail}</span> as soon as we can.
                  </p>
                ) : contactPhone ? (
                  <p className="text-muted-foreground text-xs mt-1.5">
                    We'll reach out by phone soon.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs mt-1.5">
                    We'll be in touch as soon as we can.
                  </p>
                )}
              </div>

              {/* ── Book This Cleaning ── */}
              {/* Only on /book. Everywhere else this component is an ESTIMATE
                  tool, and the customer has just been told their request was
                  sent — dropping a second multi-field form underneath that
                  reads as "you aren't done yet", so people were filling it in
                  thinking the estimate hadn't gone through. The estimate stands
                  on its own; booking is a separate, deliberate step at /book. */}
              {bookingIntent && !isCustomQuote && contactAddress && contactName && contactPhone && (
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-primary/10 border border-blue-500/25 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h4 className="text-sm font-bold text-foreground">
                      {bookingIntent ? "Book Your Cleaning" : "Book This Cleaning"}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A few essentials so we come in ready — pick any date from tomorrow forward,
                    anywhere across Southern Maine. Need same-day?{" "}
                    <a href={companyInfo.contact.phoneHref} className="underline underline-offset-2 hover:text-foreground">
                      Give us a call
                    </a>{" "}
                    and we'll do our best.
                  </p>

                  {/* Address eligibility check */}
                  {addressEligible === null && !addressCheckFailed && !checkingAddress && (
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl text-sm"
                      onClick={() => checkAddressEligibility(contactAddress)}
                    >
                      <MapPin className="w-4 h-4 mr-1.5" /> Check if you're in our booking area
                    </Button>
                  )}
                  {checkingAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking your location...
                    </div>
                  )}
                  {(addressEligible === true || addressCheckFailed) && (
                    <>
                      {addressEligible === true ? (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-green-600 dark:text-green-400">{addressCheckMsg}</p>
                        </div>
                      ) : (
                        // Fail-open fallback: the lookup couldn't confirm the
                        // service area (flaky geocoder), so we let the customer
                        // book anyway and confirm the area when we reach out.
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20" data-testid="note-address-check-failed">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-600 dark:text-blue-400">We'll confirm your service area when we reach out.</p>
                        </div>
                      )}

                      {/* Essentials: bedrooms, entry, parking, pets, focus, notes.
                          Cleaners need these on-site — asking now, not after the
                          booking is accepted, keeps the whole flow one step. */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="booking-bedrooms" className="text-xs font-medium text-muted-foreground mb-1.5 block">Bedrooms</label>
                          <input
                            id="booking-bedrooms"
                            type="number" min={1} max={10} step={1}
                            value={bedrooms}
                            onChange={(e) => setBedrooms(clamp(parseInt(e.target.value || "0", 10), 1, 10))}
                            className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            data-testid="input-bedrooms"
                          />
                        </div>
                        <div>
                          <label htmlFor="booking-date" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Preferred date <span className="text-destructive">*</span>
                          </label>
                          <input
                            id="booking-date"
                            type="date"
                            min={minBookingDate}
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            required
                            aria-required="true"
                            aria-invalid={bookingDateTooSoon || undefined}
                            aria-describedby={bookingDateTooSoon ? "booking-date-error" : undefined}
                            className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            data-testid="input-booking-date"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="select-entry-method" className="text-xs font-medium text-muted-foreground mb-1.5 block">How will we get in?</label>
                        <select
                          id="select-entry-method"
                          value={entryMethod}
                          onChange={(e) => setEntryMethod(e.target.value as EntryMethod)}
                          className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          data-testid="select-entry-method"
                        >
                          <option value="owner-home">I'll be home</option>
                          <option value="lockbox">Lockbox</option>
                          <option value="hidden-key">Hidden key</option>
                          <option value="gate-code">Gate / door code</option>
                          <option value="other">Other (tell us below)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="select-arrival-window" className="text-xs font-medium text-muted-foreground mb-1.5 block">Preferred arrival time</label>
                        <select
                          id="select-arrival-window"
                          value={arrivalWindow}
                          onChange={(e) => setArrivalWindow(e.target.value as ArrivalWindow)}
                          className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          data-testid="select-arrival-window"
                        >
                          {ARRIVAL_WINDOW_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Parking & access <span className="text-muted-foreground/70">(optional)</span>
                        </label>
                        <Input
                          value={parkingNotes}
                          onChange={(e) => setParkingNotes(e.target.value)}
                          placeholder="Driveway, street parking, stairs to unit…"
                          className="h-11"
                          data-testid="input-parking-notes"
                        />
                      </div>

                      {petHair !== "none" && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Pets on site <span className="text-muted-foreground/70">(optional)</span>
                          </label>
                          <Input
                            value={petsDetail}
                            onChange={(e) => setPetsDetail(e.target.value)}
                            placeholder="e.g. Friendly golden retriever, cat hides upstairs"
                            className="h-11"
                            data-testid="input-pets-detail"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Anywhere you want us to focus? <span className="text-muted-foreground/70">(optional)</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {([
                            { id: "kitchen" as const,   label: "Kitchen deep" },
                            { id: "bathrooms" as const, label: "Bathrooms" },
                            { id: "floors" as const,    label: "Floors" },
                            { id: "dusting" as const,   label: "Dusting" },
                            { id: "laundry" as const,   label: "Laundry" },
                          ]).map(({ id, label }) => {
                            const on = focusAreas[id];
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setFocusAreas(f => ({ ...f, [id]: !f[id] }))}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                  on
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                                }`}
                                data-testid={`chip-focus-${id}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Anything else we should know? <span className="text-muted-foreground/70">(optional)</span>
                        </label>
                        <textarea
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          placeholder="Allergies, fragile items, alarm code, product preferences…"
                          rows={3}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          data-testid="input-special-instructions"
                        />
                      </div>

                      <Button
                        className="w-full h-[52px] rounded-xl text-base font-bold shadow-md"
                        disabled={!bookingDate || bookingDateTooSoon || bookingMutation.isPending}
                        onClick={() => bookingMutation.mutate()}
                        data-testid="button-book-date"
                      >
                        {bookingMutation.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                          : <><Calendar className="w-4 h-4 mr-2" /> Book This Cleaning</>
                        }
                      </Button>
                      {!bookingDate && !bookingMutation.isPending && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center leading-relaxed flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          Pick a preferred date above to enable booking.
                        </p>
                      )}
                      {bookingDateTooSoon && (
                        <p id="booking-date-error" role="alert" className="text-[11px] text-destructive text-center leading-relaxed flex items-center justify-center gap-1" data-testid="error-booking-date">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          Please pick a date from tomorrow forward — for same-day, give us a call.
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                        Requires approval — {RESPONSE_CONFIRM.charAt(0).toLowerCase() + RESPONSE_CONFIRM.slice(1)}
                        <br />
                        <span className="inline-flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Once confirmed, you'll get a Google Calendar invite that holds your spot automatically.
                        </span>
                      </p>
                    </>
                  )}
                  {addressEligible === false && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-500 dark:text-amber-400">{addressCheckMsg}</p>
                    </div>
                  )}
                </div>
              )}

              {/* The estimate path's only booking affordance: a link, not a
                  form. It can't be mistaken for an unfinished step. */}
              {!bookingIntent && !isCustomQuote && (
                <p className="text-center text-sm text-muted-foreground">
                  Already know you want it?{" "}
                  <Link href="/book" className="font-semibold text-primary underline underline-offset-2 hover:no-underline" data-testid="link-success-book">
                    Pick a date
                  </Link>
                </p>
              )}

              {!isCustomQuote && (contactName || contactPhone || contactEmail || contactAddress) && (
                <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 space-y-1.5 text-[13px]" data-testid="block-submission-summary">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Your Submission</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium text-foreground">{typeLabel}{category === "residential" ? ` · ${freqLabel[frequency]}` : ""}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-medium text-foreground">{sqft[0].toLocaleString()} sq ft · {bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)}½` : bathrooms} bath</span></div>
                  {contactName && <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{contactName}</span></div>}
                  {contactPhone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{contactPhone}</span></div>}
                  {contactEmail && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{contactEmail}</span></div>}
                  {contactAddress && <div className="flex justify-between gap-3"><span className="text-muted-foreground flex-shrink-0">Address</span><span className="font-medium text-foreground text-right">{contactAddress}</span></div>}
                </div>
              )}

              <ResponseNote />

              <div className="rounded-xl bg-muted/40 p-4 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" /> What happens next
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "We'll have a look at your request", desc: "You'll hear from us within 48 hours" },
                    { label: "We'll reach out to confirm details", desc: "Via phone, text, or email" },
                    { label: "If we can fit you in, your quote follows", desc: "And you'll hear from us either way" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-card border border-border/50 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a href={companyInfo.contact.phoneHref} data-testid="link-success-call">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border text-sm min-h-[48px]">
                    <Phone className="w-4 h-4 mr-1.5" /> Call Us
                  </Button>
                </a>
                <a href={companyInfo.contact.smsHref} data-testid="link-success-text">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border text-sm min-h-[48px]">
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Text Us
                  </Button>
                </a>
              </div>

              <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 text-center" onClick={resetForm} data-testid="button-new">
                Start a new {isCustomQuote ? "request" : "estimate"}
              </button>
            </motion.div>
          )}

          {/* ── Step 4: Booking Confirmed ── */}
          {(step === 4 || (step === 3 && bookingSubmitted)) && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="py-5 sm:py-8 space-y-6">
              <div className="text-center">
                <div className="w-[72px] h-[72px] rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-9 h-9 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Booking Request Sent!</h3>
                <p className="text-foreground text-lg mt-2 font-medium">
                  {new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                {!isCustomQuote && (
                  <p className="text-muted-foreground text-sm mt-1">
                    Estimate: <span className="font-semibold text-foreground">{fmt(engine.min)} – {fmt(engine.max)}</span>
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Pending approval</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We'll review your request and confirm by phone or text as soon as we can.
                      Once approved, you'll get a Google Calendar invite that adds the cleaning to your
                      phone automatically — no app to install.
                    </p>
                  </div>
                </div>
              </div>

              {/* Self-service manage link — the capability URL minted by
                  /api/booking/submit. Also emailed when they left an email. */}
              {manageUrl && (
                <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4" data-testid="block-manage-link">
                  <p className="text-sm text-foreground">
                    Need to change something?{" "}
                    <a href={manageUrl} className="font-semibold text-primary underline underline-offset-2 hover:opacity-80" data-testid="link-manage-booking">
                      Manage your booking
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contactEmail
                      ? `We also emailed this link to ${contactEmail} so you can reschedule or cancel any time.`
                      : "Save this link — it's your key to reschedule or cancel without calling."}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 space-y-1.5 text-[13px]">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Booking Details</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                {!isCustomQuote && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium text-foreground">{typeLabel}{category === "residential" ? ` · ${freqLabel[frequency]}` : ""}</span></div>}
                {contactName && <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{contactName}</span></div>}
                {contactAddress && <div className="flex justify-between gap-3"><span className="text-muted-foreground flex-shrink-0">Address</span><span className="font-medium text-foreground text-right">{contactAddress}</span></div>}
                {addressDistance && <div className="flex justify-between"><span className="text-muted-foreground">Distance</span><span className="font-medium text-foreground">{addressDistance} miles</span></div>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a href={companyInfo.contact.phoneHref}>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border text-sm min-h-[48px]">
                    <Phone className="w-4 h-4 mr-1.5" /> Call Us
                  </Button>
                </a>
                <a href={companyInfo.contact.smsHref}>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border text-sm min-h-[48px]">
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Text Us
                  </Button>
                </a>
              </div>

              <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 text-center" onClick={resetForm}>
                Start a new estimate
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
