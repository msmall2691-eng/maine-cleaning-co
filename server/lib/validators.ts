import { z } from "zod";

export const intakeSubmitSchema = z.object({
  name: z.string().max(200).trim().optional().nullable(),
  email: z.string().email("Invalid email address").max(300).trim().optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  zip: z.string().max(10).optional().nullable(),
  serviceType: z.enum(["standard", "deep", "str", "vacation-rental", "commercial", "move-in-out"]).optional().nullable(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "one-time"]).optional().nullable(),
  sqft: z.number().int().min(100).max(20000).optional().nullable(),
  // Half-baths are a real selection in the estimator UI (e.g. 2½). Accept
  // 0.5 steps so the value the customer priced their quote on survives to
  // the server instead of being rounded — otherwise the server recompute
  // (and the number the operator sees) is priced on a different bath count
  // than the customer was shown. See quoteEngine + the /book flow.
  bathrooms: z.number().min(1).max(20).multipleOf(0.5).optional().nullable(),
  petHair: z.enum(["none", "some", "heavy"]).optional().nullable(),
  condition: z.enum(["maintenance", "moderate", "heavy"]).optional().nullable(),
  estimateMin: z.number().int().min(0).optional().nullable(),
  estimateMax: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  photos: z.array(z.string()).max(3).optional().nullable(),
  source: z.string().max(100).optional().default("website_form"),
});

export type IntakeSubmitPayload = z.infer<typeof intakeSubmitSchema>;
