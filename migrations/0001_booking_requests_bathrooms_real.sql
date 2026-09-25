-- booking_requests.bathrooms: integer -> real
--
-- shared/schema.ts has declared this column `real` since PR #50, because the
-- /book form offers half-baths and the quote is priced on them. The production
-- column was never converted, so every booking with a half-bath has been
-- failing since:
--
--   POST /api/booking/submit -> 500
--   error: invalid input syntax for type integer: "2.5"
--
-- The `pg` driver sends parameters as text, and Postgres does not round a
-- string on the way into an integer column — '2.5'::integer is a hard error,
-- not a 3. The customer saw "Failed to submit booking request. Please try
-- again.", and trying again did not help.
--
-- USING is required: Postgres will not convert integer -> real implicitly in
-- ALTER COLUMN. Widening integer to real cannot lose data (every int in this
-- range is exactly representable), so this is safe to run against live rows.
ALTER TABLE booking_requests
  ALTER COLUMN bathrooms TYPE real USING bathrooms::real;
