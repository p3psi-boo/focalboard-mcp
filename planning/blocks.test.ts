import { test, expect, describe } from "bun:test";
import {
  BlockSchema,
  BlockPatchSchema,
  BlockPatchBatchSchema,
} from "./types";

describe("Block Schemas", () => {
  describe("BlockSchema", () => {
    test("validates minimal block", () => {
      const block = {
        type: "card",
      };
      expect(() => BlockSchema.parse(block)).not.toThrow();
    });

    test("validates full block", () => {
      const block = {
        id: "block-123",
        boardId: "board-123",
        parentId: "parent-123",
        rootId: "root-123",
        createdBy: "user-123",
        modifiedBy: "user-456",
        schema: 1,
        type: "card",
        title: "Test Card",
        fields: {
          properties: { status: "todo" },
          contentOrder: ["content-1"],
        },
        createAt: Date.now(),
        updateAt: Date.now(),
        deleteAt: 0,
      };
      expect(() => BlockSchema.parse(block)).not.toThrow();
    });

    test("rejects block without type", () => {
      const block = { title: "Test" };
      expect(() => BlockSchema.parse(block)).toThrow();
    });

    test("validates different block types", () => {
      const types = ["card", "view", "board", "text", "image", "divider"];
      types.forEach((type) => {
        const block = { type };
        expect(() => BlockSchema.parse(block)).not.toThrow();
      });
    });
  });

  describe("BlockPatchSchema", () => {
    test("validates empty patch", () => {
      const patch = {};
      expect(() => BlockPatchSchema.parse(patch)).not.toThrow();
    });

    test("validates partial patch", () => {
      const patch = {
        title: "Updated Title",
        type: "card",
      };
      expect(() => BlockPatchSchema.parse(patch)).not.toThrow();
    });

    test("validates full patch", () => {
      const patch = {
        parentId: "new-parent",
        schema: 2,
        type: "card",
        title: "Updated Card",
        fields: { status: "done" },
        updatedFields: { priority: "high" },
        deletedFields: ["oldField"],
      };
      expect(() => BlockPatchSchema.parse(patch)).not.toThrow();
    });

    test("validates field updates", () => {
      const patch = {
        updatedFields: { key1: "value1", key2: 123 },
        deletedFields: ["key3", "key4"],
      };
      expect(() => BlockPatchSchema.parse(patch)).not.toThrow();
    });
  });

  describe("BlockPatchBatchSchema", () => {
    test("validates batch with single item", () => {
      const batch = {
        blockIds: ["block-1"],
        blockPatches: [{ title: "Updated" }],
      };
      expect(() => BlockPatchBatchSchema.parse(batch)).not.toThrow();
    });

    test("validates batch with multiple items", () => {
      const batch = {
        blockIds: ["block-1", "block-2", "block-3"],
        blockPatches: [
          { title: "Card 1" },
          { title: "Card 2" },
          { title: "Card 3" },
        ],
      };
      expect(() => BlockPatchBatchSchema.parse(batch)).not.toThrow();
    });

    test("rejects batch without blockIds", () => {
      const batch = {
        blockPatches: [{ title: "Updated" }],
      };
      expect(() => BlockPatchBatchSchema.parse(batch)).toThrow();
    });

    test("rejects batch without blockPatches", () => {
      const batch = {
        blockIds: ["block-1"],
      };
      expect(() => BlockPatchBatchSchema.parse(batch)).toThrow();
    });

    test("validates batch with mismatched lengths", () => {
      const batch = {
        blockIds: ["block-1", "block-2"],
        blockPatches: [{ title: "Updated" }],
      };
      expect(() => BlockPatchBatchSchema.parse(batch)).not.toThrow();
    });
  });
});
