import { test, expect, describe } from "bun:test";
import { createMockBoard, createMockBlock } from "../fixtures";

describe("Performance Tests", () => {
  test("handles large board creation", () => {
    const start = performance.now();
    const boards = Array.from({ length: 1000 }, (_, i) =>
      createMockBoard({ id: `board-${i}`, title: `Board ${i}` })
    );
    const duration = performance.now() - start;

    expect(boards).toHaveLength(1000);
    expect(duration).toBeLessThan(1000); // Should complete in <1s
  });

  test("handles large block batch", () => {
    const start = performance.now();
    const blocks = Array.from({ length: 10000 }, (_, i) =>
      createMockBlock({ id: `block-${i}`, type: "card" })
    );
    const duration = performance.now() - start;

    expect(blocks).toHaveLength(10000);
    expect(duration).toBeLessThan(2000); // Should complete in <2s
  });

  test("handles deep hierarchy", () => {
    let parent = createMockBlock({ id: "root", type: "card" });
    const blocks = [parent];

    for (let i = 0; i < 100; i++) {
      const child = createMockBlock({
        id: `child-${i}`,
        parentId: parent.id,
        type: "card",
      });
      blocks.push(child);
      parent = child;
    }

    expect(blocks).toHaveLength(101);
    expect(blocks[100]?.parentId).toBe("child-98");
  });
});
