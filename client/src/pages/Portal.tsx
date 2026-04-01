import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Calendar, ClipboardCheck, CreditCard, LogOut, ChevronRight,
  User, CheckCircle2, Clock, AlertCircle, Home, Loader2, X, MapPin, Save, Bell
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QuoteLead } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleCalendar } from "@/components/ui/ScheduleCalendar";

type OnboardingField = {
  id: string;
  label: string;
  placeholder: string;
  type: "textarea" | "text" | "select" | "date";
  options?: string[];
};

const onboardingFieldsByService: Record<string, OnboardingField[]> = {
  standard: [
    { id: "entry", label: "Entry Instructions", placeholder: "How should we access your home? (e.g., key under mat, garage code, you'll be home)", type: "textarea" },
    { id: "pets", label: "Pet Information", placeholder: "Any pets we should know about? Names, temperament, areas they stay in", type: "textarea" },
    { id: "focus", label: "Focus Areas & Priority Rooms", placeholder: "Any rooms or areas you'd like us to prioritize?", type: "textarea" },
    { id: "products", label: "Cleaning Product Preferences", placeholder: "", type: "select", options: ["I approve eco-friendly products (Melaleuca / Sal Suds)", "I have specific product preferences (please note below)", "No preference — use your best judgment"] },
    { id: "notes", label: "Additional Notes", placeholder: "Anything else we should know before your first cleaning?", type: "textarea" },
  ],
  deep: [
    { id: "entry", label: "Entry Instructions", placeholder: "How should we access your home? (e.g., key under mat, garage code, you'll be home)", type: "textarea" },
    { id: "pets", label: "Pet Information", placeholder: "Any pets we should know about? Names, temperament, areas they stay in", type: "textarea" },
    { id: "focus", label: "Focus Areas & Priority Rooms", placeholder: "Any rooms or areas you'd like extra attention on?", type: "textarea" },
    { id: "products", label: "Cleaning Product Preferences", placeholder: "", type: "select", options: ["I approve eco-friendly products (Melaleuca / Sal Suds)", "I have specific product preferences (please note below)", "No preference — use your best judgment"] },
    { id: "access", label: "Access to All Areas", placeholder: "Please confirm: are all rooms, closets, and appliances accessible for deep cleaning?", type: "textarea" },
    { id: "notes", label: "Additional Notes", placeholder: "Anything else we should know before your deep clean?", type: "textarea" },
  ],
  "vacation-rental": [
    { id: "access", label: "Access Codes / Lockbox Details", placeholder: "Lockbox code, smart lock instructions, or key location", type: "textarea" },
    { id: "linens", label: "Linen & Supply Locations", placeholder: "Where are extra linens, towels, and cleaning supplies stored?", type: "textarea" },
    { id: "staging", label: "Staging Checklist / Reference Photos", placeholder: "Describe how the property should be staged for guests, or note if you'll share reference photos", type: "textarea" },
    { id: "notifications", label: "Turnover Notification Preference", placeholder: "", type: "select", options: ["Text me when complete", "Email me when complete", "Both text and email", "No notification needed"] },
    { id: "supplies", label: "Consumables to Restock", placeholder: "List items we should restock between guests (toilet paper, soap, coffee, etc.)", type: "textarea" },
    { id: "notes", label: "Additional Notes", placeholder: "Any other details for turnover cleanings?", type: "textarea" },
  ],
  "move-in-out": [
    { id: "date", label: "Move Date", placeholder: "When is the move-out or move-in date?", type: "date" },
    { id: "damage", label: "Existing Damage Notes", placeholder: "Any existing damage areas we should be aware of or avoid?", type: "textarea" },
    { id: "keys", label: "Key / Lockbox Details", placeholder: "How do we access the property on cleaning day?", type: "textarea" },
    { id: "utilities", label: "Utilities Status", placeholder: "", type: "select", options: ["Water and electricity are confirmed on", "Not yet — will confirm before cleaning day", "Unsure — please contact me"] },
    { id: "notes", label: "Additional Notes", placeholder: "Anything else we should know about the move-in/out clean?", type: "textarea" },
  ],
  commercial: [
    { id: "access", label: "Building Access & Security Procedures", placeholder: "Access codes, security system info, key pickup details", type: "textarea" },
    { id: "schedule", label: "Preferred Cleaning Schedule", placeholder: "What days and times work best? (e.g., Mon/Wed/Fri after 6 PM)", type: "textarea" },
    { id: "contact", label: "On-Site Point of Contact", placeholder: "Name, phone number, and role of the person we should contact on-site", type: "text" },
    { id: "areas", label: "Restricted Areas or Special Requirements", placeholder: "Any areas we should avoid or handle differently?", type: "textarea" },
    { id: "notes", label: "Additional Notes", placeholder: "Other details about your commercial space?", type: "textarea" },
  ],
};

function getServiceLabel(type: string) {
  const map: Record<string, string> = { standard: "Standard Clean", deep: "Deep Clean", "vacation-rental": "Vacation Rental", "move-in-out": "Move-In/Out", commercial: "Commercial" };
  return map[type] || type;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    New: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Reviewed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Quoted: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    Approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Scheduled: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    Booked: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Transferred: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return colors[status] || "bg-muted/40 text-muted-foreground border-border";
}

type PortalTab = "dashboard" | "quotes" | "onboarding" | "documents" | "schedule" | "payments";

export default function Portal() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<PortalTab>("dashboard");
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [localFormData, setLocalFormData] = useState<Record<string, string>>({});
  const activeQuoteRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/portal/login");
  }, [user, authLoading, navigate]);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<QuoteLead[]>({
    queryKey: ["/api/portal/quotes"],
    enabled: !!user,
  });

  const { data: contractsData = [] } = useQuery<any[]>({
    queryKey: ["/api/portal/contracts"],
    enabled: !!user,
  });

  const { data: scheduleData = [] } = useQuery<any[]>({
    queryKey: ["/api/portal/schedule"],
    enabled: !!user,
  });

  const createCleaningMutation = useMutation({
    mutationFn: async (data: { serviceType: string; scheduledDate: string; preferredTime: string; notes: string }) => {
      const res = await fetch("/api/portal/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/portal/schedule"] }),
  });

  const updateCleaningMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; scheduledDate?: string; preferredTime?: string; notes?: string; status?: string }) => {
      const res = await fetch(`/api/portal/schedule/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/portal/schedule"] }),
  });

  const deleteCleaningMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/portal/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/portal/schedule"] }),
  });

  const { data: paymentsData = [] } = useQuery<any[]>({
    queryKey: ["/api/portal/payments"],
    enabled: !!user,
  });

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
  const onboardingFields = selectedQuote ? (onboardingFieldsByService[selectedQuote.serviceType] || onboardingFieldsByService.standard) : [];

  const { data: onboardingData } = useQuery<{ formResponses: Record<string, string> }>({
    queryKey: ["/api/portal/onboarding", selectedQuoteId],
    queryFn: async () => {
      const res = await fetch(`/api/portal/onboarding/${selectedQuoteId}`);
      return res.json();
    },
    enabled: !!selectedQuoteId && !!user,
  });

  const allOnboardingQueries = useQuery<Record<number, Record<string, string>>>({
    queryKey: ["/api/portal/onboarding/all", quotes.map(q => q.id).join(",")],
    queryFn: async () => {
      const results: Record<number, Record<string, string>> = {};
      await Promise.all(quotes.map(async (q) => {
        const res = await fetch(`/api/portal/onboarding/${q.id}`);
        const data = await res.json();
        results[q.id] = data.formResponses || {};
      }));
      return results;
    },
    enabled: !!user && quotes.length > 0,
  });
  const allOnboarding = allOnboardingQueries.data || {};

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("idle");
    activeQuoteRef.current = selectedQuoteId;
    if (onboardingData?.formResponses) {
      setLocalFormData(onboardingData.formResponses);
    } else {
      setLocalFormData({});
    }
  }, [selectedQuoteId, onboardingData]);

  const onboardingMutation = useMutation({
    mutationFn: async ({ quoteId, responses }: { quoteId: number; responses: Record<string, string> }) => {
      const res = await fetch(`/api/portal/onboarding/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formResponses: responses }),
      });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/onboarding", variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/onboarding/all"] });
      setSaveStatus("saved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const debounceSave = useCallback((updatedData: Record<string, string>) => {
    const capturedQuoteId = activeQuoteRef.current;
    if (!capturedQuoteId) return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onboardingMutation.mutate({ quoteId: capturedQuoteId, responses: updatedData });
    }, 800);
  }, []);

  const updateField = useCallback((fieldId: string, value: string) => {
    setLocalFormData(prev => {
      const updated = { ...prev, [fieldId]: value };
      debounceSave(updated);
      return updated;
    });
  }, [debounceSave]);

  const filledCount = onboardingFields.filter(f => (localFormData[f.id] || "").trim().length > 0).length;
  const totalOnboardingProgress = onboardingFields.length > 0 ? Math.round((filledCount / onboardingFields.length) * 100) : 0;

  function getQuoteOnboardingProgress(q: QuoteLead) {
    const fields = onboardingFieldsByService[q.serviceType] || onboardingFieldsByService.standard;
    const responses = q.id === selectedQuoteId ? localFormData : (allOnboarding[q.id] || {});
    const filled = fields.filter(f => (responses[f.id] || "").trim().length > 0).length;
    return { fields, responses, filled, total: fields.length, percent: fields.length > 0 ? Math.round((filled / fields.length) * 100) : 0 };
  }

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/portal/quotes/${id}/approve`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/quotes"] });
    },
  });

  const [signName, setSignName] = useState("");
  const signMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/portal/contracts/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedName: name }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/contracts"] });
      setSignName("");
    },
  });

  if (authLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  const hasIncompleteOnboarding = quotes.length > 0 && quotes.some(q => getQuoteOnboardingProgress(q).percent < 100);

  const navItems: { id: PortalTab; label: string; icon: any; count?: number; notify?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "quotes", label: "My Quotes", icon: FileText, count: quotes.length },
    { id: "onboarding", label: "Get Started", icon: ClipboardCheck, notify: hasIncompleteOnboarding },
    { id: "documents", label: "Documents", icon: FileText, count: contractsData.length },
    { id: "schedule", label: "Schedule", icon: Calendar, count: scheduleData.length },
    { id: "payments", label: "Payments", icon: CreditCard, count: paymentsData.length },
  ];

  const completedOnboardingQuotes = quotes.filter(q => getQuoteOnboardingProgress(q).percent === 100);

  return (
    <div className="min-h-screen bg-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 py-24 sm:py-28">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <div className="flex items-center gap-3 mb-3 bg-card rounded-2xl border border-border shadow-sm p-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground truncate" data-testid="text-portal-user-name-mobile">{user.name || "Client"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/15 transition-all"
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x snap-mandatory">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start ${
                        tab === item.id ? "bg-primary text-white shadow-sm" : "bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted/40"
                      }`}
                      data-testid={`nav-mobile-${item.id}`}
                    >
                      <div className="relative">
                        <Icon className="w-3.5 h-3.5" />
                        {item.notify && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        )}
                      </div>
                      <span>{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-[9px] font-bold rounded-full px-1 py-0 ${tab === item.id ? "bg-card/20" : "bg-muted"}`}>{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-sm p-5 sticky top-24">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate" data-testid="text-portal-user-name">{user.name || "Client"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        tab === item.id ? "bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      <div className="relative">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.notify && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                      </div>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="text-[10px] font-bold bg-muted rounded-full px-1.5 py-0.5">{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-5 pt-4 border-t border-border">
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/15 transition-all"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {tab === "dashboard" && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground" data-testid="text-portal-welcome">Welcome back, {user.name || "there"}!</h1>
                      <p className="text-muted-foreground text-sm mt-1">Here's an overview of your cleaning services.</p>
                    </div>

                    {hasIncompleteOnboarding && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4"
                        data-testid="banner-onboarding-prompt"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-amber-300 text-sm">Complete your onboarding form</h3>
                          <p className="text-xs text-amber-400 mt-0.5">Please fill out a few details so we can prepare for your first cleaning. It only takes a couple of minutes.</p>
                          <Button
                            size="sm"
                            className="mt-3 rounded-full text-xs bg-amber-600 hover:bg-amber-700"
                            onClick={() => {
                              if (quotes.length === 1) setSelectedQuoteId(quotes[0].id);
                              setTab("onboarding");
                            }}
                            data-testid="button-go-onboarding"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Fill Out Form
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        { label: "Active Quotes", value: quotes.length, icon: FileText, color: "text-blue-400 bg-blue-500/15", onClick: () => setTab("quotes") },
                        { label: "Documents", value: contractsData.length, icon: ClipboardCheck, color: "text-emerald-400 bg-emerald-500/15", onClick: () => setTab("documents") },
                        { label: "Upcoming", value: scheduleData.filter((s: any) => s.status === "upcoming").length, icon: Calendar, color: "text-orange-400 bg-orange-500/15", onClick: () => setTab("schedule") },
                        { label: "Payments", value: paymentsData.length, icon: CreditCard, color: "text-purple-400 bg-purple-500/15", onClick: () => setTab("payments") },
                      ].map((card, i) => {
                        const Icon = card.icon;
                        return (
                          <button key={i} onClick={card.onClick} className="bg-card rounded-2xl border border-border p-4 sm:p-5 text-left hover:shadow-md transition-shadow" data-testid={`card-dashboard-${i}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">{card.label}</div>
                          </button>
                        );
                      })}
                    </div>

                    {quotes.length > 0 && (
                      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-foreground">Recent Quotes</h2>
                          <button onClick={() => setTab("quotes")} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
                        </div>
                        <div className="space-y-2">
                          {quotes.slice(0, 3).map(q => (
                            <div key={q.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => { setSelectedQuoteId(q.id); setTab("quotes"); }}>
                              <div>
                                <div className="text-sm font-medium text-foreground">{getServiceLabel(q.serviceType)}</div>
                                <div className="text-xs text-muted-foreground">{q.sqft.toLocaleString()} sq ft · {q.bathrooms} bath</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-foreground">${q.estimateMin}–${q.estimateMax}</div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(q.status)}`}>{q.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {quotes.length === 0 && (
                      <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-bold text-foreground mb-1">No quotes yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by requesting an estimate on our homepage.</p>
                        <Link href="/#get-estimate"><Button className="rounded-full" data-testid="button-get-estimate">Get an Estimate</Button></Link>
                      </div>
                    )}
                  </div>
                )}

                {tab === "quotes" && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-foreground">My Quotes</h1>
                    {quotesLoading ? (
                      <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                    ) : quotes.length === 0 ? (
                      <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <p className="text-muted-foreground">No quotes found. Submit an estimate request to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quotes.map(q => (
                          <div key={q.id} className="bg-card rounded-2xl border border-border p-5 sm:p-6" data-testid={`portal-quote-${q.id}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground font-medium">QT-{q.id}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(q.status)}`}>{q.status}</span>
                                </div>
                                <h3 className="font-bold text-foreground">{getServiceLabel(q.serviceType)}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {q.sqft.toLocaleString()} sq ft · {q.bathrooms} bath · {q.frequency}
                                </p>
                                {(q as any).address && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {(q as any).address}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-bold text-foreground">${q.estimateMin}–${q.estimateMax}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">Estimated range</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {q.status === "Quoted" && (
                                <Button size="sm" className="rounded-full text-xs" onClick={() => approveMutation.mutate(q.id)} data-testid={`button-approve-${q.id}`}>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Quote
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="rounded-full text-xs border-border" onClick={() => { setSelectedQuoteId(q.id); setTab("onboarding"); }} data-testid={`button-onboard-${q.id}`}>
                                <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Get Started Form
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "onboarding" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">Getting Started</h1>
                        <p className="text-muted-foreground text-sm mt-1">Fill out the details below so we can prepare for your cleaning.</p>
                      </div>
                      {saveStatus !== "idle" && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                          saveStatus === "saving" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
                        }`}>
                          {saveStatus === "saving" ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3" /> Saved</>
                          )}
                        </div>
                      )}
                    </div>

                    {!selectedQuoteId && quotes.length > 0 && (
                      <div className="bg-card rounded-2xl border border-border p-5">
                        <p className="text-sm text-muted-foreground mb-3">Select a quote to fill out its onboarding form:</p>
                        <div className="space-y-2">
                          {quotes.map(q => (
                            <button key={q.id} onClick={() => setSelectedQuoteId(q.id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors text-left">
                              <span className="text-sm font-medium">{getServiceLabel(q.serviceType)} (QT-{q.id})</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedQuoteId && selectedQuote && (
                      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="font-bold text-foreground">{getServiceLabel(selectedQuote.serviceType)} — Onboarding Form</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">QT-{selectedQuote.id} · {filledCount}/{onboardingFields.length} fields completed</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{totalOnboardingProgress}%</div>
                          </div>
                        </div>

                        <div className="w-full bg-muted/40 rounded-full h-2 mb-6">
                          <div className="bg-primary rounded-full h-2 transition-all duration-500" style={{ width: `${totalOnboardingProgress}%` }} />
                        </div>

                        <div className="space-y-5">
                          {onboardingFields.map(field => {
                            const value = localFormData[field.id] || "";
                            const isFilled = value.trim().length > 0;
                            return (
                              <div key={field.id} className="relative" data-testid={`onboarding-field-${field.id}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isFilled ? "bg-emerald-500 text-white" : "border-2 border-muted-foreground/30"}`}>
                                    {isFilled && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </div>
                                  <label className="text-sm font-semibold text-foreground">{field.label}</label>
                                </div>

                                {field.type === "textarea" && (
                                  <textarea
                                    value={value}
                                    onChange={e => updateField(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full min-h-[80px] rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-y"
                                    data-testid={`input-${field.id}`}
                                  />
                                )}

                                {field.type === "text" && (
                                  <Input
                                    value={value}
                                    onChange={e => updateField(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="h-11 rounded-xl border-border bg-muted/10"
                                    data-testid={`input-${field.id}`}
                                  />
                                )}

                                {field.type === "date" && (
                                  <Input
                                    type="date"
                                    value={value}
                                    onChange={e => updateField(field.id, e.target.value)}
                                    className="h-11 rounded-xl border-border bg-muted/10 max-w-xs"
                                    data-testid={`input-${field.id}`}
                                  />
                                )}

                                {field.type === "select" && field.options && (
                                  <select
                                    value={value}
                                    onChange={e => updateField(field.id, e.target.value)}
                                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none"
                                    data-testid={`input-${field.id}`}
                                  >
                                    <option value="">Select an option...</option>
                                    {field.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {totalOnboardingProgress === 100 && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-emerald-500/15 rounded-xl border border-emerald-500/30 text-center"
                          >
                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm font-bold text-emerald-300">All set! Your onboarding form is complete.</p>
                            <p className="text-xs text-emerald-400 mt-1">You can view a summary in your Documents tab.</p>
                          </motion.div>
                        )}

                        {totalOnboardingProgress < 100 && (
                          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Your responses are saved automatically as you type.</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-xs"
                              onClick={() => { if (selectedQuoteId) onboardingMutation.mutate({ quoteId: selectedQuoteId, responses: localFormData }); }}
                              data-testid="button-save-form"
                            >
                              <Save className="w-3.5 h-3.5 mr-1" /> Save Progress
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {quotes.length === 0 && (
                      <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <p className="text-muted-foreground text-sm">Submit a quote request first to see your onboarding form.</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "documents" && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-foreground">Documents & Contracts</h1>

                    {quotes.map(q => {
                      const progress = getQuoteOnboardingProgress(q);
                      const hasAnyData = progress.filled > 0;

                      if (!hasAnyData) return null;

                      return (
                        <div key={`onboarding-doc-${q.id}`} className="bg-card rounded-2xl border border-border p-5 sm:p-6" data-testid={`doc-onboarding-${q.id}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-foreground">Client Onboarding Form</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{getServiceLabel(q.serviceType)} · QT-{q.id}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${progress.percent === 100 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                              {progress.percent === 100 ? "Complete" : "In Progress"}
                            </span>
                          </div>

                          <div className="bg-muted/20 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                            {progress.fields.map(field => {
                              const val = progress.responses[field.id];
                              if (!val || val.trim().length === 0) return null;
                              return (
                                <div key={field.id}>
                                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</p>
                                  <p className="text-sm text-foreground mt-0.5">{val}</p>
                                </div>
                              );
                            })}
                          </div>

                          {progress.percent < 100 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 rounded-full text-xs border-border"
                              onClick={() => { setSelectedQuoteId(q.id); setTab("onboarding"); }}
                            >
                              <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Continue Filling Out
                            </Button>
                          )}
                        </div>
                      );
                    })}

                    {contractsData.length === 0 && completedOnboardingQuotes.length === 0 ? (
                      <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No documents yet. Service agreements will appear here once your quote is approved.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contractsData.map((contract: any) => (
                          <div key={contract.id} className="bg-card rounded-2xl border border-border p-5 sm:p-6" data-testid={`contract-${contract.id}`}>
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-bold text-foreground">{getServiceLabel(contract.serviceType)} Service Agreement</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{contract.frequency} · ${contract.price}/visit</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${contract.status === "signed" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                                {contract.status === "signed" ? "Signed" : "Pending Signature"}
                              </span>
                            </div>

                            <div className="bg-muted/20 rounded-xl p-4 text-xs text-muted-foreground mb-4 space-y-1.5 max-h-32 overflow-y-auto">
                              <p>{contract.terms}</p>
                            </div>

                            {contract.status !== "signed" ? (
                              <div className="space-y-3">
                                <Input
                                  placeholder="Type your full name to sign"
                                  value={signName}
                                  onChange={e => setSignName(e.target.value)}
                                  className="h-10 rounded-xl border-border"
                                  data-testid={`input-sign-${contract.id}`}
                                />
                                <Button
                                  className="w-full rounded-xl"
                                  disabled={!signName || signMutation.isPending}
                                  onClick={() => signMutation.mutate({ id: contract.id, name: signName })}
                                  data-testid={`button-sign-${contract.id}`}
                                >
                                  {signMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                  I Accept — Sign Agreement
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-emerald-300">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Signed by {contract.signedName} on {new Date(contract.signedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "schedule" && (
                  <ScheduleCalendar
                    cleanings={scheduleData}
                    onCreateCleaning={(data) => createCleaningMutation.mutate(data)}
                    onUpdateCleaning={(id, data) => updateCleaningMutation.mutate({ id, ...data })}
                    onDeleteCleaning={(id) => deleteCleaningMutation.mutate(id)}
                    isCreating={createCleaningMutation.isPending}
                    isUpdating={updateCleaningMutation.isPending}
                  />
                )}

                {tab === "payments" && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                    {paymentsData.length === 0 ? (
                      <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No invoices yet. Payment history will appear here once services are completed.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentsData.map((payment: any) => (
                          <div key={payment.id} className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center justify-between" data-testid={`payment-${payment.id}`}>
                            <div>
                              <div className="font-semibold text-sm text-foreground">${(payment.amount / 100).toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                              payment.status === "paid" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                              payment.status === "overdue" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                              "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }`}>{payment.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
