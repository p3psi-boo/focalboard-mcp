import { test, expect, describe } from "bun:test";
import {
  BoardsAndBlocksSchema,
  PatchBoardsAndBlocksSchema,
  DeleteBoardsAndBlocksSchema,
} from "./types";

describe("Combined Operations Schemas", () => {
  describe("BoardsAndBlocksSchema", () => {
    test("validates empty operation", () => {
      const data = {};
      expect(() => BoardsAndBlocksSchema.parse(data)).not.toThrow();
    });

    test("validates boards only", () => {
      const data = {
        boards: [
          { teamId: "team-1", title: "Board 1" },
          { teamId: "team-1", title: "Board 2" },
        ],
      };
      expect(() => BoardsAndBlocksSchema.parse(data)).not.toThrow();
    });

    test("validates blocks only", () => {
      const data = {
        blocks: [
          { type: "card", title: "Card 1" },
          { type: "view", title: "View 1" },
        ],
      };
      expect(() => BoardsAndBlocksSchema.parse(data)).not.toThrow();
    });

    test("validates both boards and blocks", () => {
      const data = {
        boards: [{ teamId: "team-1", title: "Board 1" }],
        blocks: [{ type: "card", title: "Card 1" }],
      };
      expect(() => BoardsAndBlocksSchema.parse(data)).not.toThrow();
    });
  });

  describe("PatchBoardsAndBlocksSchema", () => {
    test("validates empty patch", () => {
      const patch = {};
      expect(() => PatchBoardsAndBlocksSchema.parse(patch)).not.toThrow();
    });

    test("validates board patches only", () => {
      const patch = {
        boardIDs: ["board-1", "board-2"],
        boardPatches: [{ title: "Updated 1" }, { title: "Updated 2" }],
      };
      expect(() => PatchBoardsAndBlocksSchema.parse(patch)).not.toThrow();
    });

    test("validates block patches only", () => {
      const patch = {
        blockIDs: ["block-1", "block-2"],
        blockPatches: [{ title: "Card 1" }, { title: "Card 2" }],
      };
      expect(() => PatchBoardsAndBlocksSchema.parse(patch)).not.toThrow();
    });

    test("validates both board and block patches", () => {
      const patch = {
        boardIDs: ["board-1"],
        boardPatches: [{ title: "Updated Board" }],
        blockIDs: ["block-1", "block-2"],
        blockPatches: [{ title: "Card 1" }, { title: "Card 2" }],
      };
      expect(() => PatchBoardsAndBlocksSchema.parse(patch)).not.toThrow();
    });
  });

  describe("DeleteBoardsAndBlocksSchema", () => {
    test("validates empty deletion", () => {
      const deletion = {};
      expect(() => DeleteBoardsAndBlocksSchema.parse(deletion)).not.toThrow();
    });

    test("validates board deletions only", () => {
      const deletion = {
        boards: ["board-1", "board-2", "board-3"],
      };
      expect(() => DeleteBoardsAndBlocksSchema.parse(deletion)).not.toThrow();
    });

    test("validates block deletions only", () => {
      const deletion = {
        blocks: ["block-1", "block-2"],
      };
      expect(() => DeleteBoardsAndBlocksSchema.parse(deletion)).not.toThrow();
    });

    test("validates both board and block deletions", () => {
      const deletion = {
        boards: ["board-1"],
        blocks: ["block-1", "block-2", "block-3"],
      };
      expect(() => DeleteBoardsAndBlocksSchema.parse(deletion)).not.toThrow();
    });
  });
});
