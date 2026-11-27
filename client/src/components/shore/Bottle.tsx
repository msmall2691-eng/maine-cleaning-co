import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { RESPONSE_REPLY } from "@/lib/response-time";

/**
 * The contact form.
 *
 * It was called "Put it in a bottle" until the owner read it back: a message
 * in a bottle is the slowest, least reliable way to send anything, which is
 * the opposite of what the one conversion element on the page should promise.
 * The heading is plain now. The file keeps its name, and the test ids keep
 * theirs, because renaming them would churn the tests for nothing.
 *
 * Where it goes: `POST /api/intake/submit` — the same endpoint the estimator
 * and the old homepage form post to. That means a note sent from here is
 * written to `intake_submissions`, emails the office, forwards to BrightBase
 * Ops through the retry ledger, and shows up in the admin dashboard. A
 * prettier form that quietly landed somewhere else would be the worst thing
 * on this page.
 *
 * The server requires an email OR a phone (see `intakeSubmitSchema`'s
 * refine). This form mirrors that rule inline, before submit, rather than
 * letting someone write a paragraph and then be told by a 422.
 *
 * On success the form is replaced by a confirmation panel AND a live region
 * announces what happened in words, so the confirmation never depends on
 * anything visual.
 */

type Status = "idle" | "sending" | "sent" | "error";

const SERVICE_OPTIONS = [
  { value: "standard", label: "Regular home cleaning" },
  { value: "deep", label: "Deep clean" },
  { value: "vacation-rental", label: "Vacation rental turnover" },
  { value: "commercial", label: "Commercial / office" },
  { value: "move-in-out", label: "Move in or out" },
] as const;

export function Bottle() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const serviceType = String(data.get("serviceType") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();

    if (!email && !phone) {
      setStatus("error");
      setError("Please leave a phone number or an email so we can reply.");
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          email: email || null,
          phone: phone || null,
          serviceType: serviceType || null,
          notes: notes || null,
          source: "website_shoreline_bottle",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message ?? "That didn't send. Please try again, or call us.",
        );
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "That didn't send. Please try again, or call us.",
      );
    }
  }

  const sending = status === "sending";

  return (
    <section
      id="contact"
      className="shore-band band-deep scroll-mt-20 clip-x"
      aria-labelledby="shore-contact-heading"
    >
      <div className="shore-measure grid items-start gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <p className="type-eyebrow !text-deep-accent">Contact</p>
          <h2 id="shore-contact-heading" className="type-h2 mt-4 text-deep-foreground">
            Get in touch
          </h2>
          <p className="type-lead mt-6 !text-deep-muted">
            Tell us what needs cleaning and roughly how big it is. {RESPONSE_REPLY}
          </p>
          <dl className="mt-10 space-y-4 text-sm">
            <div>
              <dt className="text-deep-muted">Call or text</dt>
              <dd className="mt-1">
                <a
                  href={companyInfo.contact.phoneHref}
                  className="shore-focus font-semibold text-deep-foreground underline underline-offset-4"
                  data-testid="link-bottle-phone"
                >
                  {companyInfo.contact.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-deep-muted">Email</dt>
              <dd className="mt-1">
                <a
                  href={companyInfo.contact.emailHref}
                  className="shore-focus font-semibold text-deep-foreground underline underline-offset-4"
                  data-testid="link-bottle-email"
                >
                  {companyInfo.contact.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          {/* The announcement. Always present, never conditionally mounted —
              a live region added to the DOM at the same moment its text
              appears is frequently not announced at all. */}
          <p
            role="status"
            aria-live="polite"
            className={status === "sent" ? "text-sm text-deep-accent" : "sr-only"}
            data-testid="text-bottle-status"
          >
            {status === "sent"
              ? `Thank you — we have your message. ${RESPONSE_REPLY}`
              : ""}
          </p>

          {status === "sent" ? (
            <div
              className="rounded-3xl border border-deep-accent/40 bg-deep/60 p-10 text-center"
              data-testid="panel-bottle-sent"
            >
              <Check className="mx-auto h-9 w-9 text-deep-accent" aria-hidden="true" strokeWidth={1.5} />
              <h3 className="type-h3 mt-5 text-deep-foreground">Message sent.</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm text-deep-muted">
                {RESPONSE_REPLY} If it&apos;s urgent, calling is quicker —{" "}
                <a
                  href={companyInfo.contact.phoneHref}
                  className="shore-focus font-semibold text-deep-foreground underline underline-offset-4"
                >
                  {companyInfo.contact.phoneDisplay}
                </a>
                .
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-deep-muted/25 bg-deep/50 p-6 sm:p-8"
              noValidate
              data-testid="form-bottle"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" name="name" autoComplete="name" />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="sm:col-span-2"
                />

                <div className="sm:col-span-2">
                  <label
                    htmlFor="bottle-service"
                    className="block text-xs font-semibold uppercase tracking-wider text-deep-muted"
                  >
                    What do you need?
                  </label>
                  <select
                    id="bottle-service"
                    name="serviceType"
                    className="shore-focus mt-2 h-12 w-full rounded-xl border border-deep-muted/30 bg-deep px-3.5 text-sm text-deep-foreground"
                    data-testid="select-bottle-service"
                    defaultValue=""
                  >
                    <option value="">Not sure yet</option>
                    {SERVICE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="bottle-notes"
                    className="block text-xs font-semibold uppercase tracking-wider text-deep-muted"
                  >
                    Your message
                  </label>
                  <textarea
                    id="bottle-notes"
                    name="notes"
                    rows={4}
                    maxLength={2000}
                    placeholder="Three bedrooms in Kennebunk, every other week if you have room."
                    className="shore-focus mt-2 w-full rounded-xl border border-deep-muted/30 bg-deep px-3.5 py-3 text-sm text-deep-foreground placeholder:text-deep-muted/60"
                    data-testid="input-bottle-notes"
                  />
                </div>
              </div>

              {/* The same rule the server enforces, said before it is broken. */}
              <p className="mt-4 text-xs text-deep-muted">
                A phone number or an email — whichever you&apos;d rather we used.
              </p>

              {status === "error" && error && (
                <p
                  role="alert"
                  className="mt-4 flex items-start gap-2 text-sm text-red-300"
                  data-testid="text-bottle-error"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="shore-focus mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-deep-accent px-8 text-sm font-semibold text-deep transition-transform hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
                data-testid="button-bottle-submit"
              >
                {sending ? "Sending…" : "Send"}
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  className?: string;
}) {
  const id = `bottle-${name}`;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-deep-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        className="shore-focus mt-2 h-12 w-full rounded-xl border border-deep-muted/30 bg-deep px-3.5 text-sm text-deep-foreground"
        data-testid={`input-bottle-${name}`}
      />
    </div>
  );
}
