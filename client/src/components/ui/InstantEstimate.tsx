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

type ServiceCategory = "residential" | "deep-clean" | "str" | "commercial";
type Frequency = "weekly" | "biweekly" | "monthly" | "one-time";
type HomeCondition = "maintenance" | "moderate" | "heavy";
type PetHair = "none" | "some" | "heavy";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function Seg<T extends string>({
  options,
  value,
  onChange,
  id,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="flex rounded-xl bg-muted/60 p-1 gap-0.5 w-full overflow-hidden">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          data-testid={`${id}-${o.id}`}
          className={`flex-1 py-2 px-1 rounded-lg text-[13px] sm:text-sm font-medium transition-all text-center leading-snug min-h-[44px] flex items-center justify-center ${
            value === o.id
              ? "bg-card text-foreground shadow-md ring-1 ring-primary/30 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
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
          return {
            display: (r.display_name?.split(", United States")[0] || r.display_name).trim(),
            street: houseNum
              ? `${houseNum} ${r.address.road || ""}`.trim()
              : r.display_name.split(",")[0].trim(),
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
  { id: "residential", label: "Residential", sub: "Weekly · Biweekly · Monthly", icon: Home, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "deep-clean", label: "Deep Clean", sub: "Top-to-bottom refresh", icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "str", label: "Vacation Rental", sub: "Airbnb & STR turnovers", icon: Waves, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { id: "commercial", label: "Commercial", sub: "Offices & businesses", icon: Building2, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
];

export function InstantEstimate() {
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<ServiceCategory>("residential");
  const [sqft, setSqft] = useState([2000]);
  const [frequency, setFrequency] = useState<Frequency>("biweekly");
  const [petHair, setPetHair] = useState<PetHair>("none");
  const [condition, setCondition] = useState<HomeCondition>("maintenance");
  const [bathrooms, setBathrooms] = useState(2);
  const [zip, setZip] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [portalCreated, setPortalCreated] = useState(false);
  const [portalLoggedIn, setPortalLoggedIn] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [bookingDate, setBookingDate] = useState("");
  const [addressEligible, setAddressEligible] = useState<boolean | null>(null);
  const [addressDistance, setAddressDistance] = useState<number | null>(null);
  const [addressCheckMsg, setAddressCheckMsg] = useState("");
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const { toast } = useToast();

  const isCustomQuote = category === "str" || category === "commercial";
  const cleanType = category === "deep-clean" ? "deep" : "standard";

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

  const engine = useMemo(() => {
    if (isCustomQuote) return { min: 0, max: 0, labor: 0, deep: 1 };

    const RATE = 60; // $ per labor-unit
    const minJob = cleanType === "standard" ? 130 : 225;
    const sf = sqft[0];

    // Piecewise sqft → labor units (three-tier, decreasing marginal rate)
    //   ≤1500 sqft:  steep (small homes priced higher per sqft)
    //   1500–3000:   medium
    //   3000+:       flatter (large homes, slower marginal cost)
    const sqftUnits =
      sf <= 1500
        ? sf / 680
        : sf <= 3000
          ? 1500 / 680 + (sf - 1500) / 1050
          : 1500 / 680 + 1500 / 1050 + (sf - 3000) / 1400;

    // Bathroom adj — supports half-baths in 0.5 steps; each increment = 0.40 units
    const bathAdj = Math.max(0, (bathrooms - 1) * 0.40);

    // Condition & pet addons
    const condUnits: Record<HomeCondition, number> = { maintenance: 0, moderate: 0.50, heavy: 1.00 };
    const petUnits: Record<PetHair, number>        = { none: 0, some: 0.30, heavy: 0.60 };

    // Deep-clean multiplier — scales up with home size (more complexity in larger spaces)
    const deepMult =
      cleanType === "deep"
        ? sf <= 1200 ? 1.60 : sf <= 2000 ? 1.65 : sf <= 3000 ? 1.75 : 1.80
        : 1.0;

    const labor = (sqftUnits + bathAdj + condUnits[condition] + petUnits[petHair]) * deepMult;

    const freqMap: Record<Frequency, number> = { weekly: 0.85, biweekly: 1.0, monthly: 1.15, "one-time": 1.50 };
    const raw     = labor * freqMap[frequency] * RATE;
    const rounded = Math.round(raw / 5) * 5;
    const final   = Math.max(minJob, rounded);

    return {
      min:  Math.round((final * 0.96) / 5) * 5,
      max:  Math.round((final * 1.04) / 5) * 5,
      labor,
      deep: deepMult,
    };
  }, [bathrooms, condition, frequency, petHair, sqft, cleanType, isCustomQuote]);

  const freqLabel: Record<Frequency, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };
  const typeLabel = cleanType === "standard" ? "Standard" : "Deep Clean";

  const submit = useMutation({
    mutationFn: async () => {
      const serviceTypeMap: Record<ServiceCategory, string> = {
        residential: "standard",
        "deep-clean": "deep",
        str: "str",
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
          bathrooms: isCustomQuote ? undefined : Math.round(bathrooms),
          estimateMin: engine.min || undefined,
          estimateMax: engine.max || undefined,
          name: contactName || null,
          email: contactEmail || null,
          phone: contactPhone || null,
          notes: contactNotes || null,
          zip: zip || null,
          address: contactAddress || null,
          photos: photos.length > 0 ? photos : undefined,
          source: "website_form",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      return json;
    },
    onSuccess: (data) => {
      setStep(3);
      if (data?.portalCreated) setPortalCreated(true);
      if (data?.existingAccount) setExistingAccount(true);
      if (data?.emailSent === false) setEmailSent(false);
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
          bathrooms: isCustomQuote ? null : Math.round(bathrooms),
          petHair: isCustomQuote ? null : petHair,
          condition: isCustomQuote ? null : condition,
          estimateMin: engine.min || null,
          estimateMax: engine.max || null,
          requestedDate: bookingDate,
          distanceMiles: addressDistance,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      return json;
    },
    onSuccess: () => {
      setBookingSubmitted(true);
      setStep(4);
      toast({ title: "Booking request sent!", description: "We'll confirm within 1 business day." });
    },
    onError: (err: Error) => {
      toast({ title: "Booking failed", description: err.message || "Please try again or call us.", variant: "destructive" });
    },
  });

  const checkAddressEligibility = useCallback(async (address: string) => {
    if (address.length < 10) return;
    setCheckingAddress(true);
    try {
      const res = await fetch("/api/booking/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      setAddressEligible(data.eligible);
      setAddressDistance(data.distanceMiles ?? null);
      setAddressCheckMsg(data.message || "");
    } catch {
      setAddressEligible(null);
      setAddressCheckMsg("");
    } finally {
      setCheckingAddress(false);
    }
  }, []);

  const minBookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);

  const resetForm = () => {
    setStep(1);
    setPortalCreated(false);
    setPortalLoggedIn(false);
    setExistingAccount(false);
    setEmailSent(true);
    setBookingDate("");
    setAddressEligible(null);
    setAddressDistance(null);
    setAddressCheckMsg("");
    setBookingSubmitted(false);
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactNotes("");
    setContactAddress("");
    setPhotos([]);
    submit.reset();
    bookingMutation.reset();
  };

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-[0_2px_16px_rgba(0,0,0,0.15),0_8px_32px_rgba(0,0,0,0.1)] w-full max-w-full overflow-hidden card-gradient-border" data-testid="card-instant-estimate">
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/50">
        <h3 className="text-lg sm:text-xl font-bold text-foreground" data-testid="text-instant-estimate-title">
          {isCustomQuote ? "Request a Custom Quote" : "Instant Estimate"}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isCustomQuote
            ? `Pricing for ${category === "str" ? "vacation rentals" : "commercial spaces"} varies — we'll get back to you quickly.`
            : "Adjust the details for an instant price range."}
        </p>
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
                  <span className="text-base font-bold text-foreground tabular-nums" data-testid="value-sqft">{sqft[0].toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">sq ft</span></span>
                </div>
                <Slider value={sqft} onValueChange={setSqft} min={500} max={6000} step={100} className="w-full" data-testid="slider-sqft" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground"><span>500</span><span>6,000+</span></div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="label-sm !mb-0">Bathrooms <span className="font-normal text-muted-foreground text-[11px]">(inc. half baths)</span></label>
                  <span className="text-base font-bold text-foreground" data-testid="value-bathrooms">
                    {bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)}½` : bathrooms}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setBathrooms(v => Math.max(1, Math.round((v - 0.5) * 2) / 2))}
                    data-testid="button-bath-minus"
                    aria-label="Fewer bathrooms"
                  >&minus;</button>
                  <div className="flex-1 h-10 rounded-lg bg-muted/40 flex items-center justify-center gap-1">
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].filter(n => n <= 4.5).map(n => {
                      const isHalf = n % 1 === 0.5;
                      const filled = n <= bathrooms;
                      return (
                        <div
                          key={n}
                          className={`transition-colors ${
                            isHalf
                              ? `w-1 h-1 rounded-full ${filled ? "bg-primary/50" : "bg-muted-foreground/15"}`
                              : `w-2 h-2 rounded-full ${filled ? "bg-primary" : "bg-muted-foreground/20"}`
                          }`}
                        />
                      );
                    })}
                    {bathrooms > 4.5 && (
                      <span className="text-xs font-semibold text-primary ml-0.5">{bathrooms % 1 === 0.5 ? `${Math.floor(bathrooms)}½` : bathrooms}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setBathrooms(v => Math.min(6, Math.round((v + 0.5) * 2) / 2))}
                    data-testid="button-bath-plus"
                    aria-label="More bathrooms"
                  >+</button>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-0.5">
                  <span>1</span><span>Full = ●&nbsp;&nbsp;Half = ·</span><span>6</span>
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

              <div className="border-t border-border/30 pt-5 space-y-4">
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
              </div>

              <div>
                <label className="label-sm">ZIP code <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input
                  placeholder="e.g. 04101"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                  className="h-10 rounded-xl border-border bg-card mt-1"
                  data-testid="input-zip"
                  inputMode="numeric"
                />
              </div>

              <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 p-5">
                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5" data-testid="label-range">Estimated range</div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight" data-testid="text-range">
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
                    <span className="text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">
                      {condition === "moderate" ? "Moderate condition" : "Heavy condition"}
                    </span>
                  )}
                  {petHair !== "none" && (
                    <span className="text-[11px] font-medium bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5">
                      {petHair === "some" ? "Some pets" : "Heavy pet hair"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed" data-testid="text-disclaimer">
                  Non-binding estimate. Final price confirmed after review.
                </p>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30" data-testid="text-availability">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-400 leading-relaxed">
                  <span className="font-semibold">Typical availability:</span> 3-7 business days
                </p>
              </div>

              <Button className="w-full h-[52px] rounded-xl text-base font-bold shadow-md group min-h-[48px]" onClick={() => setStep(2)} data-testid="button-review">
                Review & Submit <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 1: Custom Quote (STR / Commercial) ── */}
          {step === 1 && isCustomQuote && (
            <motion.div key="s1-custom" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">

              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Custom pricing required</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    {category === "str"
                      ? "Vacation rental turnovers depend on property size, guest turnover schedule, and same-day flip requirements. We'll send you a tailored quote quickly."
                      : "Commercial cleaning pricing depends on your space, frequency, and specific requirements. We'll follow up with a custom proposal."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="label-sm">Your contact info</p>
                <Input placeholder="Your name *" value={contactName} onChange={e => setContactName(e.target.value)} className="input-field" data-testid="input-name" />
                <Input placeholder="Phone number *" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input-field" data-testid="input-phone" />
                <Input placeholder="Email address" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input-field" data-testid="input-email" />
                <AddressInput value={contactAddress} onChange={setContactAddress} onZipDetected={setZip} />
                <Input
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

              <div>
                <p className="label-sm">Property photos <span className="font-normal text-muted-foreground">(optional, up to 3)</span></p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group" data-testid={`photo-preview-${idx}`}>
                      <img src={photo} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
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
                disabled={submit.isPending || (!contactName && !contactPhone)}
                onClick={() => submit.mutate()}
                data-testid="button-submit-custom"
              >
                {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Send Quote Request</>}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                We typically respond within 1 business day.
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
                <p className="label-sm">Contact info <span className="font-normal text-muted-foreground">(all optional)</span></p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                  <Input placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)} className="input-field !h-11" data-testid="input-name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <Input placeholder="Phone number" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input-field !h-11" data-testid="input-phone" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <Input placeholder="Email address" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input-field !h-11" data-testid="input-email" />
                  <p className="text-[11px] text-muted-foreground mt-1 ml-1">Enter your email to receive a copy of this request.</p>
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
                <Button className="flex-1 h-[52px] text-base rounded-xl shadow-md font-bold" disabled={submit.isPending} onClick={() => submit.mutate()} data-testid="button-submit">
                  {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Submit Request</>}
                </Button>
              </div>
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
                    We'll reach out to <span className="font-medium text-foreground">{contactEmail}</span> within 1 business day.
                  </p>
                ) : contactPhone ? (
                  <p className="text-muted-foreground text-xs mt-1.5">
                    We'll reach out by phone soon.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs mt-1.5">
                    We'll be in touch within 1 business day.
                  </p>
                )}
              </div>

              {/* ── Book a Date Section ── */}
              {!isCustomQuote && contactAddress && contactName && contactPhone && (
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-primary/10 border border-blue-500/25 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h4 className="text-sm font-bold text-foreground">Want to book a date?</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pick your preferred cleaning date below. We'll review and confirm within 1 business day. Must be at least 2 days out and within 30 miles of North Waterboro, ME.
                  </p>

                  {/* Address eligibility check */}
                  {addressEligible === null && !checkingAddress && (
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
                  {addressEligible === true && (
                    <>
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-green-400">{addressCheckMsg}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Preferred date</label>
                        <input
                          type="date"
                          min={minBookingDate}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          data-testid="input-booking-date"
                        />
                      </div>
                      <Button
                        className="w-full h-[52px] rounded-xl text-base font-bold shadow-md"
                        disabled={!bookingDate || bookingMutation.isPending}
                        onClick={() => bookingMutation.mutate()}
                        data-testid="button-book-date"
                      >
                        {bookingMutation.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                          : <><Calendar className="w-4 h-4 mr-2" /> Request This Date</>
                        }
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Requires approval. You'll get a confirmation call/text.
                      </p>
                    </>
                  )}
                  {addressEligible === false && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-400">{addressCheckMsg}</p>
                    </div>
                  )}
                </div>
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

              <div className="rounded-xl bg-muted/40 p-4 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" /> What happens next
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "We'll review your request", desc: "Typically within 1 business day" },
                    { label: "We'll reach out to confirm details", desc: "Via phone, text, or email" },
                    { label: "You'll get a final quote & schedule", desc: "Usually within 3–7 business days" },
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
                      We'll review your request and confirm via phone or text within 1 business day. Once approved, your cleaning will be added to our schedule.
                    </p>
                  </div>
                </div>
              </div>

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
