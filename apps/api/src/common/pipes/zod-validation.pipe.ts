import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { formatZodError } from "@medicare/validators";
import type { z } from "zod";

/**
 * Validates and replaces the incoming value with the parsed (transformed)
 * value. Schemas come from @medicare/validators so web and API agree.
 */
@Injectable()
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "validation_error",
        message: "Request validation failed",
        details: formatZodError(result.error),
      });
    }
    return result.data;
  }
}
