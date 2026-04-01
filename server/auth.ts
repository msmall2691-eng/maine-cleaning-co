import crypto from "crypto";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

const PgSession = connectPgSimple(session);

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  console.warn("[auth] SESSION_SECRET not set — generating ephemeral secret. Sessions will not persist across restarts.");
  return crypto.randomBytes(32).toString("hex");
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      name: "mcc.sid",
      secret: getSessionSecret(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      },
    })
  );
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
};
