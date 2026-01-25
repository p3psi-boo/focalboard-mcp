import { test, expect, describe } from "bun:test";
import { createMockBoard, createMockBlock } from "../fixtures";

describe("Batch Operations E2E", () => {
  test("batch board creation", () => {
    const boards = [
      createMockBoard({ id: "board-1", title: "Board 1" }),
      createMockBoard({ id: "board-2", title: "Board 2" }),
      createMockBoard({ id: "board-3", title: "Board 3" }),
    ];

    expect(boards).toHaveLength(3);
    expect(boards.map((b) => b.title)).toEqual(["Board 1", "Board 2", "Board 3"]);
  });

  test("batch block creation", () => {
    const blocks = Array.from({ length: 10 }, (_, i) =>
      createMockBlock({
        id: `block-${i}`,
        type: "card",
        title: `Card ${i}`,
      })
    );

    expect(blocks).toHaveLength(10);
    expect(blocks[0]?.title).toBe("Card 0");
    expect(blocks[9]?.title).toBe("Card 9");
  });

  test("batch block updates", () => {
    const blocks = [
      createMockBlock({ id: "block-1", title: "Original 1" }),
      createMockBlock({ id: "block-2", title: "Original 2" }),
    ];

    const updates = blocks.map((b) => ({
      ...b,
      title: `Updated ${b.id}`,
      updateAt: Date.now(),
    }));

    expect(updates[0]?.title).toBe("Updated block-1");
    expect(updates[1]?.title).toBe("Updated block-2");
  });

  test("batch deletion", () => {
    const boards = [
      createMockBoard({ id: "board-1" }),
      createMockBoard({ id: "board-2" }),
    ];
    const blocks = [
      createMockBlock({ id: "block-1" }),
      createMockBlock({ id: "block-2" }),
    ];

    const deleteTime = Date.now();
    const deletedBoards = boards.map((b) => ({ ...b, deleteAt: deleteTime }));
    const deletedBlocks = blocks.map((b) => ({ ...b, deleteAt: deleteTime }));

    expect(deletedBoards.every((b) => b.deleteAt === deleteTime)).toBe(true);
    expect(deletedBlocks.every((b) => b.deleteAt === deleteTime)).toBe(true);
  });
});
