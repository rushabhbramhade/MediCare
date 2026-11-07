import { describe, expect, it } from "vitest";
import { applyOtpInput, emptyOtp, OTP_LENGTH } from "./otp";

describe("applyOtpInput", () => {
  it("fills one box and moves focus forward", () => {
    const result = applyOtpInput(emptyOtp(), 0, "5");
    expect(result.value).toEqual(["5", "", "", "", "", ""]);
    expect(result.focusIndex).toBe(1);
  });

  it("fills every box when a full code is pasted", () => {
    const result = applyOtpInput(emptyOtp(), 0, "12 34-56");
    expect(result.value.join("")).toBe("123456");
    expect(result.focusIndex).toBe(OTP_LENGTH - 1);
  });

  it("fills forward from the box that received the paste", () => {
    const result = applyOtpInput(emptyOtp(), 2, "9876");
    expect(result.value).toEqual(["", "", "9", "8", "7", "6"]);
    expect(result.focusIndex).toBe(OTP_LENGTH - 1);
  });

  it("ignores non-digits and clears a box on empty input", () => {
    const filled = ["1", "2", "3", "4", "5", "6"];
    expect(applyOtpInput(filled, 1, "").value).toEqual(["1", "", "3", "4", "5", "6"]);
    expect(applyOtpInput(filled, 1, "a").value).toEqual(["1", "", "3", "4", "5", "6"]);
  });
});
