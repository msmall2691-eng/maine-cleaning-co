import { Section } from "@/components/layout/Section";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { brand } from "@/lib/brand";

/**
 * The business site's privacy notice.
 *
 * Short because the site genuinely does very little: one contact form and
 * analytics. It is deliberately NOT the cleaning company's policy — that one
 * covers SMS consent, booking records and a customer portal, none of which
 * exist here, and a policy that describes processing you don't do is worse
 * than a short honest one.
 *
 * The cleaning company's own policy is still served inside the demo at
 * /demo/privacy, where it belongs.
 *
 * ⚠️  This is a plain-language description of what the site actually does,
 *     not legal advice. Have someone qualified look at it before you rely on
 *     it, especially if you start handling client data under contract.
 */
export default function StudioPrivacy() {
  useSEO(STATIC_PAGE_SEO["/privacy"]);

  const sections = [
    {
      h: "What this site collects",
      p: [
        "If you fill in the contact form, it collects the name, email address, phone number, business name and message you type into it. Nothing else, and none of those fields are required except your name, your message, and at least one way of replying to you.",
        "The site also records standard analytics — pages viewed, roughly where in the world the visit came from, what kind of device. That is Google Analytics, and it is aggregate: it does not tell me who you are.",
      ],
    },
    {
      h: "What it is used for",
      p: [
        "Replying to you. That is the entire purpose. Your enquiry is stored so it does not get lost, and emailed to me so I see it.",
        "There is no mailing list, no newsletter, no marketing sequence and no retargeting. You will not be added to anything by writing to me.",
      ],
    },
    {
      h: "Who else sees it",
      p: [
        "Nobody, with the ordinary exception of the services that run the site: the hosting provider, the database, and the email provider that delivers your message. Your enquiry is not sold, shared or passed to any third party for their own use.",
      ],
    },
    {
      h: "How long it is kept",
      p: [
        "Enquiries are kept while there is a reason to — an ongoing conversation or a live project. Ask me to delete yours and I will, with no questions and no retention clause to argue about.",
      ],
    },
    {
      h: "The demo",
      p: [
        `The system at ${brand.demoPath} is a demonstration of software built for ${brand.operator.priorBusiness}, which has wound down. Its booking and enquiry forms are switched off and do not accept submissions, so nothing you type into them is stored or sent.`,
      ],
    },
    {
      h: "Getting in touch",
      p: [
        `Any question about any of this — what is held, correcting it, deleting it — goes to ${brand.contact.email} and is answered by me personally.`,
      ],
    },
  ];

  return (
    <div className="w-full clip-x">
      <Section measure="prose" className="pt-32 sm:pt-40" reveal={false}>
        <h1 className="type-display-sm text-foreground heading-rule-left">Privacy</h1>
        <p className="type-lead mt-8">
          What this site collects, why, and how to get rid of it. It is short because the site does
          very little.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="type-h3 text-foreground mb-3">{s.h}</h2>
              <div className="space-y-4">
                {s.p.map((text, i) => (
                  <p key={i} className="text-[15px] text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/70 mt-14 pt-6 border-t border-border">
          Last updated {new Date().getFullYear()}. {brand.name} is operated by {brand.operator.name}.
        </p>
      </Section>
    </div>
  );
}
