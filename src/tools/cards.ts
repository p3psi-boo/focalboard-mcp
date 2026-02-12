import type { FocalboardClient } from "../client/focalboard";
import { CreateCardSchema, CardPatchSchema } from "../types/card";
import { formatCard } from "./format";
import { config } from "../config";
import { registerTool } from "./registry";

registerTool(
  {
    name: "list_cards",
    description: "List cards in a board with pagination. Returns cards with their properties. Much more efficient than get_blocks for card listing.",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      page: { type: "number", description: "Page number (0-based, default 0)" },
      per_page: { type: "number", description: "Cards per page (default 20, max 100)" },
    }, required: ["board"] },
  },
  async (client, args) => {
    const board = await client.resolveBoard(args.board as string, config.focalboard.teamId);
    const page = (args.page as number) ?? 0;
    const perPage = Math.min((args.per_page as number) ?? 20, 100);
    const cards = await client.listCards(board.id, page, perPage);
    return cards.map(formatCard);
  },
);

registerTool(
  {
    name: "get_card",
    description: "Get a single card with all its properties",
    inputSchema: { type: "object", properties: {
      card: { type: "string", description: "Card ID" },
    }, required: ["card"] },
  },
  async (client, args) => {
    const card = await client.getCard(args.card as string);
    return formatCard(card);
  },
);

registerTool(
  {
    name: "create_card",
    description: "Create a new card in a board with properties. Use get_board first to understand the board's property schema (property IDs and option IDs).",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      title: { type: "string", description: "Card title" },
      icon: { type: "string", description: "Card icon (emoji)" },
      properties: { type: "object", description: "Card properties as {propertyId: value}. For select properties, value is the option ID." },
      description: { type: "string", description: "Card description (creates a text block as card content and sets contentOrder automatically)" },
      contentOrder: { type: "array", description: "Content block ordering (ignored when description is provided)" },
    }, required: ["board"] },
  },
  async (client, args) => {
    const board = await client.resolveBoard(args.board as string, config.focalboard.teamId);
    const description = args.description as string | undefined;
    const data = CreateCardSchema.parse({
      title: args.title,
      icon: args.icon,
      properties: args.properties,
      contentOrder: args.contentOrder,
    });
    const card = await client.createCard(board.id, data);

    if (description) {
      const blocks = await client.createBlocks(board.id, [
        { type: "text" as const, title: description, parentId: card.id },
      ]);
      if (!blocks.length) throw new Error("Failed to create description block");
      const patched = await client.updateCard(card.id, {
        contentOrder: [blocks[0]!.id],
      });
      return formatCard(patched);
    }

    return formatCard(card);
  },
);

registerTool(
  {
    name: "update_card",
    description: "Update a card's title, icon, or properties incrementally. Uses updatedProperties for partial property updates (only changes specified properties, leaves others untouched).",
    inputSchema: { type: "object", properties: {
      card: { type: "string", description: "Card ID" },
      patch: { type: "object", description: "Fields to update: title, icon, updatedProperties, deletedProperties, contentOrder" },
    }, required: ["card", "patch"] },
  },
  async (client, args) => {
    const cardId = args.card as string;
    const rawPatch = args.patch as Record<string, unknown>;
    if (rawPatch.properties && !rawPatch.updatedProperties) {
      rawPatch.updatedProperties = rawPatch.properties;
      delete rawPatch.properties;
    }
    if (rawPatch.updatedProperties) {
      const existing = await client.getCard(cardId);
      const merged = { ...(existing.properties ?? {}), ...(rawPatch.updatedProperties as Record<string, unknown>) };
      if (rawPatch.deletedProperties) {
        for (const key of rawPatch.deletedProperties as string[]) {
          delete merged[key];
        }
        delete rawPatch.deletedProperties;
      }
      rawPatch.updatedProperties = merged;
    }
    const patch = CardPatchSchema.parse(rawPatch);
    const result = await client.updateCard(cardId, patch);
    return formatCard(result);
  },
);
