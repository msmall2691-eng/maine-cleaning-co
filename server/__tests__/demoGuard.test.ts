import { describe, it, expect } from "vitest";
import { isFromDemo } from "../demoGuard";

describe("demo write guard", () => {
  it("recognises a request made from inside the demo", () => {
    for (const r of [
      "https://example.com/demo",
      "https://example.com/demo/book",
      "https://example.com/demo/services/deep-cleaning",
      "http://localhost:5000/demo/#get-estimate",
    ]) {
      expect(isFromDemo(r), r).toBe(true);
    }
  });

  it("leaves the business site's own forms alone", () => {
    for (const r of [
      "https://example.com/",
      "https://example.com/contact",
      "https://example.com/proof",
      // the prefix must not match a sibling path that merely starts the same way
      "https://example.com/democracy",
      "https://example.com/demo-request",
    ]) {
      expect(isFromDemo(r), r).toBe(false);
    }
  });

  it("does not throw on a missing or unparseable Referer", () => {
    expect(isFromDemo(undefined)).toBe(false);
    expect(isFromDemo("")).toBe(false);
    expect(isFromDemo("not a url")).toBe(false);
  });
});
