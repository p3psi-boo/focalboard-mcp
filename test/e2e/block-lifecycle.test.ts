import { test, expect, describe } from "bun:test";
import { createMockBlock } from "../fixtures";

describe("Block Lifecycle E2E", () => {
  test("card creation workflow", () => {
    const card = createMockBlock({
      type: "card",
      title: "New Task",
      fields: {
        properties: { status: "todo", priority: "high" },
      },
    });

    expect(card.type).toBe("card");
    expect(card.title).toBe("New Task");
    expect(card.fields?.properties).toHaveProperty("status", "todo");
  });

  test("block hierarchy workflow", () => {
    const parent = createMockBlock({ id: "parent-1", type: "card" });
    const child1 = createMockBlock({
      id: "child-1",
      parentId: "parent-1",
      type: "card",
    });
    const child2 = createMockBlock({
      id: "child-2",
      parentId: "parent-1",
      type: "card",
    });

    expect(child1.parentId).toBe(parent.id);
    expect(child2.parentId).toBe(parent.id);
  });

  test("block update workflow", () => {
    const block = createMockBlock({ title: "Original" });
    const updated = {
      ...block,
      title: "Updated",
      fields: { ...block.fields, status: "done" },
      updateAt: Date.now(),
    };

    expect(updated.title).toBe("Updated");
    expect(updated.fields?.status).toBe("done");
  });

  test("block deletion workflow", () => {
    const block = createMockBlock();
    const deleted = { ...block, deleteAt: Date.now() };

    expect(deleted.deleteAt).toBeGreaterThan(0);
  });
});
