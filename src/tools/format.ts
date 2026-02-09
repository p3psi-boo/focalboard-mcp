import type { Board } from "../types/board";
import type { Block } from "../types/block";

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
