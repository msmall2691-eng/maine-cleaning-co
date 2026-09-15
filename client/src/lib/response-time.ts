/**
 * What we promise about getting back to people — written once, used everywhere.
 *
 * Two problems, fixed in order.
 *
 * The site first promised "within one business day" in ten separate places and
 * "we respond within hours, not days" in an eleventh. That's a hard commitment
 * from a small team that cleans seven days a week and is hardest-pressed in
 * exactly the season when the most people write in. Missing it costs more than
 * never having made it: someone told "one business day" who waits two feels
 * ignored before we've even replied.
 *
 * The first pass softened that to "usually within a day or two" and said we
 * answer every message ourselves. The window was honest; the rest wasn't. We
 * don't take on every job — the schedule fills up, and some work isn't a fit —
 * so promising everyone a considered reply was the same over-claim one layer
 * down.
 *
 * What's promised now is the thing we can genuinely do for everyone: an ANSWER
 * inside 48 hours, of one of two kinds. A quote when we can take the work, and
 * a straight "not right now" when we can't. That's why the window can go back
 * to being a firm number — the deliverable shrank. Writing "we're full through
 * October" takes seconds; a real quote takes real work, and only the jobs we're
 * taking get that.
 *
 * The negative case is stated out loud on purpose. Turning work away is normal
 * and nobody minds it; being left to guess is what people actually resent, and
 * it's what generates the chasing follow-ups. Someone with a filthy house needs
 * a fast no far more than a slow maybe.
 *
 * Changing any of this means changing it here and nowhere else.
 */

/** The window itself, as a fragment for longer sentences. */
export const RESPONSE_WINDOW = "within 48 hours";

/**
 * The core promise. Both outcomes named — the "or" half is the point, and
 * responseTime.test.ts fails if it goes missing.
 */
export const RESPONSE_REPLY =
  "You'll hear back within 48 hours — with a quote, or with a straight answer that we're not the right fit right now.";

/** For a submitted booking or change that still needs confirming. */
export const RESPONSE_CONFIRM =
  "We'll confirm by call or text within 48 hours.";

/** Always offered alongside the above: the channel that really is faster. */
export const RESPONSE_URGENT =
  "If it's time-sensitive, call or text us and you'll get us quicker.";

/**
 * Why we might say no. Capacity and fit — never a judgement about the person
 * asking, which is the difference between this reading as honest and reading
 * as snobbish.
 */
export const SELECTIVITY_NOTE =
  "We're a small local team and we don't take on every job — the schedule fills up, especially in peak season.";

/**
 * The "we're open" signal. Not taking every job is not the same as not taking
 * new clients: we are. Deliberately not scarcity or waitlist framing either —
 * no "only N slots left" — and the test enforces that.
 */
export const AVAILABILITY_NOTE = "Taking new clients across Southern Maine";
