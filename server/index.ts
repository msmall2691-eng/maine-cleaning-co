import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0"); // Modern browsers: CSP is preferred; this header can cause issues
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CORS: restrict API access to same origin in production, allow dev origins otherwise
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(s => s.trim())
    : [];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/config/features", (_req, res) => {
  res.json({
    aiChat: !!process.env.OPENAI_API_KEY,
    email: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
  });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const sanitized = { ...capturedJsonResponse };
        const sensitiveKeys = ["password", "token", "resetToken", "secret", "hash"];
        for (const key of sensitiveKeys) {
          if (key in sanitized) sanitized[key] = "[REDACTED]";
        }
        const str = JSON.stringify(sanitized);
        logLine += ` :: ${str.length > 500 ? str.slice(0, 500) + "..." : str}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auto-create database tables on startup if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      const { pool } = await import("./db");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          email TEXT,
          name TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'client',
          reset_token TEXT,
          reset_token_expiry TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS quote_leads (
          id SERIAL PRIMARY KEY,
          sqft INTEGER NOT NULL,
          service_type TEXT NOT NULL,
          frequency TEXT NOT NULL,
          pet_hair TEXT NOT NULL,
          condition TEXT NOT NULL,
          bathrooms INTEGER NOT NULL,
          estimate_min INTEGER NOT NULL,
          estimate_max INTEGER NOT NULL,
          name TEXT,
          email TEXT,
          phone TEXT,
          notes TEXT,
          zip TEXT,
          address TEXT,
          photos JSON,
          source TEXT DEFAULT 'website',
          status TEXT NOT NULL DEFAULT 'New',
          archived BOOLEAN NOT NULL DEFAULT false,
          client_id VARCHAR,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS onboarding_checklists (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR NOT NULL,
          quote_id INTEGER NOT NULL,
          service_type TEXT NOT NULL,
          form_responses JSON NOT NULL DEFAULT '{}'::json,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS contracts (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR NOT NULL,
          quote_id INTEGER NOT NULL,
          service_type TEXT NOT NULL,
          frequency TEXT NOT NULL,
          price INTEGER NOT NULL,
          address TEXT,
          terms TEXT NOT NULL,
          signed_name TEXT,
          signed_at TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS scheduled_cleanings (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR NOT NULL,
          quote_id INTEGER,
          service_type TEXT NOT NULL,
          scheduled_date TIMESTAMP NOT NULL,
          status TEXT NOT NULL DEFAULT 'upcoming',
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR NOT NULL,
          cleaning_id INTEGER,
          amount INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          stripe_session_id TEXT,
          paid_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS intake_submissions (
          id SERIAL PRIMARY KEY,
          source TEXT NOT NULL DEFAULT 'website_form',
          raw_payload JSON NOT NULL,
          normalized_payload JSON NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          email_notification_status TEXT NOT NULL DEFAULT 'pending',
          processing_status TEXT NOT NULL DEFAULT 'captured',
          quote_lead_id INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      log("Database tables verified/created");
    } catch (err) {
      console.error("Failed to create database tables:", err);
    }
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    // Only expose error messages for client errors (4xx); hide internal details for 5xx
    const message = status < 500
      ? (err.message || "Request error")
      : "Internal Server Error";

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
