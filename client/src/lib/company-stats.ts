/**
 * The numbers the public site puts its name to — in one place.
 *
 * These used to be typed by hand at each call site, and they had drifted into
 * three separate answers to the same question:
 *
 *   "Cleans since 2018"  — 4,715+ on /service-areas, 5,000+ on /about, and a
 *                          map on /service-areas whose own city data summed to
 *                          4,532 directly underneath the 4,715 claim.
 *   "Communities"        — 49+ on the home page, /about, /service-areas and in
 *                          the page's SEO description, while the roster on
 *                          /service-areas named 41 and the map plotted 20.
 *
 * Nothing imports a number literal any more. Anything derivable is derived
 * from the roster in service-areas.ts, and anything that isn't derivable is a
 * single constant here with a note on where it has to come from.
 */

import { TOTAL_COMMUNITIES } from "./service-areas";

/**
 * Lifetime cleans. NOT derivable from anything in this repo — it has to come
 * from the booking history, so it is a manual figure and it will go stale.
 *
 * Set to the LOWER of the two figures the site was previously showing. Both
 * are "+" claims, so if the true total is 5,000 then "4,715+" is still true;
 * if the true total is 4,715 then "5,000+" is false. The conservative figure
 * is the only one that can't be wrong given what the site already claimed.
 * Raise it when there's a real count to raise it to.
 */
const CLEANS_COUNT = 4715;

/** "4,715+" — for stat tiles. */
export const CLEANS_SINCE_2018 = `${CLEANS_COUNT.toLocaleString("en-US")}+`;

/** "4,715" — for prose, where a trailing "+" reads badly. */
export const CLEANS_SINCE_2018_PLAIN = CLEANS_COUNT.toLocaleString("en-US");

/** Share of clients on a recurring schedule. Same caveat — a manual figure. */
export const RECURRING_CLIENT_RATE = "93%";

/** Communities served, derived from the roster so it can never drift again. */
export const COMMUNITIES_SERVED = `${TOTAL_COMMUNITIES}+`;

export { TOTAL_COMMUNITIES };
