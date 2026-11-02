import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { loginSchema } from "@medicare/validators";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  const pipe = new ZodValidationPipe(loginSchema);

  it("returns parsed and transformed input", () => {
    expect(pipe.transform({ phone: "9876543210" })).toEqual({ phone: "+919876543210" });
  });

  it("rejects invalid input with field details", () => {
    try {
      pipe.transform({ phone: "123" });
      throw new Error("expected the pipe to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
        details: string[];
      };
      expect(response.code).toBe("validation_error");
      expect(response.details[0]).toContain("phone");
    }
  });
});
