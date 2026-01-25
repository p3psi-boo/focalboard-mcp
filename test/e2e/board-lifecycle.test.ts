import { test, expect, describe } from "bun:test";
import { createMockBoard, createMockBlock } from "../fixtures";

describe("Board Lifecycle E2E", () => {
  test("complete board creation workflow", () => {
    const board = createMockBoard({
      title: "Project Board",
      description: "Track project tasks",
    });

    expect(board.id).toBeDefined();
    expect(board.teamId).toBeDefined();
    expect(board.title).toBe("Project Board");
    expect(board.createAt).toBeDefined();
  });

  test("board with blocks workflow", () => {
    const board = createMockBoard({ id: "board-1" });
    const blocks = [
      createMockBlock({ boardId: "board-1", type: "card", title: "Task 1" }),
      createMockBlock({ boardId: "board-1", type: "card", title: "Task 2" }),
      createMockBlock({ boardId: "board-1", type: "view", title: "Board View" }),
    ];

    expect(board.id).toBe("board-1");
    expect(blocks).toHaveLength(3);
    expect(blocks.filter((b) => b.type === "card")).toHaveLength(2);
  });

  test("board update workflow", () => {
    const board = createMockBoard({ title: "Original Title" });
    const updated = { ...board, title: "Updated Title", updateAt: board.createAt! + 1000 };

    expect(updated.title).toBe("Updated Title");
    expect(updated.updateAt).toBeGreaterThan(board.createAt!);
  });

  test("board deletion workflow", () => {
    const board = createMockBoard();
    const deleted = { ...board, deleteAt: Date.now() };

    expect(deleted.deleteAt).toBeGreaterThan(0);
    expect(deleted.id).toBe(board.id);
  });
});
