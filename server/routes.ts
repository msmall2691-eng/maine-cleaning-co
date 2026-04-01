import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteLeadSchema } from "@shared/schema";
import { z } from "zod";
import { sendLeadNotification, sendCustomerConfirmation, sendPasswordResetEmail, sendIntakeNotification } from "./email";
import { intakeSubmitSchema } from "./lib/validators";
import { normalizeIntakePayload } from "./lib/normalize";
import crypto from "crypto";
import { setupAuth, hashPassword, comparePassword, requireAuth, requireAdmin } from "./auth";
import OpenAI from "openai";

const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "https://connecteam-proxy.vercel.app/api/leads";

function log(level: "INFO" | "WARN" | "ERROR", context: string, message: string, data?: Record<string, any>) {
  const ts = new Date().toISOString();
  const extra = data ? ` ${JSON.stringify(data)}` : "";
  console[level === "ERROR" ? "error" : "log"](`[${ts}] [${level}] [${context}] ${message}${extra}`);
}
