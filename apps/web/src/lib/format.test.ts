import { describe, expect, it } from "vitest";
import { formatBytes, formatPhoneDisplay } from "./format";

describe("formatPhoneDisplay", () => {
  it("formats E.164 Indian numbers for display", () => {
    expect(formatPhoneDisplay("+919876543210")).toBe("+91 98765 43210");
  });

  it("handles missing and non-Indian values without throwing", () => {
    expect(formatPhoneDisplay(undefined)).toBe("Not provided");
    expect(formatPhoneDisplay("+14155550123")).toBe("+14155550123");
  });
});

describe("formatBytes", () => {
  it("uses readable units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(20 * 1024 * 1024)).toBe("20.0 MB");
  });
});
