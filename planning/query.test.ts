import { test, expect, describe } from "bun:test";
import {
  ErrorResponseSchema,
  GetBlocksQuerySchema,
  SearchQuerySchema,
  DisableNotifySchema,
} from "./types";

describe("Query and Utility Schemas", () => {
  describe("ErrorResponseSchema", () => {
    test("validates minimal error", () => {
      const error = { error: "Something went wrong" };
      expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
    });

    test("validates full error", () => {
      const error = {
        error: "Validation failed",
        errorCode: "VALIDATION_ERROR",
        details: { field: "title", message: "Required" },
      };
      expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
    });

    test("rejects error without message", () => {
      const error = { errorCode: "ERROR" };
      expect(() => ErrorResponseSchema.parse(error)).toThrow();
    });
  });

  describe("GetBlocksQuerySchema", () => {
    test("validates empty query", () => {
      const query = {};
      expect(() => GetBlocksQuerySchema.parse(query)).not.toThrow();
    });

    test("validates parent_id filter", () => {
      const query = { parent_id: "parent-123" };
      expect(() => GetBlocksQuerySchema.parse(query)).not.toThrow();
    });

    test("validates type filter", () => {
      const query = { type: "card" };
      expect(() => GetBlocksQuerySchema.parse(query)).not.toThrow();
    });

    test("validates both filters", () => {
      const query = { parent_id: "parent-123", type: "card" };
      expect(() => GetBlocksQuerySchema.parse(query)).not.toThrow();
    });
  });

  describe("SearchQuerySchema", () => {
    test("validates search query", () => {
      const query = { q: "test search" };
      expect(() => SearchQuerySchema.parse(query)).not.toThrow();
    });

    test("rejects empty search", () => {
      const query = { q: "" };
      expect(() => SearchQuerySchema.parse(query)).toThrow();
    });

    test("rejects missing query", () => {
      const query = {};
      expect(() => SearchQuerySchema.parse(query)).toThrow();
    });
  });

  describe("DisableNotifySchema", () => {
    test("validates empty", () => {
      const data = {};
      expect(() => DisableNotifySchema.parse(data)).not.toThrow();
    });

    test("validates true", () => {
      const data = { disable_notify: true };
      expect(() => DisableNotifySchema.parse(data)).not.toThrow();
    });

    test("validates false", () => {
      const data = { disable_notify: false };
      expect(() => DisableNotifySchema.parse(data)).not.toThrow();
    });
  });
});
