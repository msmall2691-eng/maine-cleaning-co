import {
  type User, type InsertUser,
  type QuoteLead, type InsertQuoteLead,
  type OnboardingChecklist, type InsertOnboardingChecklist,
  type Contract, type InsertContract,
  type ScheduledCleaning,
  type Payment,
  type IntakeSubmission, type InsertIntakeSubmission,
  type BookingRequest, type InsertBookingRequest,
  users, quoteLeads, onboardingChecklists, contracts, scheduledCleanings, payments, intakeSubmissions, bookingRequests
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  createBookingRequest(data: InsertBookingRequest): Promise<BookingRequest>;
  getBookingRequests(opts?: { status?: string; limit?: number; offset?: number }): Promise<{ bookings: BookingRequest[]; total: number }>;
  getBookingRequest(id: number): Promise<BookingRequest | undefined>;
  updateBookingRequestStatus(id: number, status: string, adminNotes?: string): Promise<BookingRequest | undefined>;
  updateBookingRequestExternalIds(id: number, ids: { googleEventId?: string; connecteamShiftId?: string; crmBookingId?: string }): Promise<BookingRequest | undefined>;
  createIntakeSubmission(data: InsertIntakeSubmission): Promise<IntakeSubmission>;
  updateIntakeSubmissionEmail(id: number, status: "sent" | "failed"): Promise<void>;
  updateIntakeSubmissionQuoteLead(id: number, quoteLeadId: number): Promise<void>;
  updateIntakeSubmissionApprovalToken(id: number, token: string, expiresAt: Date): Promise<void>;
  updateIntakeSubmissionApprovalStatus(id: number, status: "approved" | "rejected", method?: string): Promise<void>;
  updateIntakeSubmissionTwentySyncStatus(id: number, syncStatus: "pending" | "synced" | "failed", companyId?: string, contactId?: string, quoteRequestId?: string, error?: string): Promise<void>;
  updateIntakeSubmissionPaymentInfo(id: number, stripeCustomerId?: string, stripeSessionId?: string, invoiceId?: string): Promise<void>;
  getIntakeSubmissions(limit?: number, offset?: number): Promise<IntakeSubmission[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createQuoteLead(lead: InsertQuoteLead): Promise<QuoteLead>;
  getQuoteLeads(opts?: { status?: string; limit?: number; offset?: number; includeArchived?: boolean }): Promise<{ leads: QuoteLead[]; total: number }>;
  getQuoteLeadsByClient(clientId: string): Promise<QuoteLead[]>;
  getQuoteLead(id: number): Promise<QuoteLead | undefined>;
  updateQuoteLeadStatus(id: number, status: string): Promise<QuoteLead | undefined>;
  updateQuoteLeadClient(id: number, clientId: string): Promise<QuoteLead | undefined>;
  archiveQuoteLead(id: number): Promise<QuoteLead | undefined>;
  setResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  getOnboardingChecklist(clientId: string, quoteId: number): Promise<OnboardingChecklist | undefined>;
  upsertOnboardingChecklist(data: InsertOnboardingChecklist): Promise<OnboardingChecklist>;
  getContract(clientId: string, quoteId: number): Promise<Contract | undefined>;
  getContractsByClient(clientId: string): Promise<Contract[]>;
  createContract(data: InsertContract): Promise<Contract>;
  signContract(id: number, signedName: string): Promise<Contract | undefined>;
  getScheduledCleanings(clientId: string): Promise<ScheduledCleaning[]>;
  createScheduledCleaning(data: Partial<ScheduledCleaning>): Promise<ScheduledCleaning>;
  updateScheduledCleaning(id: number, clientId: string, data: Partial<ScheduledCleaning>): Promise<ScheduledCleaning | undefined>;
  deleteScheduledCleaning(id: number, clientId: string): Promise<boolean>;
  getPayments(clientId: string): Promise<Payment[]>;
  createPayment(data: Partial<Payment>): Promise<Payment>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async setResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async clearResetToken(userId: string): Promise<void> {
    await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async createQuoteLead(lead: InsertQuoteLead): Promise<QuoteLead> {
    const [quoteLead] = await db.insert(quoteLeads).values(lead).returning();
    return quoteLead;
  }

  async getQuoteLeads(opts?: { status?: string; limit?: number; offset?: number; includeArchived?: boolean }): Promise<{ leads: QuoteLead[]; total: number }> {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;
    const conditions = [];

    if (!opts?.includeArchived) {
      conditions.push(eq(quoteLeads.archived, false));
    }
    if (opts?.status) {
      conditions.push(eq(quoteLeads.status, opts.status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quoteLeads)
      .where(where);

    const leads = await db
      .select()
      .from(quoteLeads)
      .where(where)
      .orderBy(desc(quoteLeads.createdAt))
      .limit(limit)
      .offset(offset);

    return { leads, total: countResult?.count ?? 0 };
  }

  async getQuoteLead(id: number): Promise<QuoteLead | undefined> {
    const [lead] = await db.select().from(quoteLeads).where(eq(quoteLeads.id, id));
    return lead;
  }

  async updateQuoteLeadStatus(id: number, status: string): Promise<QuoteLead | undefined> {
    const [lead] = await db
      .update(quoteLeads)
      .set({ status, updatedAt: new Date() })
      .where(eq(quoteLeads.id, id))
      .returning();
    return lead;
  }

  async archiveQuoteLead(id: number): Promise<QuoteLead | undefined> {
    const [lead] = await db
      .update(quoteLeads)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(quoteLeads.id, id))
      .returning();
    return lead;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async getQuoteLeadsByClient(clientId: string): Promise<QuoteLead[]> {
    return db.select().from(quoteLeads)
      .where(and(eq(quoteLeads.clientId, clientId), eq(quoteLeads.archived, false)))
      .orderBy(desc(quoteLeads.createdAt));
  }

  async updateQuoteLeadClient(id: number, clientId: string): Promise<QuoteLead | undefined> {
    const [lead] = await db
      .update(quoteLeads)
      .set({ clientId, updatedAt: new Date() })
      .where(eq(quoteLeads.id, id))
      .returning();
    return lead;
  }

  async getOnboardingChecklist(clientId: string, quoteId: number): Promise<OnboardingChecklist | undefined> {
    const [checklist] = await db.select().from(onboardingChecklists)
      .where(and(eq(onboardingChecklists.clientId, clientId), eq(onboardingChecklists.quoteId, quoteId)));
    return checklist;
  }

  async upsertOnboardingChecklist(data: InsertOnboardingChecklist): Promise<OnboardingChecklist> {
    const existing = await this.getOnboardingChecklist(data.clientId, data.quoteId);
    if (existing) {
      const [updated] = await db.update(onboardingChecklists)
        .set({ formResponses: data.formResponses, updatedAt: new Date() })
        .where(eq(onboardingChecklists.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(onboardingChecklists).values(data).returning();
    return created;
  }

  async getContract(clientId: string, quoteId: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts)
      .where(and(eq(contracts.clientId, clientId), eq(contracts.quoteId, quoteId)));
    return contract;
  }

  async getContractsByClient(clientId: string): Promise<Contract[]> {
    return db.select().from(contracts)
      .where(eq(contracts.clientId, clientId))
      .orderBy(desc(contracts.createdAt));
  }

  async createContract(data: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values(data).returning();
    return contract;
  }

  async signContract(id: number, signedName: string): Promise<Contract | undefined> {
    const [contract] = await db.update(contracts)
      .set({ signedName, signedAt: new Date(), status: "signed" })
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async getScheduledCleanings(clientId: string): Promise<ScheduledCleaning[]> {
    return db.select().from(scheduledCleanings)
      .where(eq(scheduledCleanings.clientId, clientId))
      .orderBy(desc(scheduledCleanings.scheduledDate));
  }

  async createScheduledCleaning(data: Partial<ScheduledCleaning>): Promise<ScheduledCleaning> {
    const [cleaning] = await db.insert(scheduledCleanings).values(data as any).returning();
    return cleaning;
  }

  async updateScheduledCleaning(id: number, clientId: string, data: Partial<ScheduledCleaning>): Promise<ScheduledCleaning | undefined> {
    const [cleaning] = await db.update(scheduledCleanings)
      .set(data)
      .where(and(eq(scheduledCleanings.id, id), eq(scheduledCleanings.clientId, clientId)))
      .returning();
    return cleaning;
  }

  async deleteScheduledCleaning(id: number, clientId: string): Promise<boolean> {
    const result = await db.delete(scheduledCleanings)
      .where(and(eq(scheduledCleanings.id, id), eq(scheduledCleanings.clientId, clientId)))
      .returning();
    return result.length > 0;
  }

  async getPayments(clientId: string): Promise<Payment[]> {
    return db.select().from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data as any).returning();
    return payment;
  }

  async createBookingRequest(data: InsertBookingRequest): Promise<BookingRequest> {
    const [row] = await db.insert(bookingRequests).values(data).returning();
    return row;
  }

  async getBookingRequests(opts?: { status?: string; limit?: number; offset?: number }): Promise<{ bookings: BookingRequest[]; total: number }> {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;
    const conditions = [];
    if (opts?.status) conditions.push(eq(bookingRequests.status, opts.status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(bookingRequests).where(where);
    const bookings = await db.select().from(bookingRequests).where(where).orderBy(desc(bookingRequests.createdAt)).limit(limit).offset(offset);
    return { bookings, total: countResult?.count ?? 0 };
  }

  async getBookingRequest(id: number): Promise<BookingRequest | undefined> {
    const [row] = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id));
    return row;
  }

  async updateBookingRequestStatus(id: number, status: string, adminNotes?: string): Promise<BookingRequest | undefined> {
    const updates: Partial<BookingRequest> = { status, updatedAt: new Date() };
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    const [row] = await db.update(bookingRequests).set(updates).where(eq(bookingRequests.id, id)).returning();
    return row;
  }

  async updateBookingRequestExternalIds(id: number, ids: { googleEventId?: string; connecteamShiftId?: string; crmBookingId?: string }): Promise<BookingRequest | undefined> {
    const updates: any = { updatedAt: new Date() };
    if (ids.googleEventId) updates.googleEventId = ids.googleEventId;
    if (ids.connecteamShiftId) updates.connecteamShiftId = ids.connecteamShiftId;
    if (ids.crmBookingId) updates.crmBookingId = ids.crmBookingId;
    const [row] = await db.update(bookingRequests).set(updates).where(eq(bookingRequests.id, id)).returning();
    return row;
  }

  async createIntakeSubmission(data: InsertIntakeSubmission): Promise<IntakeSubmission> {
    const [row] = await db.insert(intakeSubmissions).values(data).returning();
    return row;
  }

  async updateIntakeSubmissionEmail(id: number, status: "sent" | "failed"): Promise<void> {
    await db.update(intakeSubmissions)
      .set({ emailNotificationStatus: status })
      .where(eq(intakeSubmissions.id, id));
  }

  async updateIntakeSubmissionQuoteLead(id: number, quoteLeadId: number): Promise<void> {
    await db.update(intakeSubmissions)
      .set({ quoteLeadId })
      .where(eq(intakeSubmissions.id, id));
  }

  async updateIntakeSubmissionApprovalToken(id: number, token: string, expiresAt: Date): Promise<void> {
    await db.update(intakeSubmissions)
      .set({ approvalToken: token, approvalTokenExpires: expiresAt })
      .where(eq(intakeSubmissions.id, id));
  }

  async updateIntakeSubmissionApprovalStatus(id: number, status: "approved" | "rejected", method?: string): Promise<void> {
    const updates: any = {
      approvalStatus: status,
      approvalTimestamp: new Date(),
    };
    if (method) updates.approvalMethod = method;
    await db.update(intakeSubmissions)
      .set(updates)
      .where(eq(intakeSubmissions.id, id));
  }

  async updateIntakeSubmissionTwentySyncStatus(
    id: number,
    syncStatus: "pending" | "synced" | "failed",
    companyId?: string,
    contactId?: string,
    quoteRequestId?: string,
    error?: string
  ): Promise<void> {
    const updates: any = {
      twentySyncStatus: syncStatus,
      twentySyncedAt: syncStatus === "synced" ? new Date() : null,
    };
    if (companyId) updates.twentyCompanyId = companyId;
    if (contactId) updates.twentyContactId = contactId;
    if (quoteRequestId) updates.twentyQuoteRequestId = quoteRequestId;
    if (error) updates.twentySyncError = error;
    await db.update(intakeSubmissions)
      .set(updates)
      .where(eq(intakeSubmissions.id, id));
  }

  async updateIntakeSubmissionPaymentInfo(
    id: number,
    stripeCustomerId?: string,
    stripeSessionId?: string,
    invoiceId?: string
  ): Promise<void> {
    const updates: any = { updatedAt: new Date() };
    if (stripeCustomerId) updates.stripeCustomerId = stripeCustomerId;
    if (stripeSessionId) updates.stripeCheckoutSessionId = stripeSessionId;
    if (invoiceId) updates.invoiceId = invoiceId;

    await db.update(intakeSubmissions)
      .set(updates)
      .where(eq(intakeSubmissions.id, id));
  }

  async getIntakeSubmissions(limit = 50, offset = 0): Promise<IntakeSubmission[]> {
    return db.select().from(intakeSubmissions)
      .orderBy(desc(intakeSubmissions.createdAt))
      .limit(limit)
      .offset(offset);
  }
}

export const storage = new DatabaseStorage();
