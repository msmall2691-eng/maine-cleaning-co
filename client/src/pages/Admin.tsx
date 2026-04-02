import { useState } from "react";
import { Shield, Activity, Users, FileText, ChevronDown, ChevronUp, Search, RefreshCw, Download, Archive, Phone, Mail, MessageSquare } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QuoteLead } from "@shared/schema";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusColor(status: string) {
  switch (status) {
    case "New": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "Reviewed": return "bg-muted text-muted-foreground border-border";
    case "Booked": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "Transferred": return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

const statusFilters = ["All", "New", "Reviewed", "Booked", "Transferred"] as const;
const PAGE_SIZE = 50;

export default function Admin() {
  useSEO({ title: "Admin Dashboard", description: "Admin management dashboard for The Maine Cleaning Co." });
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const [loginError, setLoginError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || "Login failed");
        return;
      }
      if (data.role !== "admin") {
        setLoginError("Admin access required");
        await fetch("/api/auth/logout", { method: "POST" });
        return;
      }
      setAuth(true);
    } catch {
      setLoginError("Login failed. Please try again.");
    }
  };

  const { data, isLoading } = useQuery<{ leads: QuoteLead[]; total: number }>({
    queryKey: ["/api/quotes", activeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== "All") params.set("status", activeFilter);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));
      const res = await fetch(`/api/quotes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: auth,
    refetchInterval: 30000,
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const allLeadsQuery = useQuery<{ leads: QuoteLead[]; total: number }>({
    queryKey: ["/api/quotes", "counts"],
    queryFn: async () => {
      const res = await fetch("/api/quotes?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: auth,
    refetchInterval: 30000,
  });

  const allLeads = allLeadsQuery.data?.leads ?? [];
  const counts: Record<string, number> = {
    All: allLeadsQuery.data?.total ?? 0,
    New: allLeads.filter(l => l.status === "New").length,
    Reviewed: allLeads.filter(l => l.status === "Reviewed").length,
    Booked: allLeads.filter(l => l.status === "Booked").length,
    Transferred: allLeads.filter(l => l.status === "Transferred").length,
  };

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/quotes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to archive");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
  });

  const exportCSV = () => {
    const rows = allLeads.map(l => ({
      ID: `QT-${l.id}`,
      Date: formatDate(l.createdAt as unknown as string),
      Name: l.name || "",
      Email: l.email || "",
      Phone: l.phone || "",
      Service: l.serviceType === "standard" ? "Standard Clean" : "Deep Reset",
      SqFt: l.sqft,
      Bathrooms: l.bathrooms,
      Frequency: l.frequency,
      PetHair: l.petHair,
      Condition: l.condition,
      ZIP: (l as any).zip || "",
      EstimateMin: l.estimateMin,
      EstimateMax: l.estimateMax,
      Status: l.status,
      Notes: l.notes || "",
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maine-cleaning-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter((lead) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (lead.name?.toLowerCase().includes(s)) ||
      (lead.email?.toLowerCase().includes(s)) ||
      (lead.phone?.includes(s)) ||
      lead.serviceType.toLowerCase().includes(s) ||
      lead.status.toLowerCase().includes(s) ||
      String(lead.id).includes(s)
    );
  });

  if (!auth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-secondary/30">
        <div className="max-w-md w-full bg-card p-10 rounded-3xl border border-border shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-center mb-3 text-foreground" data-testid="text-admin-title">Partner Portal</h1>
          <p className="text-muted-foreground text-center mb-10 text-sm">Secure access for administrative operations.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="admin@maine-clean.co"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-secondary/50 focus:bg-card transition-colors"
                data-testid="input-admin-email"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-border bg-secondary/50 focus:bg-card transition-colors"
                data-testid="input-admin-password"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-400 text-center" data-testid="text-admin-error">{loginError}</p>
            )}
            <Button type="submit" className="w-full h-12 text-base rounded-xl shadow-md" data-testid="button-admin-login">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const newCount = counts.New;
  const bookedCount = counts.Booked;
  const conversionRate = counts.All > 0 ? Math.round((bookedCount / counts.All) * 100) : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-24 sm:py-32 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground" data-testid="text-dashboard-title">Management Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Overview of quoting activity and leads. Transfer leads to Jobber manually.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-300 px-3 sm:px-4 py-2 rounded-full border border-emerald-500/30 text-xs sm:text-sm font-medium shadow-sm">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
            </span>
            Online
          </div>
          <Button variant="outline" size="icon" className="rounded-full w-9 h-9 sm:w-10 sm:h-10 border-border" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/quotes"] })} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full w-9 h-9 sm:w-10 sm:h-10 border-border" onClick={exportCSV} data-testid="button-export" title="Export CSV">
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-10">
        {[
          { label: "Total Quotes", value: String(counts.All), icon: FileText, change: "All time" },
          { label: "New Leads", value: String(newCount), icon: Users, change: newCount > 0 ? "Requires attention" : "All caught up" },
          { label: "Conversion", value: `${conversionRate}%`, icon: Activity, change: `${bookedCount} booked` },
        ].map((stat, i) => (
          <div key={i} className="bg-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow" data-testid={`card-stat-${i}`}>
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-primary/5 rounded-bl-full -z-10" />
            <div className="flex justify-between items-start mb-3 sm:mb-6">
              <div className="p-2 sm:p-3 bg-secondary rounded-xl sm:rounded-2xl">
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-foreground">{stat.value}</div>
            <div className="text-xs sm:text-base font-semibold text-foreground">{stat.label}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-sm">
        <div className="p-4 sm:p-6 md:p-8 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold font-serif text-foreground" data-testid="text-leads-title">Quote Leads</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-9 h-9 sm:h-10 rounded-full border-border bg-secondary/50 w-full sm:w-64 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-leads"
              />
            </div>
          </div>

          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setPage(0); }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all min-h-[36px] ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                data-testid={`filter-${f.toLowerCase()}`}
              >
                {f}
                {counts[f] > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                    activeFilter === f ? "bg-card/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {counts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-muted-foreground">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 sm:p-16 text-center text-muted-foreground" data-testid="text-no-leads">
            {total === 0 ? "No quote leads yet. They'll appear here when customers submit estimates." : "No leads match your search."}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/30 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-5 font-medium">ID</th>
                    <th className="p-5 font-medium">Date</th>
                    <th className="p-5 font-medium">Contact</th>
                    <th className="p-5 font-medium">Service</th>
                    <th className="p-5 font-medium">Details</th>
                    <th className="p-5 font-medium">Estimate</th>
                    <th className="p-5 font-medium">Status</th>
                    <th className="p-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((lead) => (
                    <>
                      <tr
                        key={lead.id}
                        className="hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                        data-testid={`row-lead-${lead.id}`}
                      >
                        <td className="p-5 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedId === lead.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            QT-{lead.id}
                          </div>
                        </td>
                        <td className="p-5 text-muted-foreground">{formatDate(lead.createdAt as unknown as string)}</td>
                        <td className="p-5">
                          <div className="font-medium text-foreground">{lead.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{lead.email || lead.phone || "No contact info"}</div>
                        </td>
                        <td className="p-5 font-medium capitalize">{lead.serviceType === "standard" ? "Standard Clean" : "Deep Reset"}</td>
                        <td className="p-5 text-muted-foreground text-xs">
                          <div>{lead.sqft.toLocaleString()} sq ft · {lead.bathrooms} bath</div>
                          <div className="capitalize">{lead.frequency} · {lead.petHair} pets · {lead.condition}</div>
                        </td>
                        <td className="p-5 font-semibold text-foreground">${lead.estimateMin}–${lead.estimateMax}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColor(lead.status)}`} data-testid={`status-lead-${lead.id}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.status === "New" && (
                              <Button variant="ghost" size="sm" className="rounded-full text-primary hover:text-primary hover:bg-primary/5 text-xs" onClick={() => statusMutation.mutate({ id: lead.id, status: "Reviewed" })} data-testid={`button-review-${lead.id}`}>
                                Reviewed
                              </Button>
                            )}
                            {(lead.status === "New" || lead.status === "Reviewed") && (
                              <Button variant="ghost" size="sm" className="rounded-full text-emerald-300 hover:text-emerald-300 hover:bg-emerald-500/15 text-xs" onClick={() => statusMutation.mutate({ id: lead.id, status: "Transferred" })} data-testid={`button-transfer-${lead.id}`}>
                                Transferred
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/15" onClick={() => archiveMutation.mutate(lead.id)} data-testid={`button-archive-${lead.id}`} title="Archive">
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === lead.id && (
                        <tr key={`${lead.id}-detail`} className="bg-secondary/10">
                          <td colSpan={8} className="px-5 py-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contact</div>
                                {lead.name && <div className="font-medium">{lead.name}</div>}
                                {lead.email && (
                                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center gap-1 text-xs mt-0.5">
                                    <Mail className="w-3 h-3" /> {lead.email}
                                  </a>
                                )}
                                {lead.phone && (
                                  <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex items-center gap-1 text-xs mt-0.5">
                                    <Phone className="w-3 h-3" /> {lead.phone}
                                  </a>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Details</div>
                                <div className="text-xs space-y-0.5">
                                  <div>{lead.sqft.toLocaleString()} sq ft · {lead.bathrooms} bathroom{lead.bathrooms > 1 ? "s" : ""}</div>
                                  <div className="capitalize">{lead.serviceType === "standard" ? "Standard" : "Deep"} · {lead.frequency} · {lead.petHair} pet hair</div>
                                  <div className="capitalize">Condition: {lead.condition}</div>
                                  {(lead as any).zip && <div>ZIP: {(lead as any).zip}</div>}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Timestamps</div>
                                <div className="text-xs space-y-0.5">
                                  <div>Created: {formatDateTime(lead.createdAt as unknown as string)}</div>
                                  {(lead as any).updatedAt && <div>Updated: {formatDateTime((lead as any).updatedAt as string)}</div>}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</div>
                                <div className="text-xs text-muted-foreground">{lead.notes || "No notes provided."}</div>
                              </div>
                            </div>
                            {(lead as any).address && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Address</div>
                                <div className="text-xs text-foreground">{(lead as any).address}</div>
                              </div>
                            )}
                            {(lead as any).photos && (lead as any).photos.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Property Photos</div>
                                <div className="flex gap-2 flex-wrap">
                                  {((lead as any).photos as string[]).map((photo: string, pi: number) => (
                                    <img key={pi} src={photo} alt={`Property ${pi + 1}`} className="w-24 h-24 rounded-xl object-cover border border-border" data-testid={`admin-photo-${lead.id}-${pi}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((lead) => (
                <div key={lead.id} className="p-4" data-testid={`card-lead-${lead.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-3" onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">QT-{lead.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="font-semibold text-foreground text-sm truncate">{lead.name || "No name"}</div>
                      <div className="text-xs text-muted-foreground">{lead.email || lead.phone || "No contact"}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-foreground">${lead.estimateMin}–${lead.estimateMax}</div>
                      <div className="text-xs text-muted-foreground capitalize">{lead.serviceType === "standard" ? "Standard" : "Deep"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span>{formatDate(lead.createdAt as unknown as string)}</span>
                    <span>·</span>
                    <span>{lead.sqft.toLocaleString()} sqft</span>
                    <span>·</span>
                    <span>{lead.bathrooms} bath</span>
                    <span>·</span>
                    <span className="capitalize">{lead.frequency}</span>
                  </div>

                  {expandedId === lead.id && (
                    <div className="bg-secondary/30 rounded-xl p-3 mb-3 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-semibold text-muted-foreground">Pet Hair:</span> <span className="capitalize">{lead.petHair}</span></div>
                        <div><span className="font-semibold text-muted-foreground">Condition:</span> <span className="capitalize">{lead.condition}</span></div>
                        {(lead as any).zip && <div><span className="font-semibold text-muted-foreground">ZIP:</span> {(lead as any).zip}</div>}
                      </div>
                      {lead.notes && <div><span className="font-semibold text-muted-foreground">Notes:</span> {lead.notes}</div>}
                      <div className="flex gap-2 pt-1">
                        {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-primary"><Phone className="w-3 h-3" /> Call</a>}
                        {lead.phone && <a href={`sms:${lead.phone}`} className="flex items-center gap-1 text-primary"><MessageSquare className="w-3 h-3" /> Text</a>}
                        {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-primary"><Mail className="w-3 h-3" /> Email</a>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {lead.status === "New" && (
                      <Button variant="outline" size="sm" className="rounded-full text-xs h-8 border-border" onClick={() => statusMutation.mutate({ id: lead.id, status: "Reviewed" })} data-testid={`button-review-${lead.id}`}>
                        Mark Reviewed
                      </Button>
                    )}
                    {(lead.status === "New" || lead.status === "Reviewed") && (
                      <Button variant="outline" size="sm" className="rounded-full text-xs h-8 text-emerald-300 border-emerald-700/40 hover:bg-emerald-500/15" onClick={() => statusMutation.mutate({ id: lead.id, status: "Transferred" })} data-testid={`button-transfer-${lead.id}`}>
                        Transferred
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-muted-foreground hover:text-red-400" onClick={() => archiveMutation.mutate(lead.id)} data-testid={`button-archive-${lead.id}`}>
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                    <button onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)} className="text-xs text-muted-foreground hover:text-foreground">
                      {expandedId === lead.id ? "Less" : "More"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 sm:p-6 border-t border-border flex items-center justify-between">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages} ({total} leads)
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full h-8 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full h-8 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
