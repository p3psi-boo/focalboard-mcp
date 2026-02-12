import { test, expect, describe } from "bun:test";
import { ErrorResponseSchema } from "../../src/types/common";

describe("Error Handling Tests", () => {
  test("validates error response structure", () => {
    const error = {
      error: "Not found",
      errorCode: 404,
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });

  test("handles validation errors", () => {
    const error = {
      error: "Validation failed",
      errorCode: 400,
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });

  test("handles authentication errors", () => {
    const error = {
      error: "Unauthorized",
      errorCode: 401,
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });

  test("handles server errors", () => {
    const error = {
      error: "Internal server error",
      errorCode: 500,
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });
});
