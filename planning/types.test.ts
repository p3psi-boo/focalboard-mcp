import { test, expect, describe } from "bun:test";
import {
  BoardSchema,
  BoardPatchSchema,
  BoardMemberSchema,
  BoardMetadataSchema,
  BlockSchema,
  BlockPatchSchema,
  BlockPatchBatchSchema,
  BoardsAndBlocksSchema,
  PatchBoardsAndBlocksSchema,
  DeleteBoardsAndBlocksSchema,
  ErrorResponseSchema,
  GetBlocksQuerySchema,
  SearchQuerySchema,
  DisableNotifySchema,
} from "./types";

describe("Board Schemas", () => {
  describe("BoardSchema", () => {
    test("validates minimal board", () => {
      const board = {
        teamId: "team-123",
        title: "Test Board",
      };
      expect(() => BoardSchema.parse(board)).not.toThrow();
    });

    test("validates full board", () => {
      const board = {
        id: "board-123",
        teamId: "team-123",
        title: "Test Board",
        description: "Test Description",
        icon: "📋",
        showDescription: true,
        isTemplate: false,
        templateVersion: 1,
        properties: { color: "blue" },
        cardProperties: [{ id: "prop1" }],
        createAt: Date.now(),
        updateAt: Date.now(),
        deleteAt: 0,
        createdBy: "user-123",
        modifiedBy: "user-123",
        type: "board",
        minimumRole: "viewer",
      };
      expect(() => BoardSchema.parse(board)).not.toThrow();
    });

    test("rejects board without teamId", () => {
      const board = { title: "Test Board" };
      expect(() => BoardSchema.parse(board)).toThrow();
    });

    test("rejects board without title", () => {
      const board = { teamId: "team-123" };
      expect(() => BoardSchema.parse(board)).toThrow();
    });
  });

  describe("BoardPatchSchema", () => {
    test("validates empty patch", () => {
      const patch = {};
      expect(() => BoardPatchSchema.parse(patch)).not.toThrow();
    });

    test("validates partial patch", () => {
      const patch = {
        title: "Updated Title",
        description: "Updated Description",
      };
      expect(() => BoardPatchSchema.parse(patch)).not.toThrow();
    });

    test("validates full patch", () => {
      const patch = {
        title: "Updated Title",
        description: "Updated Description",
        icon: "🎯",
        showDescription: false,
        properties: { priority: "high" },
        cardProperties: [{ id: "prop2" }],
        type: "kanban",
        minimumRole: "editor",
      };
      expect(() => BoardPatchSchema.parse(patch)).not.toThrow();
    });
  });

  describe("BoardMemberSchema", () => {
    test("validates minimal member", () => {
      const member = {
        boardId: "board-123",
        userId: "user-123",
        roles: "viewer",
      };
      expect(() => BoardMemberSchema.parse(member)).not.toThrow();
    });

    test("validates full member", () => {
      const member = {
        boardId: "board-123",
        userId: "user-123",
        roles: "admin",
        minimumRole: "viewer",
        schemeAdmin: true,
        schemeEditor: true,
        schemeCommenter: true,
        schemeViewer: true,
      };
      expect(() => BoardMemberSchema.parse(member)).not.toThrow();
    });

    test("rejects member without required fields", () => {
      const member = { boardId: "board-123" };
      expect(() => BoardMemberSchema.parse(member)).toThrow();
    });
  });

  describe("BoardMetadataSchema", () => {
    test("validates minimal metadata", () => {
      const metadata = { boardId: "board-123" };
      expect(() => BoardMetadataSchema.parse(metadata)).not.toThrow();
    });

    test("validates full metadata", () => {
      const metadata = {
        boardId: "board-123",
        descriptionLastUpdateAt: Date.now(),
        lastActivityAt: Date.now(),
        createdBy: "user-123",
        modifiedBy: "user-456",
      };
      expect(() => BoardMetadataSchema.parse(metadata)).not.toThrow();
    });
  });
});
