import { describe, it, expect } from "vitest";
import { addressLooksComplete, propertyPhotoSrc } from "../property-address";

/**
 * Every `true` here is a billable Street View image request. The cases below
 * are the ones a customer actually types on the way to their own address.
 */
describe("addressLooksComplete", () => {
  it("accepts the shape picking a suggestion produces", () => {
    // AddressInput.selectSuggestion joins street, city, state, zip with ", ".
    expect(addressLooksComplete("155 Keystone Dr, Saco, ME, 04072")).toBe(true);
  });

  it("accepts the same address typed by hand, without the comma before the ZIP", () => {
    expect(addressLooksComplete("155 Keystone Dr, Saco, ME 04072")).toBe(true);
  });

  it("stays quiet through every prefix of that address", () => {
    const full = "155 Keystone Dr, Saco, ME, 04072";
    const premature: string[] = [];
    for (let i = 1; i < full.length; i++) {
      if (addressLooksComplete(full.slice(0, i))) premature.push(full.slice(0, i));
    }
    expect(premature).toEqual([]);
  });

  it("is not fooled by a five-digit house number with no ZIP yet", () => {
    // The reason the ZIP has to follow "ME" rather than appear anywhere: this
    // is a real Buxton address, mid-type, and a looser rule pays for it.
    expect(addressLooksComplete("12345 Long Plains Rd, Buxton, ME")).toBe(false);
  });

  it("wants a street number, not just a road", () => {
    expect(addressLooksComplete("Keystone Dr, Saco, ME, 04072")).toBe(false);
  });

  it("wants the state", () => {
    expect(addressLooksComplete("155 Keystone Dr, Saco, 04072")).toBe(false);
  });

  it("ignores leading and trailing whitespace", () => {
    expect(addressLooksComplete("  155 Keystone Dr, Saco, ME, 04072  ")).toBe(true);
  });

  it("accepts a lowercase state", () => {
    expect(addressLooksComplete("155 Keystone Dr, Saco, me 04072")).toBe(true);
  });
});

describe("propertyPhotoSrc", () => {
  it("is null while there is nothing worth asking about", () => {
    expect(propertyPhotoSrc("155 Key")).toBeNull();
    expect(propertyPhotoSrc("")).toBeNull();
  });

  it("encodes the address rather than splicing it into the query raw", () => {
    const src = propertyPhotoSrc("155 Keystone Dr, Saco, ME, 04072");
    expect(src).toBe("/api/property-photo?address=155%20Keystone%20Dr%2C%20Saco%2C%20ME%2C%2004072");
    // No bare separators to be reinterpreted as more query parameters.
    expect(src!.split("?")[1]).not.toContain("&");
    expect(src!.split("?")[1]).not.toContain(" ");
  });

  it("trims before building the URL, so the same address is one cache key", () => {
    expect(propertyPhotoSrc("  155 Keystone Dr, Saco, ME, 04072 ")).toBe(
      propertyPhotoSrc("155 Keystone Dr, Saco, ME, 04072"),
    );
  });
});
