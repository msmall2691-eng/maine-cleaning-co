/**
 * What we promise about getting back to people — written once, used everywhere.
 *
 * Two over-claims have already had to be walked back here. The site first
 * promised "within one business day" in ten separate places and "we respond
 * within hours, not days" in an eleventh — a hard commitment from a small team
 * that cleans seven days a week and is hardest-pressed in exactly the season
 * when the most people write in. Missing it costs more than never having made
 * it: someone told "one business day" who waits two feels ignored before we've
 * even replied. The fix for that then claimed we answer every message
 * ourselves, which was the same mistake one layer down — we don't take on
 * every job, so promising everyone a considered reply wasn't true either.
 *
 * What's promised now is the thing we can genuinely do for everyone: they hear
 * from us inside 48 hours, either way. Their quote when we can fit them in, and
 * a friendly note when we can't. That's why the window can be a firm number —
 * the deliverable shrank. Saying "our September is full" takes seconds; a real
 * quote takes real work, and only the jobs we're taking get that.
 *
 * The second outcome is named out loud on purpose. Being turned down politely
 * is easy to take; being left to guess is what people actually mind, and it's
 * what produces the chasing follow-ups. Someone with a house to sort out needs
 * a quick no far more than a slow maybe.
 *
 * Tone matters as much as substance here. A no is always about OUR schedule and
 * what we can do properly — never about the person asking, and never phrased as
 * choosing between customers. That's the difference between this reading as
 * considerate and reading as superior, and responseTime.test.ts enforces it.
 *
 * Changing any of this means changing it here and nowhere else.
 */

/** The window itself, as a fragment for longer sentences. */
export const RESPONSE_WINDOW = "within 48 hours";

/**
 * The core promise. Both outcomes named — the second half is the point, and
 * responseTime.test.ts fails if it goes missing.
 */
export const RESPONSE_REPLY =
  "You'll hear from us within 48 hours — either with your quote, or to let you know if our schedule is too full to do it justice right now.";

/** For a submitted booking or change that still needs confirming. */
export const RESPONSE_CONFIRM =
  "We'll be in touch by call or text within 48 hours to confirm.";

/** Always offered alongside the above: the channel that really is faster. */
export const RESPONSE_URGENT =
  "If it's time-sensitive, give us a call or a text and you'll reach us quicker.";

/**
 * Why we might not be able to. Framed as care and capacity — what we can do
 * properly, and a schedule that fills — rather than as picking and choosing.
 */
export const SELECTIVITY_NOTE =
  "We're a small local team and we only take on what we can do properly, so in our busiest stretches the schedule does fill up.";

/**
 * The "we're open" signal. Being full sometimes is not the same as being
 * closed: we are very much taking people on. Deliberately not scarcity or
 * waitlist framing either — no "only N slots left" — and the test enforces it.
 */
export const AVAILABILITY_NOTE = "Taking new clients across Southern Maine";
