import { test, expect, describe } from "bun:test";
import {
  BoardSchema,
  BlockSchema,
  BoardPatchSchema,
  BlockPatchSchema,
} from "../../src/types";

describe("Validation Tests", () => {
  describe("Board Validation", () => {
    test("rejects invalid board data", () => {
      const invalid = { title: 123, teamId: null };
      expect(() => BoardSchema.parse(invalid)).toThrow();
    });

    test("validates board with required fields", () => {
      const board = {
        id: "b1",
        teamId: "team-1",
        title: "Board",
        type: "O",
      };
      const result = BoardSchema.parse(board);
      expect(result.title).toBe("Board");
    });

    test("validates board patch with undefined values", () => {
      const patch = { title: undefined, description: undefined };
      expect(() => BoardPatchSchema.parse(patch)).not.toThrow();
    });
  });

  describe("Block Validation", () => {
    test("rejects block without type", () => {
      const invalid = { title: "Block" };
      expect(() => BlockSchema.parse(invalid)).toThrow();
    });

    test("validates block with complex fields", () => {
      const block = {
        id: "blk1",
        boardId: "b1",
        type: "card",
        fields: {
          properties: { nested: { deep: { value: 123 } } },
          array: [1, 2, 3],
        },
      };
      expect(() => BlockSchema.parse(block)).not.toThrow();
    });

    test("validates block patch with field operations", () => {
      const patch = {
        updatedFields: { key1: "value1" },
        deletedFields: ["key2", "key3"],
      };
      expect(() => BlockPatchSchema.parse(patch)).not.toThrow();
    });
  });
});
