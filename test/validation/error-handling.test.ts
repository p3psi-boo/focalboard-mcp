import { test, expect, describe } from "bun:test";
import { ErrorResponseSchema } from "../../planning/types";

describe("Error Handling Tests", () => {
  test("validates error response structure", () => {
    const error = {
      error: "Not found",
      errorCode: "NOT_FOUND",
      details: { resource: "board", id: "123" },
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });

  test("handles validation errors", () => {
    const error = {
      error: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      details: {
        fields: [
          { field: "title", message: "Required" },
          { field: "teamId", message: "Invalid format" },
        ],
      },
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });

  test("handles authentication errors", () => {
    const error = {
      error: "Unauthorized",
      errorCode: "AUTH_ERROR",
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });

  test("handles server errors", () => {
    const error = {
      error: "Internal server error",
      errorCode: "INTERNAL_ERROR",
      details: { stack: "Error stack trace..." },
    };
    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });
});
