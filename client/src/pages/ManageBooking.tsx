import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  MessageSquare,
  ClipboardCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";
import { companyInfo } from "@/lib/company-info";

/**
 * /booking/manage/:token — customer self-service booking management.
 *
 * The token in the URL is the capability: an unguessable UUID minted by
 * /api/booking/submit and emailed to the customer. No login required —
 * which is also why the server's summary endpoint never echoes email or
 * phone back (a forwarded link should leak as little as possible).
 */

interface BookingSummary {
  id: number;
  name: string | null;
  serviceType: string;
  requestedDate: string; // YYYY-MM-DD
  address: string | null;
  status: string;
  bedrooms: number | null;
  entryMethod: string | null;
  parkingNotes: string | null;
  petsDetail: string | null;
  focusAreas: string | null;
  specialInstructions: string | null;
  arrivalWindow: string | null;
  estimateMin: number | null;
  estimateMax: number | null;
}

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard Clean",
  deep: "Deep Clean",
  str: "Vacation Rental Turnover",
  "vacation-rental": "Vacation Rental Turnover",
  commercial: "Commercial Cleaning",
  "move-in-out": "Move-In/Move-Out Clean",
};

// Statuses the customer can no longer edit from this page. Mirrors the
// server's TERMINAL_BOOKING_STATUSES — the server is the enforcer, this
// just spares the customer a 409.
const TERMINAL_STATUSES = new Set(["cancelled", "rejected", "completed"]);

// Same entry options the booking step of InstantEstimate offers.
const ENTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "owner-home", label: "I'll be home" },
  { value: "lockbox", label: "Lockbox" },
  { value: "hidden-key", label: "Hidden key" },
  { value: "gate-code", label: "Gate / door code" },
  { value: "other", label: "Other" },
];

// Canonical arrival-window values + display labels — shared contract with
// the server + Bright-Space (mirrors InstantEstimate's booking step).
const ARRIVAL_WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12–4pm)" },
  { value: "evening", label: "Evening (4–7pm)" },
  { value: "flexible", label: "Flexible / any time" },
];
const ARRIVAL_WINDOW_LABELS: Record<string, string> = Object.fromEntries(
  ARRIVAL_WINDOW_OPTIONS.map((o) => [o.value, o.label]),
);

function formatDate(yyyyMmDd: string): string {
  // Local-noon parse — same previous-day-drift guard the rest of the app uses.
  const d = new Date(`${yyyyMmDd}T12:00:00`);
  return isNaN(d.getTime())
    ? yyyyMmDd
    : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function ManageBooking() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { toast } = useToast();

  useSEO({
    title: "Manage Your Booking · The Maine Cleaning Co.",
    description: "Reschedule, update details, or cancel your cleaning booking.",
  });

  const {
    data: booking,
    isLoading,
    error,
    refetch,
  } = useQuery<BookingSummary>({
    queryKey: ["/api/booking/manage", token],
    queryFn: async () => {
      const res = await fetch(`/api/booking/manage/${token}`);
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    retry: false,
  });

  // Editable fields, seeded from the fetched booking.
  const [requestedDate, setRequestedDate] = useState("");
  const [entryMethod, setEntryMethod] = useState("owner-home");
  const [arrivalWindow, setArrivalWindow] = useState("flexible");
  const [parkingNotes, setParkingNotes] = useState("");
  const [petsDetail, setPetsDetail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [saved, setSaved] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setRequestedDate(booking.requestedDate || "");
    setEntryMethod(booking.entryMethod || "owner-home");
    setArrivalWindow(booking.arrivalWindow || "flexible");
    setParkingNotes(booking.parkingNotes || "");
    setPetsDetail(booking.petsDetail || "");
    setSpecialInstructions(booking.specialInstructions || "");
    setBedrooms(booking.bedrooms ?? "");
  }, [booking]);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Same lead-time rule the server enforces — catch it inline instead of
  // bouncing the customer off a 400. ISO strings compare lexically.
  const dateTooSoon = requestedDate !== "" && requestedDate < minDate;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/booking/manage/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedDate: requestedDate || undefined,
          entryMethod,
          arrivalWindow,
          parkingNotes: parkingNotes.trim() || null,
          petsDetail: petsDetail.trim() || null,
          specialInstructions: specialInstructions.trim() || null,
          bedrooms: bedrooms === "" ? null : bedrooms,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to save changes");
      return json;
    },
    onSuccess: () => {
      setSaved(true);
      refetch();
      toast({ title: "Changes saved!", description: "We've updated your booking." });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't save", description: err.message || "Please try again or call us.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/booking/manage/${token}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to cancel");
      return json;
    },
    onSuccess: () => {
      setConfirmingCancel(false);
      refetch();
      toast({ title: "Booking cancelled", description: "We hope to see you another time." });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't cancel", description: err.message || "Please try again or call us.", variant: "destructive" });
    },
  });

  const notFound = error instanceof Error && error.message === "not-found";
  const isTerminal = booking ? TERMINAL_STATUSES.has(booking.status) : false;

  return (
    <div className="min-h-screen bg-background">
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          <ClipboardCheck className="w-3.5 h-3.5" /> Your Booking
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-6">
          Manage Your Booking
        </h1>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-10" data-testid="manage-loading">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading your booking…
          </div>
        )}

        {(notFound || (error && !notFound)) && !isLoading && (
          <div className="bg-card border border-border/60 rounded-2xl p-8 text-center" data-testid="manage-not-found">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              {notFound ? "We couldn't find that booking" : "Something went wrong"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {notFound
                ? "The link may be incomplete or out of date. Call or text us and we'll sort it out."
                : "Please try again in a moment, or reach us directly."}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-6 max-w-xs mx-auto">
              <a href={companyInfo.contact.phoneHref}>
                <Button variant="outline" className="w-full h-11 rounded-xl text-sm">
                  <Phone className="w-4 h-4 mr-1.5" /> Call Us
                </Button>
              </a>
              <a href={companyInfo.contact.smsHref}>
                <Button variant="outline" className="w-full h-11 rounded-xl text-sm">
                  <MessageSquare className="w-4 h-4 mr-1.5" /> Text Us
                </Button>
              </a>
            </div>
          </div>
        )}

        {booking && (
          <div className="space-y-5">
            {/* ── Summary ── */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6" data-testid="manage-summary">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booking BK-{booking.id}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {SERVICE_LABELS[booking.serviceType] || booking.serviceType}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border capitalize ${
                    booking.status === "cancelled"
                      ? "bg-red-500/10 border-red-500/25 text-red-400"
                      : booking.status === "approved"
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                        : "bg-blue-500/10 border-blue-500/25 text-blue-400"
                  }`}
                  data-testid="manage-status"
                >
                  {booking.status}
                </span>
              </div>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground text-right">{formatDate(booking.requestedDate)}</span>
                </div>
                {booking.name && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-foreground text-right">{booking.name}</span>
                  </div>
                )}
                {booking.address && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground flex-shrink-0">Address</span>
                    <span className="font-medium text-foreground text-right">{booking.address}</span>
                  </div>
                )}
                {booking.estimateMin != null && booking.estimateMax != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Estimate</span>
                    <span className="font-medium text-foreground text-right">${booking.estimateMin} – ${booking.estimateMax}</span>
                  </div>
                )}
                {booking.arrivalWindow && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Arrival window</span>
                    <span className="font-medium text-foreground text-right">{ARRIVAL_WINDOW_LABELS[booking.arrivalWindow] || booking.arrivalWindow}</span>
                  </div>
                )}
                {booking.focusAreas && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Focus areas</span>
                    <span className="font-medium text-foreground text-right capitalize">{booking.focusAreas}</span>
                  </div>
                )}
              </div>
            </div>

            {isTerminal ? (
              /* ── Terminal state: no edits, point at the phone ── */
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center" data-testid="manage-terminal">
                <XCircle className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
                <p className="text-base font-semibold text-foreground mb-1.5">
                  {booking.status === "cancelled" ? "This booking has been cancelled" : "This booking can no longer be changed online"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Want to rebook or ask a question? Call or text us at the number below — we'd love to have you back.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-5 max-w-xs mx-auto">
                  <a href={companyInfo.contact.phoneHref}>
                    <Button variant="outline" className="w-full h-11 rounded-xl text-sm">
                      <Phone className="w-4 h-4 mr-1.5" /> Call Us
                    </Button>
                  </a>
                  <a href={companyInfo.contact.smsHref}>
                    <Button variant="outline" className="w-full h-11 rounded-xl text-sm">
                      <MessageSquare className="w-4 h-4 mr-1.5" /> Text Us
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* ── Edit form ── */}
                <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 space-y-4" data-testid="manage-edit-form">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Update your booking
                  </h2>

                  {saved && !saveMutation.isPending && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20" data-testid="manage-saved">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-400">
                        Changes saved! We'll confirm any date change by call or text within 1 business day.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Preferred date</label>
                      <input
                        type="date"
                        min={minDate}
                        value={requestedDate}
                        onChange={(e) => { setRequestedDate(e.target.value); setSaved(false); }}
                        className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        data-testid="manage-input-date"
                      />
                      {dateTooSoon && (
                        <p className="text-[11px] text-destructive mt-1" data-testid="manage-error-date">
                          Pick a date from tomorrow forward — for same-day, give us a call.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bedrooms</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={1}
                        value={bedrooms}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBedrooms(v === "" ? "" : Math.max(0, Math.min(20, parseInt(v, 10) || 0)));
                          setSaved(false);
                        }}
                        className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        data-testid="manage-input-bedrooms"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">How will we get in?</label>
                    <select
                      value={entryMethod}
                      onChange={(e) => { setEntryMethod(e.target.value); setSaved(false); }}
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      data-testid="manage-select-entry"
                    >
                      {ENTRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Preferred arrival time</label>
                    <select
                      value={arrivalWindow}
                      onChange={(e) => { setArrivalWindow(e.target.value); setSaved(false); }}
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      data-testid="manage-select-arrival"
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
                      onChange={(e) => { setParkingNotes(e.target.value); setSaved(false); }}
                      placeholder="Driveway, street parking, stairs to unit…"
                      className="h-11"
                      data-testid="manage-input-parking"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Pets on site <span className="text-muted-foreground/70">(optional)</span>
                    </label>
                    <Input
                      value={petsDetail}
                      onChange={(e) => { setPetsDetail(e.target.value); setSaved(false); }}
                      placeholder="e.g. Friendly golden retriever, cat hides upstairs"
                      className="h-11"
                      data-testid="manage-input-pets"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Anything else we should know? <span className="text-muted-foreground/70">(optional)</span>
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => { setSpecialInstructions(e.target.value); setSaved(false); }}
                      placeholder="Allergies, fragile items, alarm code, product preferences…"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      data-testid="manage-input-instructions"
                    />
                  </div>

                  <Button
                    className="w-full h-[48px] rounded-xl text-base font-bold shadow-md"
                    disabled={saveMutation.isPending || !requestedDate || dateTooSoon}
                    onClick={() => saveMutation.mutate()}
                    data-testid="manage-button-save"
                  >
                    {saveMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</>
                      : <><CheckCircle2 className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </div>

                {/* ── Cancel ── */}
                <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6" data-testid="manage-cancel-block">
                  {!confirmingCancel ? (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setConfirmingCancel(true)}
                      data-testid="manage-button-cancel"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Cancel this booking
                    </Button>
                  ) : (
                    <div className="space-y-3" data-testid="manage-cancel-confirm">
                      <p className="text-sm text-foreground font-medium text-center">
                        Cancel your {formatDate(booking.requestedDate)} cleaning?
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        This can't be undone online — you'd need to call or text us to rebook.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl text-sm"
                          onClick={() => setConfirmingCancel(false)}
                          disabled={cancelMutation.isPending}
                          data-testid="manage-button-keep"
                        >
                          Keep my booking
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-11 rounded-xl text-sm"
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          data-testid="manage-button-cancel-confirm"
                        >
                          {cancelMutation.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Cancelling…</>
                            : "Yes, cancel it"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Contact footer ── */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Questions? Call or text us at{" "}
              <a href={companyInfo.contact.phoneHref} className="font-semibold text-foreground underline underline-offset-2">
                {companyInfo.contact.phoneDisplay}
              </a>
              .
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
