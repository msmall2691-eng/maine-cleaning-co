import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteLeadSchema } from "@shared/schema";
import { z } from "zod";
import { sendLeadNotification, sendCustomerConfirmation, sendPasswordResetEmail, sendIntakeNotification } from "./email";
import { intakeSubmitSchema } from "./lib/validators";
import { normalizeIntakePayload } from "./lib/normalize";
import { createQuoteRequestInTwenty } from "./lib/twenty";
import { generateApprovalToken, buildApprovalLink } from "./lib/approval";
import { sendApprovalQuoteSMS, parseTwilioWebhook, isApprovalResponse, isRejectionResponse, isTwilioConfigured, sendInvoiceSMS } from "./lib/twilio";
import { createOrGetStripeCustomer, createCheckoutSession, isStripeConfigured, verifyStripeWebhookSignature, formatAmountForDisplay } from "./lib/stripe";
import { generateInvoiceData, formatInvoiceAsText, generateInvoiceSMSSummary } from "./lib/invoice";
import crypto from "crypto";
import { setupAuth, hashPassword, comparePassword, requireAuth, requireAdmin } from "./auth";
import OpenAI from "openai";

const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "https://connecteam-proxy.vercel.app/api/leads";

function log(level: "INFO" | "WARN" | "ERROR", context: string, message: string, data?: Record<string, any>) {
  const ts = new Date().toISOString();
  const extra = data ? ` ${JSON.stringify(data)}` : "";
  console[level === "ERROR" ? "error" : "log"](`[${ts}] [${level}] [${context}] ${message}${extra}`);
}

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const key = `${ip}`;
  const hits = rateLimitMap.get(key) || [];
  const recent = hits.filter((t) => now - t < windowMs);
  if (recent.length >= maxRequests) return false;
  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

function checkAuthRateLimit(ip: string): boolean {
  return checkRateLimit(`auth:${ip}`, 5, 60_000);
}

function checkResetRateLimit(ip: string): boolean {
  return checkRateLimit(`reset:${ip}`, 3, 15 * 60_000);
}

setInterval(() => {
  const now = Date.now();
  const maxWindow = 15 * 60_000;
  for (const [key, hits] of Array.from(rateLimitMap.entries())) {
    const recent = hits.filter((t: number) => now - t < maxWindow);
    if (recent.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, recent);
  }
}, 60_000);

let weatherCache: { data: any; timestamp: number } | null = null;
const WEATHER_TTL = 30 * 60 * 1000;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  (async () => {
    try {
      const adminEmail = "admin@maine-clean.co";
      const existing = await storage.getUserByEmail(adminEmail);
      if (!existing) {
        const adminPw = process.env.ADMIN_PASSWORD;
        if (!adminPw) {
          log("WARN", "init", "ADMIN_PASSWORD env var not set — skipping admin user creation. Set ADMIN_PASSWORD to enable admin access.");
          return;
        }
        const hashed = await hashPassword(adminPw);
        await storage.createUser({
          username: adminEmail,
          password: hashed,
          email: adminEmail,
          name: "Admin",
          phone: null,
          role: "admin",
        });
        log("INFO", "init", "Admin user created", { email: adminEmail });
      }
    } catch (err) {
      log("ERROR", "init", "Failed to seed admin user", { error: String(err) });
    }
  })();

  app.post("/api/auth/register", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkAuthRateLimit(ip)) {
        res.status(429).json({ message: "Too many attempts. Please try again later." });
        return;
      }
      const { email, password, name, phone } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ message: "An account with this email already exists" });
        return;
      }
      const existingUsername = await storage.getUserByUsername(email);
      if (existingUsername) {
        res.status(409).json({ message: "An account with this email already exists" });
        return;
      }
      const hashed = await hashPassword(password);
      const user = await storage.createUser({
        username: email,
        password: hashed,
        email,
        name: name || null,
        phone: phone || null,
        role: "client",
      });
      req.session.userId = user.id;
      req.session.role = user.role;
      log("INFO", "auth", "New user registered", { userId: user.id, email });
      res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
      log("ERROR", "auth", "Registration failed", { error: String(error) });
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkAuthRateLimit(ip)) {
        res.status(429).json({ message: "Too many attempts. Please try again later." });
        return;
      }
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      const valid = await comparePassword(password, user.password);
      if (!valid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      log("INFO", "auth", "User logged in", { userId: user.id, email: user.email, role: user.role });
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
      log("ERROR", "auth", "Login failed", { error: String(error) });
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkResetRateLimit(ip)) {
        res.status(429).json({ message: "Too many reset requests. Please try again later." });
        return;
      }
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      log("INFO", "auth", "Password reset requested", { email: normalizedEmail });
      const user = await storage.getUserByEmail(normalizedEmail);
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await storage.setResetToken(user.id, token, expiry);
        const host = req.headers.host || "maine-clean.co";
        const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
        const resetLink = `${protocol}://${host}/portal/reset-password?token=${token}`;
        log("INFO", "auth", "Sending reset email", { to: user.email || normalizedEmail, link: resetLink });
        try {
          await sendPasswordResetEmail(user.email || normalizedEmail, user.name, resetLink);
          log("INFO", "auth", "Reset email sent successfully", { to: user.email || normalizedEmail });
        } catch (err) {
          log("ERROR", "auth", "Failed to send reset email", { error: String(err), stack: (err as Error).stack });
        }
      } else {
        log("INFO", "auth", "No user found for reset email", { email: normalizedEmail });
      }
      res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (error) {
      log("ERROR", "auth", "Forgot password failed", { error: String(error) });
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ message: "Token and new password are required" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
      }
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        res.status(400).json({ message: "This reset link has expired or is invalid. Please request a new one." });
        return;
      }
      const hashed = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashed);
      await storage.clearResetToken(user.id);
      log("INFO", "auth", "Password reset successful", { userId: user.id });
      res.json({ message: "Password updated successfully. You can now sign in." });
    } catch (error) {
      log("ERROR", "auth", "Reset password failed", { error: String(error) });
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  app.get("/api/portal/quotes", requireAuth, async (req, res) => {
    try {
      const quotes = await storage.getQuoteLeadsByClient(req.session.userId!);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post("/api/portal/quotes/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const lead = await storage.getQuoteLead(id);
      if (!lead || lead.clientId !== req.session.userId) {
        res.status(404).json({ message: "Quote not found" });
        return;
      }
      const updated = await storage.updateQuoteLeadStatus(id, "Approved");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve quote" });
    }
  });

  app.get("/api/portal/onboarding/:quoteId", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId as string);
      const checklist = await storage.getOnboardingChecklist(req.session.userId!, quoteId);
      res.json(checklist || { formResponses: {} });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch onboarding" });
    }
  });

  app.put("/api/portal/onboarding/:quoteId", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId as string);
      const lead = await storage.getQuoteLead(quoteId);
      if (!lead || lead.clientId !== req.session.userId) {
        res.status(404).json({ message: "Quote not found" });
        return;
      }
      const rawResponses = req.body.formResponses || {};
      const formResponses: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawResponses)) {
        if (typeof key === "string" && typeof value === "string") {
          formResponses[key] = String(value).slice(0, 1000);
        }
      }
      const checklist = await storage.upsertOnboardingChecklist({
        clientId: req.session.userId!,
        quoteId,
        serviceType: lead.serviceType,
        formResponses,
      });
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update onboarding" });
    }
  });

  app.get("/api/portal/contracts", requireAuth, async (req, res) => {
    try {
      const contractList = await storage.getContractsByClient(req.session.userId!);
      res.json(contractList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post("/api/portal/contracts/:id/sign", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { signedName } = req.body;
      if (!signedName) {
        res.status(400).json({ message: "Signature name is required" });
        return;
      }
      const contract = await storage.signContract(id, signedName);
      if (!contract) {
        res.status(404).json({ message: "Contract not found" });
        return;
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to sign contract" });
    }
  });

  app.get("/api/portal/schedule", requireAuth, async (req, res) => {
    try {
      const cleanings = await storage.getScheduledCleanings(req.session.userId!);
      res.json(cleanings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  app.post("/api/portal/schedule", requireAuth, async (req, res) => {
    try {
      const { serviceType, scheduledDate, notes, preferredTime } = req.body;
      if (!serviceType || !scheduledDate) {
        res.status(400).json({ message: "Service type and date are required" });
        return;
      }
      const date = new Date(scheduledDate);
      if (preferredTime) {
        const [hours, minutes] = preferredTime.split(":").map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      const cleaning = await storage.createScheduledCleaning({
        clientId: req.session.userId!,
        serviceType,
        scheduledDate: date,
        notes: notes || null,
        status: "requested",
      });
      res.json(cleaning);
    } catch (error) {
      res.status(500).json({ message: "Failed to create cleaning" });
    }
  });

  app.patch("/api/portal/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { scheduledDate, notes, status, preferredTime } = req.body;
      const updateData: any = {};
      if (scheduledDate) {
        const date = new Date(scheduledDate);
        if (preferredTime) {
          const [hours, minutes] = preferredTime.split(":").map(Number);
          date.setHours(hours, minutes, 0, 0);
        }
        updateData.scheduledDate = date;
      }
      if (notes !== undefined) updateData.notes = notes;
      if (status) updateData.status = status;
      const cleaning = await storage.updateScheduledCleaning(id, req.session.userId!, updateData);
      if (!cleaning) {
        res.status(404).json({ message: "Cleaning not found" });
        return;
      }
      res.json(cleaning);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cleaning" });
    }
  });

  app.delete("/api/portal/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await storage.deleteScheduledCleaning(id, req.session.userId!);
      if (!deleted) {
        res.status(404).json({ message: "Cleaning not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cleaning" });
    }
  });

  app.get("/api/portal/payments", requireAuth, async (req, res) => {
    try {
      const paymentList = await storage.getPayments(req.session.userId!);
      res.json(paymentList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/intake/submit", async (req, res) => {
    try {
      const parseResult = intakeSubmitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        });
      }

      const rawPayload = parseResult.data;
      const normalized = normalizeIntakePayload(rawPayload);

      // Generate approval token for SMS/email links (24 hour expiration)
      const { token: approvalToken, expiresAt: approvalTokenExpires } = generateApprovalToken(
        0, // Will be set after submission created
        normalized.email,
        normalized.phone,
        24
      );

      const submission = await storage.createIntakeSubmission({
        source: rawPayload.source ?? "website_form",
        rawPayload: rawPayload as Record<string, any>,
        normalizedPayload: normalized as unknown as Record<string, any>,
        status: "new",
        emailNotificationStatus: "pending",
        processingStatus: "captured",
        quoteLeadId: null,
        approvalStatus: "pending",
        approvalToken,
        approvalTokenExpires,
        estimatedPrice: normalized.estimatePrice,
        preferredContactMethod: normalized.preferredContactMethod ?? "email",
        twentySyncStatus: "pending",
      });

      log("INFO", "intake", "New submission received", {
        id: submission.id,
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        estimateRange: normalized.estimateRange,
      });

      // Regenerate token now that we have the submission ID
      const { token: approvalTokenWithId } = generateApprovalToken(
        submission.id,
        normalized.email,
        normalized.phone,
        24
      );
      await storage.updateIntakeSubmissionApprovalToken(submission.id, approvalTokenWithId, approvalTokenExpires);

      // Build approval link for SMS/email
      const host = req.headers.host || "maine-clean.co";
      const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const approvalLink = buildApprovalLink(approvalTokenWithId, `${protocol}://${host}`);

      // Send intake notification with approval link
      sendIntakeNotification(submission.id, normalized as unknown as Record<string, any>, rawPayload as Record<string, any>)
        .then(() => storage.updateIntakeSubmissionEmail(submission.id, "sent"))
        .catch((err) => {
          console.error(`[intake] Email notification failed for INT-${submission.id}:`, err);
          storage.updateIntakeSubmissionEmail(submission.id, "failed").catch(() => {});
        });

      // Send SMS approval request (if phone and Twilio configured)
      if (normalized.phone && isTwilioConfigured()) {
        sendApprovalQuoteSMS(
          normalized.phone,
          normalized.name || "there",
          normalized.estimateRange || `$${normalized.estimateMin || "?"}–$${normalized.estimateMax || "?"}`,
          approvalLink
        )
          .then((messageSid) => {
            log("INFO", "sms", "Approval quote SMS sent", {
              submissionId: submission.id,
              phone: normalized.phone,
              messageSid,
            });
          })
          .catch((err) => {
            log("ERROR", "sms", "Failed to send approval SMS", {
              submissionId: submission.id,
              error: String(err),
            });
          });
      }

      // Forward to CRM webhook (fire-and-forget)
      const freqMap: Record<string, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };
      const crmPayload = {
        name: normalized.name || "",
        email: normalized.email || "",
        phone: normalized.phone || "",
        address: normalized.address || normalized.zip || "",
        service: normalized.serviceType || "custom",
        message: normalized.notes || `Estimate: $${normalized.estimateMin || "?"}–$${normalized.estimateMax || "?"}`,
        propertyType: normalized.serviceType === "str" ? "vacation-rental" : normalized.serviceType === "commercial" ? "commercial" : "residential",
        frequency: (normalized.frequency && freqMap[normalized.frequency as string]) || normalized.frequency || "",
        estimateMin: normalized.estimateMin || null,
        estimateMax: normalized.estimateMax || null,
        squareFeet: normalized.sqft || null,
        bathrooms: normalized.bathrooms || null,
        petHair: normalized.petHair || null,
        condition: normalized.condition || null,
        source: "Website",
      };
      log("INFO", "crm", "Forwarding intake to CRM", { intakeId: submission.id });
      fetch(CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crmPayload),
      })
        .then(async r => {
          const body = await r.text().catch(() => "");
          log("INFO", "crm", `CRM response`, { status: r.status, intakeId: submission.id });
        })
        .catch(err => log("ERROR", "crm", `CRM forward failed`, { error: String(err), intakeId: submission.id }));

      // Sync to Twenty CRM (non-blocking with status tracking)
      createQuoteRequestInTwenty({
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        address: normalized.address,
        zip: normalized.zip,
        serviceType: normalized.serviceType,
        frequency: normalized.frequency,
        sqft: normalized.sqft,
        bathrooms: normalized.bathrooms,
        petHair: normalized.petHair,
        condition: normalized.condition,
        estimateMin: normalized.estimateMin,
        estimateMax: normalized.estimateMax,
        notes: normalized.notes,
        source: "Website",
      }, submission.id);

      return res.status(201).json({
        success: true,
        id: submission.id,
        estimateMin: normalized.estimateMin,
        estimateMax: normalized.estimateMax,
        estimateRange: normalized.estimateRange,
        approvalLink,
        message: "Your request has been received. We'll be in touch shortly.",
      });
    } catch (error) {
      console.error("[intake] Failed to process submission:", error);
      return res.status(500).json({ success: false, message: "Failed to submit request. Please try again." });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        res.status(429).json({ message: "Too many requests. Please try again in a minute." });
        return;
      }

      const parsed = insertQuoteLeadSchema.parse(req.body);
      const lead = await storage.createQuoteLead(parsed);
      log("INFO", "quotes", "New quote lead created", { id: lead.id, email: lead.email, serviceType: lead.serviceType });

      let tempPassword: string | undefined;
      let portalAccountCreated = false;
      let portalLoggedIn = false;
      let existingAccount = false;

      if (lead.email) {
        const existingUser = await storage.getUserByEmail(lead.email);
        if (existingUser) {
          await storage.updateQuoteLeadClient(lead.id, existingUser.id);
          lead.clientId = existingUser.id;
          existingAccount = true;
        } else {
          tempPassword = crypto.randomBytes(4).toString('hex');
          const hashedPw = await hashPassword(tempPassword);
          const newUser = await storage.createUser({
            username: lead.email,
            password: hashedPw,
            email: lead.email,
            name: lead.name || null,
            phone: lead.phone || null,
            role: "client",
          });
          await storage.updateQuoteLeadClient(lead.id, newUser.id);
          lead.clientId = newUser.id;
          portalAccountCreated = true;

          if (!req.session.userId) {
            req.session.userId = newUser.id;
            req.session.role = "client";
            portalLoggedIn = true;
          }
        }
      }

      const emailConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
      if (emailConfigured) {
        sendLeadNotification(lead).catch((err) => console.error("[email] lead notification error:", err));
        sendCustomerConfirmation(lead, tempPassword).catch((err) => console.error("[email] customer confirmation error:", err));
      }
      log("INFO", "quotes", "Quote created", {
        to: lead.email,
        newAccount: !!tempPassword,
        leadId: lead.id,
        emailSent: emailConfigured,
      });

      // Forward to CRM
      const crmFreqMap: Record<string, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };
      const crmServiceLabels: Record<string, string> = {
        standard: "Standard Clean", deep: "Deep Clean", str: "Vacation Rental Turnover",
        "vacation-rental": "Vacation Rental Turnover", commercial: "Commercial Cleaning",
        "move-in-out": "Move-In/Move-Out Clean",
      };
      const crmPropertyTypes: Record<string, string> = {
        standard: "residential", deep: "residential", str: "vacation-rental",
        "vacation-rental": "vacation-rental", commercial: "commercial", "move-in-out": "residential",
      };
      const quoteCrmPayload = {
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        address: lead.address || (lead as any).zip || "",
        service: crmServiceLabels[lead.serviceType] || lead.serviceType,
        message: `${lead.sqft ? lead.sqft + " sqft" : ""}${lead.bathrooms ? ", " + lead.bathrooms + " bath" : ""}${lead.estimateMin ? ". Estimate: $" + lead.estimateMin + "–$" + lead.estimateMax : ""}${lead.notes ? ". " + lead.notes : ""}`.replace(/^, /, "").trim() || "Custom quote request",
        propertyType: crmPropertyTypes[lead.serviceType] || "residential",
        frequency: crmFreqMap[lead.frequency] || lead.frequency || "",
        estimateMin: lead.estimateMin,
        estimateMax: lead.estimateMax,
        squareFeet: lead.sqft,
        bathrooms: lead.bathrooms,
        petHair: lead.petHair,
        condition: lead.condition,
        source: "Website",
      };
      log("INFO", "crm", "Forwarding quote to CRM", { payload: quoteCrmPayload, leadId: lead.id });
      fetch(CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteCrmPayload),
      })
        .then(async r => {
          const body = await r.text().catch(() => "");
          log("INFO", "crm", `CRM response`, { status: r.status, body: body.slice(0, 300), leadId: lead.id });
        })
        .catch(err => log("ERROR", "crm", `CRM forward failed`, { error: String(err), leadId: lead.id }));

      const webhookUrl = process.env.WEBHOOK_URL;
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (webhookUrl && webhookSecret) {
        const serviceTypeMap: Record<string, string> = {
          standard: "Standard Clean",
          deep: "Deep Clean",
          str: "Vacation Rental Turnover",
          "vacation-rental": "Vacation Rental Turnover",
          commercial: "Commercial Cleaning",
          "move-in-out": "Move-In/Move-Out Clean",
        };
        const webhookPayload = {
          source: "website",
          customerName: lead.name || "",
          customerEmail: lead.email || "",
          customerPhone: lead.phone || "",
          propertyAddress: lead.address || (lead as any).zip || "",
          serviceType: serviceTypeMap[lead.serviceType] || lead.serviceType,
          frequency: lead.frequency,
          preferredDate: "",
          notes: `${lead.sqft} sqft, ${lead.bathrooms} bath, ${lead.petHair} pets, ${lead.condition} condition. ${lead.notes || ""}`.trim(),
          estimateRange: `$${lead.estimateMin}-$${lead.estimateMax}`,
        };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": webhookSecret,
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal,
        })
          .then(async (r) => {
            clearTimeout(timeout);
            if (r.ok) {
              log("INFO", "webhook", "Lead forwarded to Asset Manager", { status: r.status, leadId: lead.id });
            } else {
              const body = await r.text().catch(() => "");
              log("WARN", "webhook", "Asset Manager rejected lead", { status: r.status, leadId: lead.id, body: body.slice(0, 200) });
            }
          })
          .catch((err) => {
            clearTimeout(timeout);
            log("ERROR", "webhook", "Failed to forward lead", { error: String(err), leadId: lead.id });
          });
      }

      const railwayUrl = "https://maine-cleaning-admin-production.up.railway.app/api/intake";
      {
        const serviceTypeMap: Record<string, string> = {
          standard: "Standard Clean",
          deep: "Deep Clean",
          str: "Vacation Rental Turnover",
          "vacation-rental": "Vacation Rental Turnover",
          commercial: "Commercial Cleaning",
          "move-in-out": "Move-In/Move-Out Clean",
        };
        const nameParts = (lead.name || "").trim().split(/\s+/);
        const railwayPayload = {
          firstName: nameParts[0] || lead.name || "",
          lastName: nameParts.slice(1).join(" "),
          email: lead.email || "",
          phone: lead.phone || "",
          address: lead.address || (lead as any).zip || "",
          serviceType: serviceTypeMap[lead.serviceType] || lead.serviceType,
          frequency: lead.frequency,
          bedrooms: null,
          bathrooms: lead.bathrooms,
          sqft: lead.sqft,
          notes: [
            `${lead.sqft} sqft`,
            `${lead.bathrooms} bath`,
            `Condition: ${lead.condition}`,
            `Pets: ${lead.petHair}`,
            lead.notes || "",
          ].filter(Boolean).join(" · "),
          source: "instant_estimate",
          estimateRange: `$${lead.estimateMin}–$${lead.estimateMax}`,
          submissionId: `QT-${lead.id}`,
        };
        const railwayController = new AbortController();
        const railwayTimeout = setTimeout(() => railwayController.abort(), 15000);
        fetch(railwayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(railwayPayload),
          signal: railwayController.signal,
        })
          .then(async (r) => {
            clearTimeout(railwayTimeout);
            if (r.ok) {
              log("INFO", "webhook", "Lead forwarded to Railway", { status: r.status, leadId: lead.id });
            } else {
              const body = await r.text().catch(() => "");
              log("WARN", "webhook", "Railway rejected lead", { status: r.status, leadId: lead.id, body: body.slice(0, 200) });
            }
          })
          .catch((err) => {
            clearTimeout(railwayTimeout);
            log("ERROR", "webhook", "Failed to forward lead to Railway", { error: String(err), leadId: lead.id });
          });
      }

      res.status(201).json({
        ...lead,
        portalAccountCreated,
        portalLoggedIn,
        existingAccount,
        emailSent: emailConfigured,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        log("WARN", "quotes", "Validation error on quote submission", { errors: error.errors });
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        log("ERROR", "quotes", "Failed to create quote lead", { error: String(error) });
        res.status(500).json({ message: "Failed to create quote lead" });
      }
    }
  });

  app.get("/api/quotes", requireAdmin, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const includeArchived = req.query.includeArchived === "true";

      const result = await storage.getQuoteLeads({ status, limit, offset, includeArchived });
      log("INFO", "admin", "Fetched quote leads", { count: result.leads.length, status, limit, offset });
      res.json(result);
    } catch (error) {
      log("ERROR", "admin", "Failed to fetch quote leads", { error: String(error) });
      res.status(500).json({ message: "Failed to fetch quote leads" });
    }
  });

  app.get("/api/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      const lead = await storage.getQuoteLead(id);
      if (!lead) {
        res.status(404).json({ message: "Quote lead not found" });
        return;
      }
      res.json(lead);
    } catch (error) {
      log("ERROR", "admin", "Failed to fetch quote lead", { id: req.params.id, error: String(error) });
      res.status(500).json({ message: "Failed to fetch quote lead" });
    }
  });

  app.patch("/api/quotes/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      const { status } = req.body;
      if (!status || typeof status !== "string") {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      const validStatuses = ["New", "Reviewed", "Booked", "Transferred"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        return;
      }
      const lead = await storage.updateQuoteLeadStatus(id, status);
      if (!lead) {
        res.status(404).json({ message: "Quote lead not found" });
        return;
      }
      log("INFO", "admin", "Updated quote lead status", { id, status });
      res.json(lead);
    } catch (error) {
      log("ERROR", "admin", "Failed to update quote lead status", { id: req.params.id, error: String(error) });
      res.status(500).json({ message: "Failed to update quote lead status" });
    }
  });

  app.delete("/api/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      const lead = await storage.archiveQuoteLead(id);
      if (!lead) {
        res.status(404).json({ message: "Quote lead not found" });
        return;
      }
      log("INFO", "admin", "Archived quote lead", { id });
      res.json({ message: "Lead archived", lead });
    } catch (error) {
      log("ERROR", "admin", "Failed to archive quote lead", { id: req.params.id, error: String(error) });
      res.status(500).json({ message: "Failed to archive quote lead" });
    }
  });

  const weatherCodeMap: Record<number, { label: string; icon: string }> = {
    0: { label: "Clear", icon: "sun" },
    1: { label: "Mostly Clear", icon: "sun" },
    2: { label: "Partly Cloudy", icon: "cloud-sun" },
    3: { label: "Overcast", icon: "cloud" },
    45: { label: "Foggy", icon: "cloud-fog" },
    48: { label: "Icy Fog", icon: "cloud-fog" },
    51: { label: "Light Drizzle", icon: "cloud-drizzle" },
    53: { label: "Drizzle", icon: "cloud-drizzle" },
    55: { label: "Heavy Drizzle", icon: "cloud-drizzle" },
    61: { label: "Light Rain", icon: "cloud-rain" },
    63: { label: "Rain", icon: "cloud-rain" },
    65: { label: "Heavy Rain", icon: "cloud-rain" },
    71: { label: "Light Snow", icon: "cloud-snow" },
    73: { label: "Snow", icon: "cloud-snow" },
    75: { label: "Heavy Snow", icon: "cloud-snow" },
    77: { label: "Snow Grains", icon: "cloud-snow" },
    80: { label: "Light Showers", icon: "cloud-rain" },
    81: { label: "Showers", icon: "cloud-rain" },
    82: { label: "Heavy Showers", icon: "cloud-rain" },
    85: { label: "Snow Showers", icon: "cloud-snow" },
    86: { label: "Heavy Snow Showers", icon: "cloud-snow" },
    95: { label: "Thunderstorm", icon: "cloud-lightning" },
    96: { label: "Thunderstorm w/ Hail", icon: "cloud-lightning" },
    99: { label: "Severe Thunderstorm", icon: "cloud-lightning" },
  };

  app.get("/api/weather", async (_req, res) => {
    try {
      const now = Date.now();
      if (weatherCache && now - weatherCache.timestamp < WEATHER_TTL) {
        res.json(weatherCache.data);
        return;
      }

      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=43.66&longitude=-70.26&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York&forecast_days=5"
      );

      if (!response.ok) {
        res.status(502).json({ message: "Weather service unavailable" });
        return;
      }

      const raw = await response.json();
      const current = raw.current;
      const daily = raw.daily;

      const currentCode = current.weather_code;
      const currentInfo = weatherCodeMap[currentCode] || { label: "Unknown", icon: "cloud" };

      const forecast = daily.time.map((date: string, i: number) => {
        const code = daily.weather_code[i];
        const info = weatherCodeMap[code] || { label: "Unknown", icon: "cloud" };
        return {
          date,
          high: Math.round(daily.temperature_2m_max[i]),
          low: Math.round(daily.temperature_2m_min[i]),
          label: info.label,
          icon: info.icon,
        };
      });

      const data = {
        current: {
          temp: Math.round(current.temperature_2m),
          label: currentInfo.label,
          icon: currentInfo.icon,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
        },
        forecast,
        location: "Portland, ME",
      };

      weatherCache = { data, timestamp: now };
      res.json(data);
    } catch (error) {
      res.status(502).json({ message: "Weather service unavailable" });
    }
  });

  let aiTipCache: { tip: string; timestamp: number } | null = null;
  const AI_TIP_TTL = 24 * 60 * 60 * 1000;

  const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const SYSTEM_PROMPT = `You are the AI assistant for The Maine Cleaning Co., a premium residential and commercial cleaning company serving Southern Maine (Portland, Scarborough, Falmouth, Windham, Naples, Kennebunk, Gorham, and surrounding towns).

Services offered:
- Standard Residential Cleaning (weekly/biweekly/monthly) — starting at $120
- Deep Cleaning — starting at $200, includes baseboards, inside appliances, grout
- Vacation Rental Turnovers — guest-ready cleanings between stays
- Move-In/Move-Out Cleaning — empty-property deep clean
- Commercial Cleaning — offices, dental practices, car clubs, group homes

Pricing factors: Square footage (÷725 = base hours), number of bathrooms, property condition, pet hair level, cleaning frequency (weekly cheapest, one-time most expensive). Rate is $62/hour. Deep clean multiplier is 1.5x. Prices rounded to nearest $5 with a ±6% range shown.

Coverage area: Southern Maine including Portland, South Portland, Scarborough, Falmouth, Gorham, Windham, Naples, Casco, Standish, West Baldwin, Kennebunk, Old Orchard Beach, Waterboro.

Company details: 7+ years in business, 5,000+ cleans completed, 4.9 Google rating, eco-friendly products, fully insured. Phone: 207-572-0502, Email: office@mainecleaningco.com

Rules:
- Be warm, professional, and concise (2-4 sentences per response)
- If asked about pricing, give a general range and direct them to use the Instant Estimate widget on the homepage
- Never make up specific prices for a customer's property without them using the estimate tool
- If the conversation goes beyond 5 messages, gently direct them to request a formal estimate
- You cannot book appointments — direct to the estimate form or phone`;

  const aiChatRateLimit = new Map<string, number[]>();
  const AI_RATE_WINDOW = 60_000;
  const AI_RATE_MAX = 10;

  function checkAIRateLimit(ip: string): boolean {
    const now = Date.now();
    const hits = aiChatRateLimit.get(ip) || [];
    const recent = hits.filter(t => now - t < AI_RATE_WINDOW);
    if (recent.length >= AI_RATE_MAX) return false;
    recent.push(now);
    aiChatRateLimit.set(ip, recent);
    return true;
  }

  app.get("/api/ai/cleaning-tip", async (_req, res) => {
    try {
      const now = Date.now();
      if (aiTipCache && now - aiTipCache.timestamp < AI_TIP_TTL) {
        res.json({ tip: aiTipCache.tip });
        return;
      }

      const month = new Date().toLocaleString("en-US", { month: "long" });
      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a cleaning expert for The Maine Cleaning Co. in Southern Maine. Generate a short, helpful seasonal cleaning tip (2-3 sentences) relevant to the current time of year in coastal Maine. Be specific and actionable. Do not use quotation marks around the tip."
          },
          { role: "user", content: `Generate a cleaning tip for ${month} in Southern Maine.` }
        ],
        max_tokens: 150,
      });

      const tip = response.choices[0]?.message?.content || "Keep your home fresh by regularly wiping down high-touch surfaces and letting in fresh air when the weather permits.";
      aiTipCache = { tip, timestamp: now };
      res.json({ tip });
    } catch (error) {
      const fallbackTips = [
        "Maine's coastal humidity can lead to mildew buildup in bathrooms. Wipe down tile and grout weekly, and keep exhaust fans running for 10 minutes after every shower.",
        "Salt residue from winter roads tracks indoors easily. Place quality doormats at every entrance and mop hard floors weekly to prevent buildup.",
        "Spring pollen in Southern Maine settles on every surface. Dust with damp microfiber cloths to capture particles instead of spreading them around."
      ];
      res.json({ tip: fallbackTips[Math.floor(Math.random() * fallbackTips.length)] });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkAIRateLimit(clientIp)) {
        res.status(429).json({ reply: "You're sending messages too quickly. Please wait a moment and try again." });
        return;
      }

      const { messages } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ message: "Messages array is required" });
        return;
      }

      if (messages.length > 20) {
        res.json({ reply: "It looks like we've had a great conversation! For the best experience, I'd recommend using our Instant Estimate tool on the homepage or calling us at 207-572-0502 to discuss your cleaning needs in detail." });
        return;
      }

      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10).map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        max_tokens: 300,
      });

      const reply = response.choices[0]?.message?.content || "I'd be happy to help! Feel free to check out our Instant Estimate tool or call us at 207-572-0502.";
      res.json({ reply });
    } catch (error: any) {
      console.error("AI chat error:", error?.message || error);
      res.json({ reply: "I'm having a little trouble right now, but I'd love to help! You can reach us directly at 207-572-0502 or use the Instant Estimate tool on our homepage." });
    }
  });

  // ── BOOKING REQUESTS ──

  // North Waterboro, ME coordinates
  const SERVICE_CENTER_LAT = 43.5712;
  const SERVICE_CENTER_LNG = -70.7287;
  const MAX_SERVICE_RADIUS_MILES = 30;
  const MIN_LEAD_DAYS = 2;

  function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ", Maine, USA")}&format=json&limit=1`,
        { headers: { "User-Agent": "MaineCleaningCo-Booking", "Accept-Language": "en" } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
      return null;
    }
  }

  app.post("/api/booking/validate-address", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) return res.status(400).json({ eligible: false, message: "Address is required" });

      const coords = await geocodeAddress(address);
      if (!coords) return res.json({ eligible: false, message: "We couldn't verify that address. Please check it and try again." });

      const distance = haversineDistance(SERVICE_CENTER_LAT, SERVICE_CENTER_LNG, coords.lat, coords.lng);
      const eligible = distance <= MAX_SERVICE_RADIUS_MILES;

      res.json({
        eligible,
        distanceMiles: Math.round(distance),
        message: eligible
          ? `You're ${Math.round(distance)} miles from our service center — you're in our area!`
          : `Unfortunately, ${Math.round(distance)} miles is outside our ${MAX_SERVICE_RADIUS_MILES}-mile service area from North Waterboro. Call us at 207-572-0502 to discuss options.`,
      });
    } catch (error) {
      log("ERROR", "booking", "Address validation failed", { error: String(error) });
      res.status(500).json({ eligible: false, message: "Address validation failed. Please try again." });
    }
  });

  const bookingSubmitSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(1),
    address: z.string().min(1),
    zip: z.string().optional().nullable(),
    serviceType: z.string(),
    frequency: z.string().optional().nullable(),
    sqft: z.number().optional().nullable(),
    bathrooms: z.number().optional().nullable(),
    petHair: z.string().optional().nullable(),
    condition: z.string().optional().nullable(),
    estimateMin: z.number().optional().nullable(),
    estimateMax: z.number().optional().nullable(),
    requestedDate: z.string().min(1),
    distanceMiles: z.number().optional().nullable(),
    intakeId: z.number().optional().nullable(),
  });

  app.post("/api/booking/submit", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
      }

      const parsed = bookingSubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      }

      const data = parsed.data;
      const requestedDate = new Date(data.requestedDate);
      const now = new Date();
      const minDate = new Date(now.getTime() + MIN_LEAD_DAYS * 24 * 60 * 60 * 1000);
      minDate.setHours(0, 0, 0, 0);

      if (requestedDate < minDate) {
        return res.status(400).json({ success: false, message: `Please select a date at least ${MIN_LEAD_DAYS} days from today.` });
      }

      // Validate distance if not already provided
      let distanceMiles = data.distanceMiles;
      if (!distanceMiles && data.address) {
        const coords = await geocodeAddress(data.address);
        if (coords) {
          distanceMiles = Math.round(haversineDistance(SERVICE_CENTER_LAT, SERVICE_CENTER_LNG, coords.lat, coords.lng));
        }
      }
      if (distanceMiles && distanceMiles > MAX_SERVICE_RADIUS_MILES) {
        return res.status(400).json({ success: false, message: `Sorry, ${distanceMiles} miles is outside our ${MAX_SERVICE_RADIUS_MILES}-mile service area.` });
      }

      const booking = await storage.createBookingRequest({
        intakeId: data.intakeId ?? null,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone,
        address: data.address,
        zip: data.zip ?? null,
        serviceType: data.serviceType,
        frequency: data.frequency ?? null,
        sqft: data.sqft ?? null,
        bathrooms: data.bathrooms ?? null,
        petHair: data.petHair ?? null,
        condition: data.condition ?? null,
        estimateMin: data.estimateMin ?? null,
        estimateMax: data.estimateMax ?? null,
        requestedDate: requestedDate,
        distanceMiles: distanceMiles ?? null,
      });

      log("INFO", "booking", "New booking request created", { id: booking.id, date: data.requestedDate, name: data.name });

      // Forward to CRM for approval workflow (uses leads endpoint with booking- prefix)
      const CRM_BOOKING_URL = process.env.CRM_WEBHOOK_URL || "https://connecteam-proxy.vercel.app/api/leads";

      fetch(CRM_BOOKING_URL + "?action=booking-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteBookingId: booking.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          zip: data.zip,
          serviceType: data.serviceType,
          frequency: data.frequency,
          sqft: data.sqft,
          bathrooms: data.bathrooms,
          petHair: data.petHair,
          condition: data.condition,
          estimateMin: data.estimateMin,
          estimateMax: data.estimateMax,
          requestedDate: data.requestedDate,
          distanceMiles: distanceMiles,
          source: "Website",
        }),
      })
        .then(async r => {
          const body = await r.text().catch(() => "");
          log("INFO", "booking", "CRM booking forward response", { status: r.status, body: body.slice(0, 300) });
          try {
            const json = JSON.parse(body);
            if (json.bookingId) {
              storage.updateBookingRequestExternalIds(booking.id, { crmBookingId: String(json.bookingId) }).catch(() => {});
            }
          } catch {}
        })
        .catch(err => log("ERROR", "booking", "CRM booking forward failed", { error: String(err) }));

      // Sync to Twenty CRM (non-blocking)
      createQuoteRequestInTwenty({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        zip: data.zip,
        serviceType: data.serviceType,
        frequency: data.frequency,
        sqft: data.sqft,
        bathrooms: data.bathrooms,
        petHair: data.petHair,
        condition: data.condition,
        estimateMin: data.estimateMin,
        estimateMax: data.estimateMax,
        requestedDate: data.requestedDate,
        source: "Website",
      });

      return res.status(201).json({
        success: true,
        bookingId: booking.id,
        requestedDate: data.requestedDate,
        message: "Your booking request has been submitted! We'll review and confirm within 1 business day.",
      });
    } catch (error) {
      log("ERROR", "booking", "Booking submission failed", { error: String(error) });
      return res.status(500).json({ success: false, message: "Failed to submit booking request. Please try again." });
    }
  });

  // Admin: list booking requests
  app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getBookingRequests({ status });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin: approve/reject booking
  app.patch("/api/admin/bookings/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { status, adminNotes } = req.body;
      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const booking = await storage.updateBookingRequestStatus(id, status, adminNotes);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // ============================================================
  // SMS / Twilio Integration
  // ============================================================

  /**
   * GET /api/sms/approval-link/:token
   * Verify and approve submission via token (for email/SMS links)
   * CRITICAL: Only works if status is still "pending"
   */
  app.get("/api/sms/approval-link/:token", async (req, res) => {
    try {
      const token = req.params.token;
      if (!token) {
        return res.status(400).json({ success: false, message: "Invalid approval token" });
      }

      // Find submission by approval token
      const submissions = await storage.getIntakeSubmissions(1000);
      const submission = submissions.find((s) => s.approvalToken === token);

      if (!submission) {
        return res.status(404).json({ success: false, message: "Approval link not found or already used" });
      }

      // Check if token is expired
      if (submission.approvalTokenExpires && new Date(submission.approvalTokenExpires) < new Date()) {
        return res.status(410).json({ success: false, message: "Approval link has expired (24 hours)" });
      }

      // CRITICAL: Check if already approved (prevent multi-use)
      if (submission.approvalStatus !== "pending") {
        const status = submission.approvalStatus || "unknown";
        return res.status(400).json({
          success: false,
          message: `This request has already been ${status}. Each quote can only be approved once.`,
        });
      }

      // Mark as approved
      await storage.updateIntakeSubmissionApprovalStatus(submission.id, "approved", "link");

      log("INFO", "sms", "Request approved via link", {
        submissionId: submission.id,
        phone: (submission.normalizedPayload as any).phone,
      });

      // Return success response
      return res.status(200).json({
        success: true,
        id: submission.id,
        message: "Your request has been approved! We'll send you payment and scheduling info shortly.",
      });
    } catch (error) {
      log("ERROR", "sms", "Approval link verification failed", { error: String(error) });
      return res.status(500).json({ success: false, message: "Failed to process approval" });
    }
  });

  /**
   * POST /api/sms/send-approval/:submissionId
   * Manually send approval SMS to a submission
   * Can be called by admin or after intake capture
   * CRITICAL: Validates phone format before sending
   */
  app.post("/api/sms/send-approval/:submissionId", async (req, res) => {
    try {
      const submissionId = parseInt(req.params.submissionId);
      if (!submissionId) {
        return res.status(400).json({ success: false, message: "Invalid submission ID" });
      }

      if (!isTwilioConfigured()) {
        return res.status(503).json({ success: false, message: "SMS not configured" });
      }

      const submissions = await storage.getIntakeSubmissions(1000);
      const submission = submissions.find((s) => s.id === submissionId);

      if (!submission) {
        return res.status(404).json({ success: false, message: "Submission not found" });
      }

      const normalized = submission.normalizedPayload as any;
      if (!normalized.phone) {
        return res.status(400).json({ success: false, message: "No phone number on file" });
      }

      // CRITICAL: Validate phone is in E.164 format before sending
      if (!/^\+\d{10,15}$/.test(normalized.phone)) {
        log("ERROR", "sms", "Invalid phone format for SMS", {
          submissionId,
          phone: normalized.phone,
        });
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format. Please verify the phone number.",
        });
      }

      // Build approval link
      const host = req.headers.host || "maine-clean.co";
      const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const approvalLink = buildApprovalLink(submission.approvalToken!, `${protocol}://${host}`);

      // Send SMS
      const estimateRange = normalized.estimateRange || `$${normalized.estimateMin || "?"}–$${normalized.estimateMax || "?"}`;
      const messageSid = await sendApprovalQuoteSMS(normalized.phone, normalized.name || "there", estimateRange, approvalLink);

      if (!messageSid) {
        return res.status(500).json({ success: false, message: "Failed to send SMS" });
      }

      log("INFO", "sms", "Approval SMS sent", { submissionId, phone: normalized.phone, messageSid });

      return res.json({
        success: true,
        submissionId,
        messageSid,
        message: "Approval SMS sent successfully",
      });
    } catch (error) {
      log("ERROR", "sms", "Failed to send approval SMS", { error: String(error) });
      return res.status(500).json({ success: false, message: "Failed to send SMS" });
    }
  });

  /**
   * POST /api/webhooks/twilio/sms
   * Webhook to receive inbound SMS from Twilio
   * Handles approval responses via SMS replies
   */
  app.post("/api/webhooks/twilio/sms", async (req, res) => {
    try {
      // Parse Twilio webhook
      const inboundSMS = parseTwilioWebhook(req.body as Record<string, string | string[]>);
      if (!inboundSMS) {
        return res.status(400).json({ error: "Invalid Twilio webhook" });
      }

      log("INFO", "sms-webhook", "Inbound SMS received", {
        from: inboundSMS.from,
        body: inboundSMS.body,
        messageSid: inboundSMS.messageSid,
      });

      // Check if it's an approval response
      if (isApprovalResponse(inboundSMS.body)) {
        // Find submission by:
        // 1. Phone number matches
        // 2. Status is pending
        // 3. Token not expired
        // 4. OLDEST pending (if multiple, approve the first one)
        const submissions = await storage.getIntakeSubmissions(1000);
        const matchingPending = submissions.filter(
          (s) =>
            (s.normalizedPayload as any).phone === inboundSMS.from &&
            s.approvalStatus === "pending" &&
            s.approvalTokenExpires &&
            new Date(s.approvalTokenExpires) > new Date()
        );

        // Sort by created date - get oldest pending request
        matchingPending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const submission = matchingPending[0];

        if (submission) {
          await storage.updateIntakeSubmissionApprovalStatus(submission.id, "approved", "sms");
          log("INFO", "sms-webhook", "Request auto-approved via SMS reply", {
            submissionId: submission.id,
            from: inboundSMS.from,
            matchingCount: matchingPending.length,
          });

          // Send payment link SMS if Stripe is configured
          if (isStripeConfigured()) {
            const normalized = submission.normalizedPayload as any;
            const host = req.headers.host || "maine-clean.co";
            const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
            const paymentLink = `${protocol}://${host}/pay?submission=${submission.id}`;

            sendApprovalQuoteSMS(
              normalized.phone,
              normalized.name || "there",
              `Complete payment here: ${paymentLink}`,
              paymentLink
            ).catch((err) =>
              log("ERROR", "sms", "Failed to send payment SMS after approval", { error: String(err) })
            );
          }
        } else {
          log("WARN", "sms-webhook", "No valid pending approval found for phone", {
            from: inboundSMS.from,
            reason: matchingPending.length === 0 ? "no_pending" : "token_expired",
          });
        }
      } else if (isRejectionResponse(inboundSMS.body)) {
        // Find and mark as rejected (oldest pending, same logic)
        const submissions = await storage.getIntakeSubmissions(1000);
        const matchingPending = submissions.filter(
          (s) =>
            (s.normalizedPayload as any).phone === inboundSMS.from &&
            s.approvalStatus === "pending" &&
            s.approvalTokenExpires &&
            new Date(s.approvalTokenExpires) > new Date()
        );

        matchingPending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const submission = matchingPending[0];

        if (submission) {
          await storage.updateIntakeSubmissionApprovalStatus(submission.id, "rejected", "sms");
          log("INFO", "sms-webhook", "Request rejected via SMS reply", {
            submissionId: submission.id,
            from: inboundSMS.from,
          });
        }
      }

      // Return 200 OK to Twilio (webhook must succeed)
      res.status(200).send();
    } catch (error) {
      log("ERROR", "sms-webhook", "Webhook processing failed", { error: String(error) });
      // Still return 200 to prevent Twilio retries
      res.status(200).send();
    }
  });

  // ============================================================
  // Stripe Payment Integration
  // ============================================================

  /**
   * POST /api/payments/create-checkout
   * Create a Stripe checkout session for payment
   * Call this after customer approves the quote
   */
  app.post("/api/payments/create-checkout", async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ success: false, message: "Payments not available" });
      }

      const { submissionId } = req.body;
      if (!submissionId) {
        return res.status(400).json({ success: false, message: "Submission ID required" });
      }

      const submissions = await storage.getIntakeSubmissions(1000);
      const submission = submissions.find((s) => s.id === submissionId);

      if (!submission) {
        return res.status(404).json({ success: false, message: "Submission not found" });
      }

      const normalized = submission.normalizedPayload as any;
      if (!normalized.email || !normalized.estimateMin) {
        return res.status(400).json({ success: false, message: "Missing required fields for payment" });
      }

      // Create or get Stripe customer
      const customerId = await createOrGetStripeCustomer(
        normalized.email,
        normalized.name,
        normalized.phone
      );

      if (!customerId) {
        return res.status(500).json({ success: false, message: "Failed to create customer" });
      }

      // Build URLs
      const host = req.headers.host || "maine-clean.co";
      const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;

      const successUrl = `${baseUrl}/payment-success?submission=${submissionId}&session={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/payment-canceled?submission=${submissionId}`;

      // Create checkout session
      // CRITICAL: Amount MUST be in cents
      // estimatedPrice is already in cents from normalization
      // estimateMin/Max are in dollars, so multiply by 100
      let amountCents = submission.estimatedPrice;
      if (!amountCents && normalized.estimateMin && normalized.estimateMax) {
        const avgDollars = (normalized.estimateMin + normalized.estimateMax) / 2;
        amountCents = Math.round(avgDollars * 100);
      }

      if (!amountCents || amountCents < 50) {
        // Stripe minimum is $0.50
        return res.status(400).json({
          success: false,
          message: "Invalid amount. Minimum charge is $0.50",
        });
      }

      const checkoutUrl = await createCheckoutSession(
        customerId,
        submissionId,
        amountCents,
        `${normalized.serviceType || "Cleaning"} Service - ${normalized.frequency || "One-time"}`,
        successUrl,
        cancelUrl
      );

      if (!checkoutUrl) {
        return res.status(500).json({ success: false, message: "Failed to create checkout session" });
      }

      // Extract session ID from Stripe URL for idempotency checking
      const sessionId = checkoutUrl.split("/pay/")[1]?.split("?")[0] || "";

      // Save Stripe payment references
      await storage.updateIntakeSubmissionPaymentInfo(submissionId, customerId, sessionId);

      log("INFO", "payment", "Checkout session created", {
        submissionId,
        customerId,
        sessionId,
      });

      return res.json({
        success: true,
        submissionId,
        checkoutUrl,
        message: "Checkout session created successfully",
      });
    } catch (error) {
      log("ERROR", "payment", "Failed to create checkout", { error: String(error) });
      return res.status(500).json({ success: false, message: "Failed to create checkout session" });
    }
  });

  /**
   * POST /api/webhooks/stripe
   * Webhook to receive Stripe events
   * Handles payment completion, failures, etc.
   */
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        return res.status(400).json({ error: "No signature" });
      }

      // Get raw body for signature verification
      let rawBody = (req as any).rawBody;
      if (Buffer.isBuffer(rawBody)) {
        rawBody = rawBody.toString('utf-8');
      } else if (typeof rawBody !== 'string') {
        rawBody = JSON.stringify(req.body);
      }

      const event = verifyStripeWebhookSignature(rawBody, signature);
      if (!event) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      log("INFO", "stripe-webhook", "Event received", { type: event.type, id: event.id });

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const submissionId = parseInt(session.client_reference_id || "0");

        if (!submissionId) {
          log("WARN", "stripe-webhook", "No submission ID in session");
          return res.json({ received: true });
        }

        // CRITICAL: Check payment_status to ensure payment actually succeeded
        // checkout.session.completed fires even if payment fails in some cases
        if (session.payment_status !== "paid") {
          log("WARN", "stripe-webhook", "Session completed but payment not paid", {
            submissionId,
            paymentStatus: session.payment_status,
            sessionId: session.id,
          });
          return res.json({ received: true });
        }

        const submissions = await storage.getIntakeSubmissions(1000);
        const submission = submissions.find((s) => s.id === submissionId);

        if (!submission) {
          log("WARN", "stripe-webhook", "Submission not found", { submissionId });
          return res.json({ received: true });
        }

        // CRITICAL: Idempotency check - don't process if already handled
        if (submission.stripeCheckoutSessionId === session.id) {
          log("WARN", "stripe-webhook", "Duplicate webhook - already processed", {
            submissionId,
            sessionId: session.id,
          });
          return res.json({ received: true });
        }

        const normalized = submission.normalizedPayload as any;

        // Payment successful - create invoice
        const invoice = generateInvoiceData(
          submissionId,
          normalized.name || "Customer",
          normalized.email || "",
          normalized.phone || "",
          normalized.address || "",
          normalized.serviceType || "Cleaning",
          normalized.frequency || "One-time",
          normalized.estimateMin || 0,
          normalized.estimateMax || 0,
          normalized.sqft,
          normalized.bathrooms,
          normalized.notes
        );

        // Store invoice reference in database
        await storage.updateIntakeSubmissionPaymentInfo(submissionId, undefined, session.id, invoice.id);

        const invoiceText = formatInvoiceAsText(invoice);

        log("INFO", "payment", "Payment completed - invoice generated", {
          submissionId,
          invoiceId: invoice.id,
          amount: (submission.estimatedPrice || 0) / 100,
          sessionId: session.id,
          customerId: session.customer,
        });

        // Send invoice SMS if phone configured
        if (normalized.phone && isTwilioConfigured()) {
          const invoiceUrl = `${req.headers.host || "maine-clean.co"}/invoices/${invoice.id}`;
          const amountDisplay = formatAmountForDisplay(submission.estimatedPrice || 50000);

          sendInvoiceSMS(normalized.phone, normalized.name || "there", amountDisplay, invoiceUrl).catch(
            (err) => log("ERROR", "sms", "Failed to send invoice SMS", { error: String(err) })
          );
        }

        // TODO: Create booking if automatic scheduling enabled
        // TODO: Send booking confirmation email/SMS
      } else if (event.type === "charge.refunded") {
        const charge = event.data.object as any;
        log("INFO", "stripe-webhook", "Refund processed", {
          chargeId: charge.id,
          amount: charge.refunded,
        });
      } else {
        // Log unexpected events
        log("WARN", "stripe-webhook", "Unhandled event type", { type: event.type, id: event.id });
      }

      res.json({ received: true });
    } catch (error) {
      log("ERROR", "stripe-webhook", "Webhook processing failed", { error: String(error) });
      res.status(200).json({ received: true }); // Still return 200 to prevent retries
    }
  });

  return httpServer;
}
