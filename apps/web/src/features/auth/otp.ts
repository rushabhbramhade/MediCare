export const OTP_LENGTH = 6;

export function emptyOtp(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

/**
 * Applies typed or pasted text to one OTP box. A paste fills forward from the
 * current box; a single digit replaces the box and moves focus to the next.
 */
export function applyOtpInput(
  current: string[],
  index: number,
  raw: string,
): { value: string[]; focusIndex: number } {
  const digits = raw.replace(/\D/g, "");
  const value = [...current];

  if (!digits) {
    value[index] = "";
    return { value, focusIndex: index };
  }

  let lastFilled = index;
  for (const [offset, digit] of Array.from(digits.slice(0, OTP_LENGTH - index)).entries()) {
    value[index + offset] = digit;
    lastFilled = index + offset;
  }

  return { value, focusIndex: Math.min(lastFilled + 1, OTP_LENGTH - 1) };
}
