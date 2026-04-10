import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
  phone: text("phone"),
  role: text("role").notNull().default("client"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  phone: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const quoteLeads = pgTable("quote_leads", {
  id: serial("id").primaryKey(),
  sqft: integer("sqft").notNull(),
  serviceType: text("service_type").notNull(),
  frequency: text("frequency").notNull(),
  petHair: text("pet_hair").notNull(),
  condition: text("condition").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  estimateMin: integer("estimate_min").notNull(),
  estimateMax: integer("estimate_max").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  zip: text("zip"),
  address: text("address"),
  photos: json("photos").$type<string[]>(),
  source: text("source").default("website"),
  status: text("status").notNull().default("New"),
  archived: boolean("archived").notNull().default(false),
  clientId: varchar("client_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuoteLeadSchema = createInsertSchema(quoteLeads).omit({
  id: true,
  status: true,
  archived: true,
  clientId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "ZIP must be 5 digits").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  photos: z.array(z.string()).max(3).optional().nullable(),
});

export type InsertQuoteLead = z.infer<typeof insertQuoteLeadSchema>;
export type QuoteLead = typeof quoteLeads.$inferSelect;

export const onboardingChecklists = pgTable("onboarding_checklists", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull(),
  quoteId: integer("quote_id").notNull(),
  serviceType: text("service_type").notNull(),
  formResponses: json("form_responses").$type<Record<string, string>>().notNull().default(sql`'{}'::json`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOnboardingChecklistSchema = createInsertSchema(onboardingChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingChecklist = z.infer<typeof insertOnboardingChecklistSchema>;
export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull(),
  quoteId: integer("quote_id").notNull(),
  serviceType: text("service_type").notNull(),
  frequency: text("frequency").notNull(),
  price: integer("price").notNull(),
  address: text("address"),
  terms: text("terms").notNull(),
  signedName: text("signed_name"),
  signedAt: timestamp("signed_at"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  signedName: true,
  signedAt: true,
  status: true,
  createdAt: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export const scheduledCleanings = pgTable("scheduled_cleanings", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull(),
  quoteId: integer("quote_id"),
  serviceType: text("service_type").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("upcoming"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ScheduledCleaning = typeof scheduledCleanings.$inferSelect;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull(),
  cleaningId: integer("cleaning_id"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;

export const intakeSubmissions = pgTable("intake_submissions", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().default("website_form"),
  rawPayload: json("raw_payload").$type<Record<string, any>>().notNull(),
  normalizedPayload: json("normalized_payload").$type<Record<string, any>>().notNull(),
  status: text("status").notNull().default("new"),
  emailNotificationStatus: text("email_notification_status").notNull().default("pending"),
  processingStatus: text("processing_status").notNull().default("captured"),
  quoteLeadId: integer("quote_lead_id"),

  // Approval workflow
  approvalToken: varchar("approval_token").unique(),
  approvalTokenExpires: timestamp("approval_token_expires"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  approvalMethod: text("approval_method"),
  approvalTimestamp: timestamp("approval_timestamp"),

  // Contact preferences
  preferredContactMethod: text("preferred_contact_method"),

  // Twenty CRM sync tracking
  twentySyncStatus: text("twenty_sync_status").notNull().default("pending"),
  twentySyncError: text("twenty_sync_error"),
  twentyCompanyId: varchar("twenty_company_id"),
  twentyContactId: varchar("twenty_contact_id"),
  twentyQuoteRequestId: varchar("twenty_quote_request_id"),
  twentySyncedAt: timestamp("twenty_synced_at"),

  // Payment/Stripe tracking
  estimatedPrice: integer("estimated_price"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  stripePriceId: varchar("stripe_price_id"),
  invoiceId: varchar("invoice_id"),

  // Job completion tracking
  bookingId: integer("booking_id"),
  jobCompletedAt: timestamp("job_completed_at"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIntakeSubmissionSchema = createInsertSchema(intakeSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertIntakeSubmission = z.infer<typeof insertIntakeSubmissionSchema>;
export type IntakeSubmission = typeof intakeSubmissions.$inferSelect;

export const bookingRequests = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  intakeId: integer("intake_id"),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  zip: text("zip"),
  serviceType: text("service_type").notNull(),
  frequency: text("frequency"),
  sqft: integer("sqft"),
  bathrooms: integer("bathrooms"),
  petHair: text("pet_hair"),
  condition: text("condition"),
  estimateMin: integer("estimate_min"),
  estimateMax: integer("estimate_max"),
  requestedDate: timestamp("requested_date").notNull(),
  distanceMiles: integer("distance_miles"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  googleEventId: text("google_event_id"),
  connecteamShiftId: text("connecteam_shift_id"),
  crmBookingId: text("crm_booking_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingRequestSchema = createInsertSchema(bookingRequests).omit({
  id: true,
  status: true,
  adminNotes: true,
  googleEventId: true,
  connecteamShiftId: true,
  crmBookingId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBookingRequest = z.infer<typeof insertBookingRequestSchema>;
export type BookingRequest = typeof bookingRequests.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
