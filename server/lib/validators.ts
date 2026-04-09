import { z } from "zod";

/**
 * Validate US phone number (with flexible formatting)
 * Accepts: 5551234567, 555-123-4567, (555) 123-4567, +1 555 123 4567, etc.
 * International: +44 20 7946 0958, etc.
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(\+?1[-.\s]?)?(\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}|(\+\d{1,3}[-.\s]?)?(\d{6,14}))$/,
    "Phone must be a valid phone number (e.g., 555-123-4567 or +1 555 123 4567)"
  )
  .max(30);

/**
 * Email validation - stricter than default
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(300)
  .toLowerCase();

export const intakeSubmitSchema = z
  .object({
    name: z.string().max(200).trim().optional().nullable(),
    email: emailSchema.optional().nullable().or(z.literal("")),
    phone: phoneSchema.optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "ZIP must be valid format").max(10).optional().nullable(),
    serviceType: z.enum(["standard", "deep", "str", "vacation-rental", "commercial", "move-in-out"]).optional().nullable(),
    frequency: z.enum(["weekly", "biweekly", "monthly", "one-time"]).optional().nullable(),
    sqft: z.number().int().min(100).max(20000).optional().nullable(),
    bathrooms: z.number().int().min(1).max(20).optional().nullable(),
    petHair: z.enum(["none", "some", "heavy"]).optional().nullable(),
    condition: z.enum(["maintenance", "moderate", "heavy"]).optional().nullable(),
    estimateMin: z.number().int().min(0).optional().nullable(),
    estimateMax: z.number().int().min(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    photos: z.array(z.string()).max(3).optional().nullable(),
    source: z.string().max(100).optional().default("website_form"),
    preferredContactMethod: z.enum(["sms", "email", "call"]).optional().nullable(),
  })
  .refine(
    (data) => data.email || data.phone,
    {
      message: "Either email or phone number is required",
      path: ["phone"], // Show error on phone field
    }
  )
  .refine(
    (data) => !data.estimateMin || !data.estimateMax || data.estimateMin <= data.estimateMax,
    {
      message: "Minimum estimate must be less than or equal to maximum estimate",
      path: ["estimateMin"],
    }
  );

export type IntakeSubmitPayload = z.infer<typeof intakeSubmitSchema>;
