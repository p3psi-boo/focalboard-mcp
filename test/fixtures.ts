import type { Board } from "../src/types/board";
import type { Block } from "../src/types/block";

export interface BoardMember {
  boardId: string;
  userId: string;
  roles: string;
  minimumRole?: string;
  schemeAdmin?: boolean;
  schemeEditor?: boolean;
  schemeCommenter?: boolean;
  schemeViewer?: boolean;
}

export interface BoardMetadata {
  boardId: string;
  descriptionLastUpdateAt?: number;
  lastActivityAt?: number;
  createdBy?: string;
  modifiedBy?: string;
}

export const createMockBoard = (overrides?: Partial<Board>): Board => ({
  id: "board-test-123",
  teamId: "team-test-456",
  title: "Test Board",
  description: "Test board description",
  icon: "\u{1F4CB}",
  showDescription: true,
  isTemplate: false,
  templateVersion: 1,
  properties: {},
  cardProperties: [],
  createAt: Date.now(),
  updateAt: Date.now(),
  deleteAt: 0,
  createdBy: "user-test-789",
  modifiedBy: "user-test-789",
  type: "O",
  minimumRole: "viewer",
  ...overrides,
});

export const createMockBlock = (overrides?: Partial<Block>): Block => ({
  id: "block-test-123",
  boardId: "board-test-456",
  parentId: "parent-test-789",
  createdBy: "user-test-111",
  modifiedBy: "user-test-111",
  schema: 1,
  type: "card",
  title: "Test Card",
  fields: {
    properties: {},
    contentOrder: [],
  },
  createAt: Date.now(),
  updateAt: Date.now(),
  deleteAt: 0,
  ...overrides,
});

export const createMockBoardMember = (
  overrides?: Partial<BoardMember>
): BoardMember => ({
  boardId: "board-test-123",
  userId: "user-test-456",
  roles: "viewer",
  minimumRole: "viewer",
  schemeAdmin: false,
  schemeEditor: false,
  schemeCommenter: false,
  schemeViewer: true,
  ...overrides,
});

export const createMockBoardMetadata = (
  overrides?: Partial<BoardMetadata>
): BoardMetadata => ({
  boardId: "board-test-123",
  descriptionLastUpdateAt: Date.now(),
  lastActivityAt: Date.now(),
  createdBy: "user-test-456",
  modifiedBy: "user-test-789",
  ...overrides,
});

export const mockBoards = {
  kanban: createMockBoard({
    id: "board-kanban",
    title: "Kanban Board",
    type: "O",
  }),
  table: createMockBoard({
    id: "board-table",
    title: "Table Board",
    type: "P",
  }),
  gallery: createMockBoard({
    id: "board-gallery",
    title: "Gallery Board",
    type: "O",
  }),
};

export const mockBlocks = {
  card: createMockBlock({
    id: "block-card",
    type: "card",
    title: "Test Card",
  }),
  view: createMockBlock({
    id: "block-view",
    type: "view",
    title: "Board View",
  }),
  text: createMockBlock({
    id: "block-text",
    type: "text",
    title: "Text Block",
  }),
  image: createMockBlock({
    id: "block-image",
    type: "image",
    title: "Image Block",
  }),
};
