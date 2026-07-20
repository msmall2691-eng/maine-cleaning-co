import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteLeadSchema, type BookingRequest } from "@shared/schema";
import { z } from "zod";
import { sendLeadNotification, sendCustomerConfirmation, sendPasswordResetEmail, sendIntakeNotification, sendBookingNotification, sendBookingCustomerEmail } from "./email";
import { intakeSubmitSchema } from "./lib/validators";
import { normalizeIntakePayload } from "./lib/normalize";
import { forwardLeadToBrightBase, forwardBookingUpdateToBrightBase } from "./lib/brightbase";
import { calculateQuote, estimatesDiverge } from "./lib/quoteEngine";
import { runForward } from "./lib/leadForward";
import { leadForwards } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
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
  for (const [key, hits] of rateLimitMap) {
    const recent = hits.filter((t) => now - t < maxWindow);
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
        log("INFO", "auth", "Sending reset email", { to: user.email || normalizedEmail });
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
      const id = parseInt(req.params.id);
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
      const quoteId = parseInt(req.params.quoteId);
      const checklist = await storage.getOnboardingChecklist(req.session.userId!, quoteId);
      res.json(checklist || { formResponses: {} });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch onboarding" });
    }
  });

  app.put("/api/portal/onboarding/:quoteId", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId);
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
      const id = parseInt(req.params.id);
      const { signedName } = req.body;
      if (!signedName) {
        res.status(400).json({ message: "Signature name is required" });
        return;
      }
      const contract = await storage.signContract(id, signedName, req.session.userId!);
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
      // parseFormDate (declared below, hoisted) — a bare "YYYY-MM-DD" must
      // not parse as UTC midnight or the cleaning lands on the previous
      // Eastern day. preferredTime still overrides the noon default.
      const date = parseFormDate(scheduledDate);
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
      const id = parseInt(req.params.id);
      const { scheduledDate, notes, status, preferredTime } = req.body;
      const updateData: any = {};
      if (scheduledDate) {
        // Same local-noon guard as the create path above.
        const date = parseFormDate(scheduledDate);
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
      const id = parseInt(req.params.id);
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
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
      }
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

      // Recompute the estimate server-side — same anti-tamper guarantee the
      // booking handler has. The intake path used to forward whatever
      // estimateMin/estimateMax the browser POSTed straight into Bright-Space's
      // Requests page, so a tampered client could seed the operator with a
      // fabricated price. Recompute from the structured fields and treat THAT
      // as the source of truth; keep the client's numbers only when the
      // service is custom-quoted (STR/commercial) or inputs are incomplete.
      const intakeQuote = calculateQuote({
        serviceType: normalized.serviceType ?? "",
        sqft: normalized.sqft,
        bathrooms: normalized.bathrooms,
        frequency: normalized.frequency,
        petHair: normalized.petHair,
        condition: normalized.condition,
      });
      if (estimatesDiverge(normalized.estimateMin, normalized.estimateMax, intakeQuote.estimateMin, intakeQuote.estimateMax)) {
        log("WARN", "intake", "Client-supplied estimate diverged from server recompute", {
          clientMin: normalized.estimateMin,
          clientMax: normalized.estimateMax,
          serverMin: intakeQuote.estimateMin,
          serverMax: intakeQuote.estimateMax,
          serviceType: normalized.serviceType,
        });
      }
      const trustedMin = intakeQuote.estimateMin ?? normalized.estimateMin ?? null;
      const trustedMax = intakeQuote.estimateMax ?? normalized.estimateMax ?? null;
      normalized.estimateMin = trustedMin;
      normalized.estimateMax = trustedMax;
      normalized.estimateRange =
        trustedMin != null && trustedMax != null ? `$${trustedMin}–$${trustedMax}` : null;

      const submission = await storage.createIntakeSubmission({
        source: rawPayload.source ?? "website_form",
        rawPayload: rawPayload as Record<string, any>,
        normalizedPayload: normalized as unknown as Record<string, any>,
        status: "new",
        emailNotificationStatus: "pending",
        processingStatus: "captured",
        quoteLeadId: null,
      });

      // sendIntakeNotification resolves `true` only when the message was
      // actually handed to the SMTP transport. `false` = SMTP unconfigured —
      // record "skipped", not "sent", so the admin can tell "nothing was
      // ever sent" from "sent fine". Transport errors still reject → "failed".
      sendIntakeNotification(submission.id, normalized as unknown as Record<string, any>, rawPayload as Record<string, any>)
        .then((sent) => storage.updateIntakeSubmissionEmail(submission.id, sent ? "sent" : "skipped"))
        .catch((err) => {
          console.error(`[intake] Email notification failed for INT-${submission.id}:`, err);
          storage.updateIntakeSubmissionEmail(submission.id, "failed").catch(() => {});
        });

      // The homepage ContactForm posts here with no serviceType — a general
      // question, not a job. Without this flag the downstream forwards would
      // dress it up as a "residential" booking, so mark the notes clearly and
      // (in forwardLeadToBrightBase) skip the requestedDate entirely rather
      // than inventing "today".
      const isContactForm = (rawPayload.source ?? "") === "contact_form";
      const forwardNotes = isContactForm
        ? `General inquiry (contact form): ${normalized.notes || ""}`.trim()
        : normalized.notes;

      // Forward to CRM
      const freqMap: Record<string, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };
      const crmPayload = {
        name: normalized.name || "",
        email: normalized.email || "",
        phone: normalized.phone || "",
        address: normalized.address || normalized.zip || "",
        service: normalized.serviceType || "custom",
        message: forwardNotes || `Estimate: $${normalized.estimateMin || "?"}–$${normalized.estimateMax || "?"}`,
        propertyType: normalized.serviceType === "str" ? "vacation-rental" : normalized.serviceType === "commercial" ? "commercial" : "residential",
        frequency: freqMap[normalized.frequency] || normalized.frequency || "",
        estimateMin: normalized.estimateMin || null,
        estimateMax: normalized.estimateMax || null,
        squareFeet: normalized.sqft || null,
        bathrooms: normalized.bathrooms || null,
        petHair: normalized.petHair || null,
        condition: normalized.condition || null,
        source: "Website",
      };
      // PII-safe log — don't dump name/email/phone/address into logs.
      log("INFO", "crm", "Forwarding intake to CRM", {
        intakeId: submission.id,
        service: crmPayload.service,
        frequency: crmPayload.frequency,
        estimateMin: crmPayload.estimateMin,
        estimateMax: crmPayload.estimateMax,
        squareFeet: crmPayload.squareFeet,
        hasEmail: Boolean(crmPayload.email),
        hasPhone: Boolean(crmPayload.phone),
        hasAddress: Boolean(crmPayload.address),
      });
      runForward({
        sourceType: "intake",
        sourceId: submission.id,
        destination: "crm_intake",
        attempt: async () => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15_000);
            let r: Response;
            try {
              r = await fetch(CRM_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(crmPayload),
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timer);
            }
            const body = await r.text().catch(() => "");
            log("INFO", "crm", `CRM response`, { status: r.status, body: body.slice(0, 300), intakeId: submission.id });
            if (!r.ok) {
              const fatal = r.status >= 400 && r.status < 500;
              return { ok: false, statusCode: r.status, error: `HTTP ${r.status}: ${body.slice(0, 200)}`, fatal };
            }
            return { ok: true, statusCode: r.status };
          } catch (err) {
            return { ok: false, error: err instanceof Error ? err.message : String(err) };
          }
        },
      }).catch(() => {});  // runForward never rejects, guard defensively

      // Forward to BrightBase Ops (non-blocking) — lands in Requests page
      forwardLeadToBrightBase({
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
        notes: forwardNotes,
        source: "Website",
        // STR turnover details (custom-quote path). bedrooms/guests land on
        // native Bright-Space columns; listingUrl/turnoverDay/petsAllowed on
        // its custom_fields, so the operator sees the whole turnover request.
        bedrooms: normalized.bedrooms,
        guests: normalized.guests,
        listingUrl: normalized.listingUrl,
        turnoverDay: normalized.turnoverDay,
        petsAllowed: normalized.petsAllowed,
        // Client-supplied per-submission UUID. Passed through here so a
        // single customer submission whose Express handler forwards to
        // Bright-Space more than once (or the two-endpoint booking+intake
        // pattern) collapses into ONE Lead via Bright-Space's unique index.
        idempotencyKey: (req.body as any)?.idempotencyKey || null,
      }, { sourceType: "intake", sourceId: submission.id });

      return res.status(201).json({
        success: true,
        id: submission.id,
        estimateMin: normalized.estimateMin,
        estimateMax: normalized.estimateMax,
        estimateRange: normalized.estimateRange,
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
          // Custom-quote services have no numeric estimate — sending the raw
          // interpolation produced the literal string "$undefined-$undefined"
          // in the downstream CRM.
          estimateRange: lead.estimateMin != null && lead.estimateMax != null
            ? `$${lead.estimateMin}-$${lead.estimateMax}`
            : "Custom quote",
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
          // Same "$undefined–$undefined" guard as the Asset Manager forward.
          estimateRange: lead.estimateMin != null && lead.estimateMax != null
            ? `$${lead.estimateMin}–$${lead.estimateMax}`
            : "Custom quote",
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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

  // Geographic center of our Southern Maine service area (near the Saco /
  // Buxton corridor). Distance is used purely to gate address eligibility
  // — not shown to customers as "distance from HQ."
  const SERVICE_CENTER_LAT = 43.60;
  const SERVICE_CENTER_LNG = -70.55;
  const MAX_SERVICE_RADIUS_MILES = 95;
  // Was 2 (a hard "we need two calendar days" gate). Relaxed to 1 so
  // the client's tomorrow-forward date picker matches — the client's
  // minBookingDate = today+1 got customers all the way through the form
  // before the server rejected them with "at least 2 days from today."
  // Same-day requests still get pointed at the phone by the /book copy.
  const MIN_LEAD_DAYS = 1;

  // Forms send bare "YYYY-MM-DD" strings. `new Date("YYYY-MM-DD")` parses as
  // UTC MIDNIGHT, which is the previous evening in Eastern time — so the
  // stored timestamp (and every render of it) drifted to the day BEFORE the
  // one the customer picked. Parse at local noon instead: DST shifts can
  // never push noon across a date boundary.
  function parseFormDate(value: string): Date {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  }

  // Inverse of parseFormDate for API responses: the calendar date in SERVER
  // LOCAL time (matching how parseFormDate stored it) — not toISOString(),
  // which would re-introduce the same UTC day-shift on the way out.
  function toFormDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function minBookingDate(): Date {
    const minDate = new Date(Date.now() + MIN_LEAD_DAYS * 24 * 60 * 60 * 1000);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  }

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
          ? `You're in our Southern Maine service area — we've got you covered.`
          : `That address is a bit outside our regular Southern Maine route. Give us a call at 207-572-0502 and we'll do our best to work it out.`,
      });
    } catch (error) {
      log("ERROR", "booking", "Address validation failed", { error: String(error) });
      res.status(500).json({ eligible: false, message: "Address validation failed. Please try again." });
    }
  });

  const bookingSubmitSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(300).optional().nullable(),
    phone: z.string().min(1).max(30),
    address: z.string().min(1).max(500),
    zip: z.string().max(10).optional().nullable(),
    // Constrain to the known service set (was an open string, so any garbage
    // value flowed straight into storage and on to Bright-Space's Requests
    // page). Mirrors the intake validator's enum.
    serviceType: z.enum(["standard", "deep", "str", "vacation-rental", "commercial", "move-in-out"]),
    frequency: z.enum(["weekly", "biweekly", "monthly", "one-time"]).optional().nullable(),
    // Sane bounds so an oversized / negative input can't drive an absurd
    // server-recomputed estimate. Half-baths are honored (0.5 steps) so the
    // recompute prices on the same bath count the customer was shown.
    sqft: z.number().min(100).max(20000).optional().nullable(),
    bedrooms: z.number().int().min(0).max(20).optional().nullable(),
    bathrooms: z.number().min(1).max(20).multipleOf(0.5).optional().nullable(),
    petHair: z.enum(["none", "some", "heavy"]).optional().nullable(),
    condition: z.enum(["maintenance", "moderate", "heavy"]).optional().nullable(),
    estimateMin: z.number().min(0).max(100000).optional().nullable(),
    estimateMax: z.number().min(0).max(100000).optional().nullable(),
    requestedDate: z.string().min(1),
    distanceMiles: z.number().optional().nullable(),
    intakeId: z.number().optional().nullable(),
    // Six "essentials" the /book flow collects so cleaners come prepared.
    // Bright-Space stores anything not on the LeadIntake column list into
    // LeadIntake.custom_fields (JSON), so these ride through the same
    // /api/booking/submit call without a schema migration on that side.
    entryMethod: z.string().optional().nullable(),
    parkingNotes: z.string().optional().nullable(),
    petsDetail: z.string().optional().nullable(),
    focusAreas: z.array(z.string()).optional().nullable(),
    specialInstructions: z.string().optional().nullable(),
    // Per-submission UUID from the client. Forwarded to Bright-Space so
    // its unique-index dedup collapses retries + the dual-forward pattern
    // into one Lead. See Bright-Space PR #507.
    idempotencyKey: z.string().optional().nullable(),
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
      // Local-noon parse — see parseFormDate. The old `new Date(data.requestedDate)`
      // parsed the form's "YYYY-MM-DD" as UTC midnight, which both stored and
      // lead-time-compared the PREVIOUS Eastern day.
      const requestedDate = parseFormDate(data.requestedDate);
      const minDate = minBookingDate();

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

      // Recompute the estimate server-side. The browser's numbers are not
      // trusted for persistence — a tampered client could otherwise book
      // at $0. When the server can't compute (custom-quote service types
      // or incomplete inputs), fall back to the client's numbers rather
      // than nulling them out: for STR/commercial the "estimate" is a
      // placeholder anyway, and the operator will requote.
      const serverQuote = calculateQuote({
        serviceType: data.serviceType,
        sqft: data.sqft ?? null,
        bathrooms: data.bathrooms ?? null,
        frequency: data.frequency ?? null,
        petHair: data.petHair ?? null,
        condition: data.condition ?? null,
      });
      const estimateMin = serverQuote.estimateMin ?? data.estimateMin ?? null;
      const estimateMax = serverQuote.estimateMax ?? data.estimateMax ?? null;
      if (estimatesDiverge(data.estimateMin, data.estimateMax, serverQuote.estimateMin, serverQuote.estimateMax)) {
        log("WARN", "booking", "Client-supplied estimate diverged from server recompute", {
          clientMin: data.estimateMin,
          clientMax: data.estimateMax,
          serverMin: serverQuote.estimateMin,
          serverMax: serverQuote.estimateMax,
          serviceType: data.serviceType,
        });
      }

      // Unguessable capability token — knowing it is the sole authorization
      // for the customer's /booking/manage/:token page.
      const manageToken = crypto.randomUUID();

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
        // The column is `real` now — persist the true (possibly half-) bath
        // count the customer entered and the estimate was priced on.
        bathrooms: data.bathrooms ?? null,
        bedrooms: data.bedrooms ?? null,
        petHair: data.petHair ?? null,
        condition: data.condition ?? null,
        estimateMin,
        estimateMax,
        requestedDate: requestedDate,
        distanceMiles: distanceMiles ?? null,
        // The /book "essentials" — previously forwarded to BrightBase only
        // and dropped locally, leaving our own DB blind to what the customer
        // typed. focusAreas flattens to a comma list for the text column.
        entryMethod: data.entryMethod ?? null,
        parkingNotes: data.parkingNotes ?? null,
        petsDetail: data.petsDetail ?? null,
        focusAreas: data.focusAreas?.length ? data.focusAreas.join(", ") : null,
        specialInstructions: data.specialInstructions ?? null,
        manageToken,
        idempotencyKey: data.idempotencyKey ?? null,
      });

      log("INFO", "booking", "New booking request created", { id: booking.id, date: data.requestedDate, serviceType: data.serviceType });

      // Customer-facing manage URL. PUBLIC_SITE_URL wins in production (the
      // canonical domain); otherwise fall back to the request's own origin so
      // dev/staging links stay on the environment they came from.
      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const siteBase = (process.env.PUBLIC_SITE_URL || `${proto}://${req.headers.host || "maineclean.co"}`).replace(/\/+$/, "");
      const manageUrl = `${siteBase}/booking/manage/${manageToken}`;

      // Owner + customer emails, both fire-and-forget (they never throw).
      // Bookings — the highest-intent submissions — previously sent NO owner
      // notification at all; only the intake path did.
      const emailDetails = {
        bookingId: booking.id,
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        serviceType: data.serviceType,
        requestedDate: data.requestedDate,
        address: data.address,
        estimateMin,
        estimateMax,
        entryMethod: data.entryMethod ?? null,
        specialInstructions: data.specialInstructions ?? null,
        manageUrl,
      };
      sendBookingNotification(emailDetails, "new").catch(() => {});
      sendBookingCustomerEmail(emailDetails).catch(() => {});

      // Forward to CRM for approval workflow (uses leads endpoint with booking- prefix)
      const CRM_BOOKING_URL = process.env.CRM_WEBHOOK_URL || "https://connecteam-proxy.vercel.app/api/leads";

      const crmBookingPayload = {
        websiteBookingId: booking.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        zip: data.zip,
        serviceType: data.serviceType,
        frequency: data.frequency,
        sqft: data.sqft,
        // True (possibly half-) bath count — both sinks accept non-integers
        // (the intake path has always forwarded 2.5-style values).
        bathrooms: data.bathrooms,
        petHair: data.petHair,
        condition: data.condition,
        // Forward the trusted, server-computed range (falls back to the
        // client's when the service is custom-quoted).
        estimateMin,
        estimateMax,
        requestedDate: data.requestedDate,
        distanceMiles: distanceMiles,
        source: "Website",
      };
      runForward({
        sourceType: "booking",
        sourceId: booking.id,
        destination: "crm_booking",
        attempt: async () => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15_000);
            let r: Response;
            try {
              r = await fetch(CRM_BOOKING_URL + "?action=booking-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(crmBookingPayload),
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timer);
            }
            const body = await r.text().catch(() => "");
            log("INFO", "booking", "CRM booking forward response", { status: r.status, body: body.slice(0, 300) });
            if (!r.ok) {
              const fatal = r.status >= 400 && r.status < 500;
              return { ok: false, statusCode: r.status, error: `HTTP ${r.status}: ${body.slice(0, 200)}`, fatal };
            }
            try {
              const json = JSON.parse(body);
              if (json.bookingId) {
                storage.updateBookingRequestExternalIds(booking.id, { crmBookingId: String(json.bookingId) }).catch(() => {});
              }
            } catch {}
            return { ok: true, statusCode: r.status };
          } catch (err) {
            return { ok: false, error: err instanceof Error ? err.message : String(err) };
          }
        },
      }).catch(() => {});

      // Forward to BrightBase Ops (non-blocking) — lands in Requests page
      forwardLeadToBrightBase({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        zip: data.zip,
        serviceType: data.serviceType,
        frequency: data.frequency,
        sqft: data.sqft,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        petHair: data.petHair,
        condition: data.condition,
        estimateMin,
        estimateMax,
        requestedDate: data.requestedDate,
        source: "Website",
        entryMethod: data.entryMethod,
        parkingNotes: data.parkingNotes,
        petsDetail: data.petsDetail,
        focusAreas: data.focusAreas,
        specialInstructions: data.specialInstructions,
        // See intake handler above — same rationale, same forward.
        idempotencyKey: data.idempotencyKey || null,
      }, { sourceType: "booking", sourceId: booking.id });

      return res.status(201).json({
        success: true,
        bookingId: booking.id,
        requestedDate: data.requestedDate,
        // Capability URL for self-service edit/cancel — also emailed to the
        // customer when they left an email address.
        manageToken,
        manageUrl,
        message: "Your booking request has been submitted! We'll review and confirm within 1 business day.",
      });
    } catch (error) {
      log("ERROR", "booking", "Booking submission failed", { error: String(error) });
      return res.status(500).json({ success: false, message: "Failed to submit booking request. Please try again." });
    }
  });

  // ── CUSTOMER SELF-SERVICE BOOKING MANAGEMENT ──
  //
  // Public endpoints secured by the capability URL: the unguessable
  // manageToken (a UUID minted at submit time) is the sole credential.
  // The summary deliberately omits email/phone so a leaked/forwarded link
  // exposes as little as possible.

  const TERMINAL_BOOKING_STATUSES = new Set(["cancelled", "rejected", "completed"]);

  function bookingManageSummary(b: BookingRequest) {
    return {
      id: b.id,
      name: b.name,
      serviceType: b.serviceType,
      requestedDate: toFormDateString(new Date(b.requestedDate)),
      address: b.address,
      status: b.status,
      bedrooms: b.bedrooms,
      entryMethod: b.entryMethod,
      parkingNotes: b.parkingNotes,
      petsDetail: b.petsDetail,
      focusAreas: b.focusAreas,
      specialInstructions: b.specialInstructions,
      estimateMin: b.estimateMin,
      estimateMax: b.estimateMax,
    };
  }

  app.get("/api/booking/manage/:token", async (req, res) => {
    try {
      const booking = await storage.getBookingRequestByManageToken(req.params.token);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(bookingManageSummary(booking));
    } catch (error) {
      log("ERROR", "booking-manage", "Lookup failed", { error: String(error) });
      res.status(500).json({ message: "Failed to load booking" });
    }
  });

  // Only the fields a customer may self-edit. Everything else (price,
  // address, service type) requires a call — those change the quote.
  const bookingManageUpdateSchema = z.object({
    requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
    entryMethod: z.string().max(100).optional().nullable(),
    parkingNotes: z.string().max(500).optional().nullable(),
    petsDetail: z.string().max(500).optional().nullable(),
    focusAreas: z.array(z.string().max(100)).max(10).optional().nullable(),
    specialInstructions: z.string().max(2000).optional().nullable(),
    bedrooms: z.number().int().min(0).max(20).optional().nullable(),
  });

  app.patch("/api/booking/manage/:token", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }
      const booking = await storage.getBookingRequestByManageToken(req.params.token);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (TERMINAL_BOOKING_STATUSES.has(booking.status)) {
        return res.status(409).json({ message: "This booking can no longer be edited. Call or text us at 207-572-0502 to rebook." });
      }

      const parsed = bookingManageUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      }
      const changes = parsed.data;

      const patch: Record<string, any> = {};
      if (changes.requestedDate !== undefined) {
        // Same local-noon parse + lead-time gate as submit — a reschedule
        // must not slip inside the confirmation window either.
        const newDate = parseFormDate(changes.requestedDate);
        if (newDate < minBookingDate()) {
          return res.status(400).json({ message: `Please select a date at least ${MIN_LEAD_DAYS} days from today.` });
        }
        patch.requestedDate = newDate;
      }
      if (changes.entryMethod !== undefined) patch.entryMethod = changes.entryMethod;
      if (changes.parkingNotes !== undefined) patch.parkingNotes = changes.parkingNotes;
      if (changes.petsDetail !== undefined) patch.petsDetail = changes.petsDetail;
      if (changes.focusAreas !== undefined) patch.focusAreas = changes.focusAreas?.length ? changes.focusAreas.join(", ") : null;
      if (changes.specialInstructions !== undefined) patch.specialInstructions = changes.specialInstructions;
      if (changes.bedrooms !== undefined) patch.bedrooms = changes.bedrooms;

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: "Nothing to update" });
      }

      const updated = await storage.updateBookingRequestFields(booking.id, patch);
      if (!updated) return res.status(404).json({ message: "Booking not found" });
      log("INFO", "booking-manage", "Customer updated booking", { id: booking.id, fields: Object.keys(patch) });

      // Mirror the change into BrightBase so the operator's Requests page
      // matches what the customer now expects. Addressable only when the
      // original submit carried an idempotencyKey (older rows won't have one).
      if (booking.idempotencyKey) {
        forwardBookingUpdateToBrightBase({
          idempotencyKey: booking.idempotencyKey,
          requestedDate: changes.requestedDate,
          specialInstructions: changes.specialInstructions ?? undefined,
          entryMethod: changes.entryMethod ?? undefined,
          parkingNotes: changes.parkingNotes ?? undefined,
          petsDetail: changes.petsDetail ?? undefined,
          focusAreas: changes.focusAreas ?? undefined,
          bedrooms: changes.bedrooms ?? undefined,
        }, { sourceType: "booking", sourceId: booking.id }).catch(() => {});
      }

      // Tell the office a customer changed their own booking — fire-and-forget.
      sendBookingNotification({
        bookingId: booking.id,
        name: booking.name,
        phone: booking.phone,
        email: booking.email,
        serviceType: booking.serviceType,
        requestedDate: toFormDateString(new Date(updated.requestedDate)),
        address: booking.address,
        estimateMin: booking.estimateMin,
        estimateMax: booking.estimateMax,
        entryMethod: updated.entryMethod,
        specialInstructions: updated.specialInstructions,
      }, "updated").catch(() => {});

      res.json({ success: true, booking: bookingManageSummary(updated) });
    } catch (error) {
      log("ERROR", "booking-manage", "Update failed", { error: String(error) });
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post("/api/booking/manage/:token/cancel", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }
      const booking = await storage.getBookingRequestByManageToken(req.params.token);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      // Cancelling twice is a no-op, not an error — a double-tap or a stale
      // tab shouldn't show the customer a scary failure.
      if (booking.status === "cancelled") {
        return res.json({ success: true, booking: bookingManageSummary(booking) });
      }
      if (TERMINAL_BOOKING_STATUSES.has(booking.status)) {
        return res.status(409).json({ message: "This booking can no longer be changed. Call or text us at 207-572-0502." });
      }

      const updated = await storage.updateBookingRequestStatus(booking.id, "cancelled");
      if (!updated) return res.status(404).json({ message: "Booking not found" });
      log("INFO", "booking-manage", "Customer cancelled booking", { id: booking.id });

      if (booking.idempotencyKey) {
        forwardBookingUpdateToBrightBase(
          { idempotencyKey: booking.idempotencyKey, cancel: true },
          { sourceType: "booking", sourceId: booking.id },
        ).catch(() => {});
      }

      sendBookingNotification({
        bookingId: booking.id,
        name: booking.name,
        phone: booking.phone,
        email: booking.email,
        serviceType: booking.serviceType,
        requestedDate: toFormDateString(new Date(booking.requestedDate)),
        address: booking.address,
        estimateMin: booking.estimateMin,
        estimateMax: booking.estimateMax,
      }, "cancelled").catch(() => {});

      res.json({ success: true, booking: bookingManageSummary(updated) });
    } catch (error) {
      log("ERROR", "booking-manage", "Cancel failed", { error: String(error) });
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Admin: list lead-forward delivery ledger — visibility for the fire-and-forget
  // downstream syncs. Filter by ?status=failed to surface anything that never
  // reached BrightBase or the legacy CRM webhook after retries.
  app.get("/api/admin/lead-forwards", requireAdmin, async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ message: "Database not configured" });
      }
      const status = req.query.status as string | undefined;
      const destination = req.query.destination as string | undefined;
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || "100"), 10) || 100, 1), 500);
      const conditions = [] as any[];
      if (status) conditions.push(eq(leadForwards.status, status));
      if (destination) conditions.push(eq(leadForwards.destination, destination));
      let query = db.select().from(leadForwards).orderBy(desc(leadForwards.createdAt)).limit(limit) as any;
      if (conditions.length === 1) query = query.where(conditions[0]);
      else if (conditions.length > 1) {
        const { and } = await import("drizzle-orm");
        query = query.where(and(...conditions));
      }
      const rows = await query;
      res.json({ rows, total: rows.length });
    } catch (error) {
      log("ERROR", "admin", "lead-forwards fetch failed", { error: String(error) });
      res.status(500).json({ message: "Failed to fetch lead forwards" });
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
      const id = parseInt(req.params.id);
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

  return httpServer;
}
