import { describe, it, expect } from "vitest";
import { isSpaRoute } from "../static";

// The SPA catch-all used to answer 200 for every path. Known client routes
// still get 200; anything else gets the shell with a real 404 status.
describe("isSpaRoute", () => {
  it.each([
    "/", "/book", "/booking/manage/abc123", "/portal", "/portal/login",
    "/portal/reset-password", "/about", "/how-it-works", "/service-areas",
    "/services", "/services/deep-cleaning", "/short-term-rentals", "/blog",
    "/blog/some-post", "/privacy", "/terms", "/sms", "/about/",
  ])("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  it.each([
    "/zzz-garbage", "/about/nested/too-deep", "/services/a/b", "/privacy-policy",
    "/booking/manage", "/admin", "/wp-login.php",
  ])("%s is not a known route", (p) => {
    expect(isSpaRoute(p)).toBe(false);
  });
});
