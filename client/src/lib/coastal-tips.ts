import type { Sky } from "./weather-types";

/**
 * What the lighthouse says, keyed to the weather actually outside.
 *
 * Ground rules, because this is copy that ships next to a real business:
 *
 *  - **No claims about us.** Nothing here says we're out in it, that we
 *    never cancel, or that we do anything in particular today. These are
 *    observations and household tips, not operational promises the office
 *    would have to keep.
 *  - **No urgency, no scarcity.** The site deliberately avoids "book now
 *    before the snow" framing (see lib/response-time.ts for the same rule
 *    applied to reply times), and weather is exactly the lever a cleaning
 *    company would be tempted to lean on.
 *  - **True in Maine.** Mud season, salt on floors, pollen on sills, and
 *    fog off the water are real here; generic weather platitudes aren't
 *    worth the pixels.
 *
 * Several per bucket so the widget isn't the same sentence every visit.
 */
export const COASTAL_TIPS: Record<Sky, readonly string[]> = {
  clear: [
    "Good light for spotting the streaks on your windows — sorry.",
    "Sun this low finds every fingerprint on a glass door.",
    "Clear day on the coast. Worth opening a window while you dust.",
  ],
  cloudy: [
    "Flat grey light is honest light — it hides nothing and glares off nothing.",
    "Overcast is the best light for cleaning glass. No streaks drying ahead of you.",
    "Grey over the bay. Good day for the jobs that don't need a view.",
  ],
  fog: [
    "Fog off the water gets into everything. Run a fan when it lifts.",
    "Damp air means slow drying — give mopped floors extra time today.",
    "Classic Maine fog. Salt haze on the windows will wait until it clears.",
  ],
  rain: [
    "Rain means grit at the door. A mat inside and out catches most of it.",
    "Wet boots today — a towel by the door saves the hallway floor.",
    "Good day for the inside jobs. Windows can wait for the sun.",
  ],
  snow: [
    "Snow means salt, and salt means white marks on hardwood. Warm water lifts it.",
    "Boot trays by the door are the whole trick this time of year.",
    "Shovel first, mop after — the melt does the walking for you otherwise.",
  ],
  storm: [
    "Blowing weather on the coast. Good day to stay in and sort a cupboard.",
    "Wind off the water drives rain at the windows. They'll need a wipe after.",
    "Storm's up. The lighthouse has seen worse.",
  ],
} as const;

/**
 * After dark, for the two buckets whose tips are about daylight.
 *
 * `clear` and `cloudy` both describe the light — "sun this low finds every
 * fingerprint", "flat grey light is honest light" — which is nonsense at
 * 9pm in January, when it has been dark since four. The wet/cold buckets
 * need no night variant: grit at the door and salt on hardwood read the
 * same at any hour.
 */
const NIGHT_TIPS: readonly string[] = [
  "Dark by four this time of year. Lamps show up the dust that daylight hides.",
  "Evening is the honest time to look at a floor — low light across it shows every mark.",
  "Quiet hour on the coast. Good time for the small job you keep walking past.",
] as const;

const DAYLIGHT_DEPENDENT: readonly Sky[] = ["clear", "cloudy"] as const;

/**
 * Picks a tip that's stable for the whole hour, so the line doesn't shuffle
 * on every re-render or route change — but does change across a day.
 */
export function tipFor(sky: Sky, isDay = true, now = new Date()): string {
  const pool =
    !isDay && DAYLIGHT_DEPENDENT.includes(sky)
      ? NIGHT_TIPS
      : (COASTAL_TIPS[sky] ?? COASTAL_TIPS.cloudy);
  const hour = now.getHours() + now.getDate() * 24;
  return pool[hour % pool.length];
}
