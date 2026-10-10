/**
 * The questions /how-it-works answers, and the FAQPage schema built from them.
 *
 * Extracted from the page so three consumers share one list: the accordion a
 * visitor reads, the JSON-LD `useSEO` injects at runtime, and the same JSON-LD
 * baked into the HTML by script/prerender.ts. Google requires FAQPage markup
 * to match the questions visible on the page, which is impossible to keep
 * true with the schema built from a copy.
 */

import { COMMUNITIES_SERVED } from "./company-stats";

export interface Faq {
  q: string;
  a: string;
}

export const howItWorksFaqs: Faq[] = [
  { q: "Are your cleaners background-checked and insured?", a: "Yes to both. Every cleaner is vetted and trained, and we're fully bonded and insured with comprehensive liability coverage." },
  { q: "How is pricing determined?", a: "Square footage, number of bathrooms, service type, frequency, and the condition of the home. Our instant estimate tool gives you a range in about a minute — no commitment, and no phone call required to see a number." },
  { q: "Do I need to be home during the cleaning?", a: "No. Many clients leave a spare key or an entry code. We always make sure your home is secure when we leave." },
  { q: "What's the difference between a standard and a deep clean?", a: "A deep clean covers baseboards, interior windows, detailed grout scrubbing and behind furniture — the things routine maintenance cleans don't include. You can book either as a one-time clean with no commitment." },
  { q: "How soon will I hear from you?", a: "Within 48 hours, always. We're a small local team and we only take on what we can do properly, so in our busiest stretches the schedule does fill up. Either way you'll hear from us within two days — your quote if we can fit you in, or a friendly note if we can't, so you're never left wondering and can keep looking if you need to. If it's time-sensitive, give us a call or a text and you'll reach us quicker." },
  { q: "What if I'm not satisfied with a clean?", a: "We come back and fix it. No questions asked — that's the satisfaction guarantee." },
  { q: "What areas do you serve?", a: `York County and Cumberland County in Southern Maine — ${COMMUNITIES_SERVED} communities in all, including Portland, South Portland, Scarborough, Cape Elizabeth, Falmouth, Yarmouth, Old Orchard Beach and Kennebunkport.` },
];
