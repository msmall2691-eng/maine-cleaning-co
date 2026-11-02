import { useState } from "react";
import { CheckCircle2, Mail, Send, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { brand, idealClients } from "@/lib/brand";

/** Loose on purpose — inline typo-catching only. The server's zod .email() is the real validator. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The enquiry form.
 *
 * Posts to the SAME /api/intake/submit the cleaning site uses, with a
 * distinct `source`, so enquiries for the new business land in the existing
 * lead pipeline — stored before they're emailed, retried on failure, swept if
 * they get stuck. There was no reason to build a second, worse one.
 */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [showHint, setShowHint] = useState(false);

  const hasContactMethod = Boolean(form.email.trim() || form.phone.trim());
  const emailInvalid = form.email.trim() !== "" && !EMAIL_RE.test(form.email.trim());
  const phoneInvalid = form.phone.trim() !== "" && form.phone.replace(/\D/g, "").length < 7;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    if (!hasContactMethod || emailInvalid || phoneInvalid) {
      setShowHint(true);
      return;
    }
    setShowHint(false);
    setStatus("sending");
    try {
      // The business name is folded into the notes rather than added as a new
      // column: the intake schema is shared with the demo and a migration for
      // one extra free-text field isn't worth it.
      const notes = form.business.trim()
        ? `[${form.business.trim()}]\n\n${form.message}`
        : form.message;
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          notes,
          source: "studio_contact",
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", business: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="card-soft p-8 text-center" data-testid="contact-sent">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
        <p className="type-h3 text-foreground mb-2">Got it.</p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          I'll come back to you personally — usually within a day or two, from a real address,
          with a real answer about whether this is worth doing for your business.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => setStatus("idle")}>
          Send another
        </Button>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  return (
    <form onSubmit={submit} className="card-soft p-6 sm:p-8 space-y-5" data-testid="contact-form">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="c-name" className="block text-sm font-medium text-foreground mb-1.5">Your name *</label>
          <input id="c-name" type="text" required autoComplete="name" className={field} placeholder="Your name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="c-business" className="block text-sm font-medium text-foreground mb-1.5">Business name</label>
          <input id="c-business" type="text" autoComplete="organization" className={field} placeholder="What it's called"
            value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="c-email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input id="c-email" type="email" autoComplete="email" inputMode="email" className={field} placeholder="you@example.com"
            aria-invalid={emailInvalid || undefined}
            aria-describedby={emailInvalid ? "c-email-err" : undefined}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {emailInvalid && (
            <p id="c-email-err" role="alert" className="text-xs text-destructive mt-1.5">That email doesn't look right.</p>
          )}
        </div>
        <div>
          <label htmlFor="c-phone" className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
          <input id="c-phone" type="tel" autoComplete="tel" inputMode="tel" className={field} placeholder="Optional"
            aria-invalid={phoneInvalid || undefined}
            aria-describedby={phoneInvalid ? "c-phone-err" : undefined}
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {phoneInvalid && (
            <p id="c-phone-err" role="alert" className="text-xs text-destructive mt-1.5">That number looks incomplete.</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="c-message" className="block text-sm font-medium text-foreground mb-1.5">
          What does the business do, and what's costing you the most time? *
        </label>
        <textarea id="c-message" required rows={5} className={field}
          placeholder="Even a couple of sentences is enough to work out whether this is a fit."
          value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>

      {showHint && (
        <p role="alert" className="text-sm text-destructive">
          Leave an email or a phone number, otherwise there's no way to reply.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          That didn't send. Email me directly at{" "}
          <a href={brand.contact.emailHref} className="underline font-medium">{brand.contact.email}</a>.
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full h-12 px-7 font-semibold gap-2"
        data-testid="button-contact-submit"
      >
        <Send className="w-4 h-4" /> {status === "sending" ? "Sending…" : "Send it"}
      </Button>
    </form>
  );
}

export default function Contact() {
  useSEO(STATIC_PAGE_SEO["/contact"]);

  return (
    <div className="w-full clip-x">
      <PageHero
        eyebrow="Book a call"
        title={
          <>
            An hour, free, and a <span className="heading-accent">straight answer.</span>
          </>
        }
        lead="Tell me what the business does and where the time goes. If this isn't worth building for you, I'll say so on the call rather than sell you something."
      />

      <Section measure="wide" rhythm="tight">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-10 lg:gap-14 items-start">
          <ContactForm />

          <div className="lg:sticky lg:top-28 space-y-4">
            <div className="card-soft p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">A real reply</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                From me, not an autoresponder and not a sales sequence — usually within a day or
                two. If I can't help, I'll tell you that too.
              </p>
            </div>

            <div className="card-soft p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Or just email</h3>
              </div>
              <a
                href={brand.contact.emailHref}
                className="text-sm text-primary font-medium hover:underline break-all"
                data-testid="link-contact-email"
              >
                {brand.contact.email}
              </a>
            </div>

            <div className="card-soft p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Play className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Look before you call</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The full system that ran {brand.operator.priorBusiness} is online as a demo.
              </p>
              <a href={brand.demoPath} data-testid="link-contact-demo" rel="nofollow">
                <Button variant="outline" className="rounded-full h-10 px-5 text-sm font-semibold w-full">
                  Open the demo
                </Button>
              </a>
            </div>

            <div className="card-soft p-6">
              <h3 className="type-eyebrow mb-4">Usually a fit for</h3>
              <div className="flex flex-wrap gap-2">
                {idealClients.map((c) => (
                  <span key={c} className="text-xs font-medium text-muted-foreground bg-muted/60 border border-border rounded-full px-3 py-1">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
