import type { Board } from "../types/board";
import type { Block } from "../types/block";
import type { Card } from "../types/card";

export function formatBoard(b: Board) {
  return {
    id: b.id,
    title: b.title,
    ...(b.description ? { description: b.description } : {}),
    ...(b.icon ? { icon: b.icon } : {}),
    type: b.type,
    ...(b.cardProperties?.length ? { cardProperties: b.cardProperties } : {}),
  };
}

export function formatBlock(b: Block) {
  return {
    id: b.id,
    boardId: b.boardId,
    type: b.type,
    ...(b.title ? { title: b.title } : {}),
    ...(b.parentId ? { parentId: b.parentId } : {}),
    ...(b.fields && Object.keys(b.fields).length ? { fields: b.fields } : {}),
  };
}

export function formatCard(c: Card) {
  return {
    id: c.id,
    boardId: c.boardId,
    ...(c.title ? { title: c.title } : {}),
    ...(c.icon ? { icon: c.icon } : {}),
    ...(c.properties && Object.keys(c.properties).length ? { properties: c.properties } : {}),
    ...(c.contentOrder?.length ? { contentOrder: c.contentOrder } : {}),
  };
}

export function formatMember(m: any) {
  return {
    userId: m.userId,
    boardId: m.boardId,
    ...(m.roles ? { roles: m.roles } : {}),
    ...(m.minimumRole ? { minimumRole: m.minimumRole } : {}),
    ...(m.schemeAdmin !== undefined ? { schemeAdmin: m.schemeAdmin } : {}),
    ...(m.schemeEditor !== undefined ? { schemeEditor: m.schemeEditor } : {}),
    ...(m.synthetic !== undefined ? { synthetic: m.synthetic } : {}),
  };
}
