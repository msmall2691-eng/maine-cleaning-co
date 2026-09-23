import { Link } from "wouter";
import { companyInfo } from "@/lib/company-info";
import { useSEO } from "@/hooks/use-seo";
import { Section } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";

/**
 * SMS program disclosure — the page a carrier's A2P 10DLC reviewer (and a
 * customer who replies HELP) is sent to. Kept deliberately plain: what we
 * text about, how you opted in, how often, what it costs, how to stop.
 *
 * This page is pre-rendered to static HTML at build time (see
 * script/prerender.ts) so the disclosure is in the response body with
 * JavaScript disabled, which is how campaign reviewers fetch it.
 */
export default function Sms() {
  useSEO({
    title: "Text Message (SMS) Program",
    description:
      "How The Maine Cleaning Co. uses text messages: booking confirmations, scheduling updates and reminders. Reply STOP to opt out, HELP for help.",
  });
  return (
    <>
      <Section
        measure="prose"
        rhythm="none"
        reveal={false}
        className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(1.75rem,3vw,2.75rem)]"
      >
        <h1 className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground heading-rule-left">
          Text Message (SMS) Program
        </h1>
        <p className="mt-7 text-sm text-muted-foreground">Last updated: September 2026</p>
      </Section>

      <Section measure="prose" rhythm="tight" reveal={false} className="overflow-hidden pb-[clamp(3.25rem,6vw,5.5rem)]">
        <LogoWatermark position="right" />
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-[0.95rem] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Program description</h2>
            <p>
              {companyInfo.name} sends text messages to customers about the cleaning services they have requested or
              booked. Messages include estimate follow-ups, booking confirmations, scheduling changes, appointment
              reminders, and replies to questions you text us. We do not send promotional or marketing texts.
            </p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">How you opt in</h2>
            <p>
              You opt in by providing your mobile number and agreeing to receive text messages when you request an
              estimate or book a cleaning on our website, or by texting our business number first. Consenting to text
              messages is not a condition of any purchase.
            </p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Message frequency and cost</h2>
            <p>
              Message frequency varies and depends on your bookings — typically a few messages per cleaning. Message and
              data rates may apply. Carriers are not liable for delayed or undelivered messages.
            </p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">How to opt out</h2>
            <p>
              Reply <strong>STOP</strong> to any message at any time to stop receiving texts. You will receive one final
              confirmation message and no further texts. Reply <strong>START</strong> to opt back in.
            </p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Help and support</h2>
            <p>
              Reply <strong>HELP</strong> to any message for assistance, email{" "}
              <a href={companyInfo.contact.emailHref} className="text-primary underline">
                {companyInfo.contact.email}
              </a>
              , or call{" "}
              <a href={companyInfo.contact.phoneHref} className="text-primary underline">
                {companyInfo.contact.phoneDisplay}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Your privacy</h2>
            <p>
              We do not sell or share your mobile number or SMS opt-in consent with third parties or affiliates for
              marketing or promotional purposes. See our{" "}
              <Link href="/privacy" className="text-primary underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-primary underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
