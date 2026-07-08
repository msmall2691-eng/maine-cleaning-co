/**
 * Tests for sendIntakeNotification's HTML template — the admin notification
 * that lands in office@ every time the website intake form is submitted.
 *
 * Focus (in order of Meg-visibility):
 *   1. "Not specified" doesn't render as a real row when the customer
 *      didn't pick a service — it was noise the operator had to skip.
 *   2. Interactive CTAs (Call / Text / Reply) render iff the customer
 *      supplied a phone / email. No dead buttons.
 *   3. Phone parsing accepts common formats and produces valid tel:/sms:
 *      hrefs.
 *
 * We mock nodemailer so no real email fires; we spy on the transporter
 * sendMail call and inspect the html payload.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSendMail = vi.fn(async () => ({}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail: mockSendMail }),
  },
}));

async function loadModule() {
  vi.resetModules();
  process.env.SMTP_USER = "office@example.com";
  process.env.SMTP_PASS = "secret";
  process.env.NOTIFY_EMAIL = "office@example.com";
  return await import("../email");
}

beforeEach(() => {
  mockSendMail.mockClear();
});

describe("sendIntakeNotification", () => {
  it("omits the Service row when no service_type is provided", async () => {
    const { sendIntakeNotification } = await loadModule();
    await sendIntakeNotification(84, {
      name: "Sue Ricardo",
      email: "sue@example.com",
      phone: "5089304509",
      notes: "wedding cleaning",
    }, {});

    const html = mockSendMail.mock.calls[0][0].html as string;
    // Regression against the screenshot: "Not specified" was rendering as
    // a real Service row and just added visual noise.
    expect(html).not.toMatch(/Not specified/i);
    // The Service Details block still exists (frequency/sqft may render),
    // but the specific "Service" row is gone.
    expect(html).not.toMatch(/>Service<\/td>/);
  });

  it("renders Call / Text / Reply CTAs when phone and email are present", async () => {
    const { sendIntakeNotification } = await loadModule();
    await sendIntakeNotification(85, {
      name: "Sue Ricardo",
      email: "sue@example.com",
      phone: "(508) 930-4509",
      serviceType: "standard",
    }, {});

    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).toContain('href="tel:5089304509"');
    expect(html).toContain('href="sms:5089304509"');
    expect(html).toMatch(/href="mailto:sue@example\.com/);
    expect(html).toContain(">Call customer<");
    expect(html).toContain(">Text customer<");
    expect(html).toContain(">Reply by email<");
  });

  it("hides phone CTAs when phone is missing but keeps the mailto", async () => {
    const { sendIntakeNotification } = await loadModule();
    await sendIntakeNotification(86, {
      name: "No Phone",
      email: "np@example.com",
      // no phone
    }, {});

    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).toContain("mailto:np@example.com");
  });

  it("hides all CTAs when neither phone nor email is present", async () => {
    const { sendIntakeNotification } = await loadModule();
    await sendIntakeNotification(87, {
      name: "Anonymous",
      // no phone, no email
    }, {});

    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("Call customer");
  });

  it("normalizes a variety of phone formats into a valid tel: href", async () => {
    const { sendIntakeNotification } = await loadModule();
    for (const phone of [
      "(207) 572-0502",
      "207.572.0502",
      "207 572 0502",
    ]) {
      mockSendMail.mockClear();
      await sendIntakeNotification(88, { phone, email: "x@y.co" }, {});
      const html = mockSendMail.mock.calls[0][0].html as string;
      expect(html).toContain('href="tel:2075720502"');
    }
  });

  it("preserves a +1 prefix on the tel: href", async () => {
    const { sendIntakeNotification } = await loadModule();
    await sendIntakeNotification(89, {
      phone: "+1 207-572-0502",
      email: "x@y.co",
    }, {});
    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).toContain('href="tel:+12075720502"');
  });
});
