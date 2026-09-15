/**
 * What we promise about getting back to people — written once, used everywhere.
 *
 * The site used to say "within one business day" in ten separate places and
 * "we respond within hours, not days" in an eleventh. That is a hard promise
 * from a small team that cleans seven days a week and is hardest-pressed in
 * exactly the season when the most people write in. Missing it is worse than
 * never having made it: someone who was told "one business day" and waits two
 * feels ignored, and the reply they eventually get starts from behind.
 *
 * So the copy now says what is actually true — a small local team, reading
 * everything themselves, getting to people as fast as they can — and always
 * names the faster channel for anyone who can't wait. It is a softer promise
 * that we can keep, in place of a sharp one we couldn't.
 *
 * Changing the window means changing it here and nowhere else.
 */

/** Fragment, for dropping into a longer sentence. */
export const RESPONSE_WINDOW = "usually within a day or two";

/** Standalone reassurance under a form. */
export const RESPONSE_REPLY =
  "We read every message ourselves and get back to you as fast as we can — usually within a day or two.";

/** For a submitted booking or change that still needs confirming. */
export const RESPONSE_CONFIRM =
  "We'll confirm by call or text as soon as we can — usually within a day or two.";

/** Always offered alongside the above: the channel that really is faster. */
export const RESPONSE_URGENT =
  "If it's time-sensitive, call or text us and you'll get us quicker.";

/**
 * The "we're open" signal. Deliberately not a scarcity or waitlist line — we
 * take everyone who writes in; the constraint is how fast we can reply, not
 * who we'll work with.
 */
export const AVAILABILITY_NOTE = "Taking new clients across Southern Maine";
