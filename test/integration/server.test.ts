import { test, expect, describe, beforeEach } from "bun:test";
import { createMockFocalboardAPI } from "../mocks";
import { mockBoards, mockBlocks } from "../fixtures";

describe("MCP Server Integration", () => {
  let api: ReturnType<typeof createMockFocalboardAPI>;

  beforeEach(() => {
    api = createMockFocalboardAPI();
  });

  describe("Board Operations", () => {
    test("lists boards for team", async () => {
      const boards = [mockBoards.kanban, mockBoards.table];
      api.mockGetBoards(boards);

      const response = await api.client.fetch(
        `${api.baseURL}/api/v2/teams/test-team/boards`
      );
      const data = await response.json() as any[];

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe("board-kanban");
    });

    test("gets single board", async () => {
      api.mockGetBoard("board-kanban", mockBoards.kanban);

      const response = await api.client.fetch(
        `${api.baseURL}/api/v2/boards/board-kanban`
      );
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.id).toBe("board-kanban");
      expect(data.title).toBe("Kanban Board");
    });

    test("creates new board", async () => {
      const newBoard = mockBoards.kanban;
      api.mockCreateBoard(newBoard);

      const response = await api.client.fetch(`${api.baseURL}/api/v2/boards`, {
        method: "POST",
        body: JSON.stringify(newBoard),
      });
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.id).toBe("board-kanban");
    });
  });

  describe("Block Operations", () => {
    test("lists blocks for board", async () => {
      const blocks = [mockBlocks.card, mockBlocks.view];
      api.mockGetBlocks("board-kanban", blocks);

      const response = await api.client.fetch(
        `${api.baseURL}/api/v2/boards/board-kanban/blocks`
      );
      const data = await response.json() as any[];

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].type).toBe("card");
    });

    test("gets single block", async () => {
      api.mockGetBlock("board-kanban", "block-card", mockBlocks.card);

      const response = await api.client.fetch(
        `${api.baseURL}/api/v2/boards/board-kanban/blocks/block-card`
      );
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.id).toBe("block-card");
      expect(data.type).toBe("card");
    });

    test("creates new block", async () => {
      const newBlock = mockBlocks.card;
      api.mockCreateBlock("board-kanban", newBlock);

      const response = await api.client.fetch(
        `${api.baseURL}/api/v2/boards/board-kanban/blocks`,
        {
          method: "POST",
          body: JSON.stringify(newBlock),
        }
      );
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.id).toBe("block-card");
    });
  });

  describe("Search Operations", () => {
    test("searches boards", async () => {
      const results = [mockBoards.kanban];
      api.mockSearch("kanban", results);

      const response = await api.client.fetch(
        `${api.baseURL}/api/v2/teams/test-team/boards/search?q=kanban`
      );
      const data = await response.json() as any[];

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toContain("Kanban");
    });
  });
});
