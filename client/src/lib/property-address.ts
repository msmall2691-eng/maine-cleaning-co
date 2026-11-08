/**
 * Is this string finished enough to spend money on?
 *
 * The estimator shows a Street View photo of the address someone types. The
 * image leg of that lookup is billed per request (see server/lib/streetView.ts),
 * and the address field is a live text input, so without a gate a customer
 * typing their own address would walk past a dozen billable half-addresses on
 * their way to the real one.
 *
 * This is that gate. It is not validation — the server answers either way,
 * and a wrong-but-complete address is exactly the case the photo is there to
 * catch. It only asks whether the string has reached the shape that picking a
 * suggestion produces: a house number, the state, and a ZIP after the state.
 *
 * The ZIP has to come AFTER "ME" specifically. Matching a loose five digits
 * anywhere would fire on "12345 Long Plains Rd, Buxton, ME" — a five-digit
 * house number and no ZIP at all — which is one paid-for lookup of an address
 * the customer hasn't finished typing.
 */
export function addressLooksComplete(address: string): boolean {
  const trimmed = address.trim();
  return /^\d/.test(trimmed) && /\bME[,\s]+\d{5}\b/i.test(trimmed);
}

/** The endpoint for `address`, or null when it isn't worth asking yet. */
export function propertyPhotoSrc(address: string): string | null {
  const trimmed = address.trim();
  return addressLooksComplete(trimmed)
    ? `/api/property-photo?address=${encodeURIComponent(trimmed)}`
    : null;
}
