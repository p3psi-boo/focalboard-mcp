import type { FocalboardClient } from "../client/focalboard";
import { CreateCardSchema, CardPatchSchema } from "../types/card";
import { formatCard } from "./format";

export const cardTools = [
  {
    name: "list_cards",
    description: "List cards in a board with pagination. Returns cards with their properties. Much more efficient than get_blocks for card listing.",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      page: { type: "number", description: "Page number (0-based, default 0)" },
      per_page: { type: "number", description: "Cards per page (default 20, max 100)" },
    }, required: ["board"] },
  },
  {
    name: "get_card",
    description: "Get a single card with all its properties",
    inputSchema: { type: "object", properties: {
      card: { type: "string", description: "Card ID" },
    }, required: ["card"] },
  },
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
  {
    name: "update_card",
    description: "Update a card's title, icon, or properties incrementally. Uses updatedProperties for partial property updates (only changes specified properties, leaves others untouched).",
    inputSchema: { type: "object", properties: {
      card: { type: "string", description: "Card ID" },
      patch: { type: "object", description: "Fields to update: title, icon, updatedProperties, deletedProperties, contentOrder" },
    }, required: ["card", "patch"] },
  },
];

export async function handleCardTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "list_cards": {
      const board = await client.resolveBoard(args.board as string);
      const page = (args.page as number) ?? 0;
      const perPage = Math.min((args.per_page as number) ?? 20, 100);
      const cards = await client.listCards(board.id, page, perPage);
      return cards.map(formatCard);
    }
    case "get_card": {
      const card = await client.getCard(args.card as string);
      return formatCard(card);
    }
    case "create_card": {
      const board = await client.resolveBoard(args.board as string);
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
    }
    case "update_card": {
      const cardId = args.card as string;
      const rawPatch = args.patch as Record<string, unknown>;
      // Transform: if properties is set, move to updatedProperties for the PATCH API
      if (rawPatch.properties && !rawPatch.updatedProperties) {
        rawPatch.updatedProperties = rawPatch.properties;
        delete rawPatch.properties;
      }
      // Focalboard PATCH /cards/{id} replaces properties wholesale via BlockPatch,
      // despite the field name "updatedProperties". We must merge client-side.
      if (rawPatch.updatedProperties) {
        const existing = await client.getCard(cardId);
        const merged = { ...(existing.properties ?? {}), ...(rawPatch.updatedProperties as Record<string, unknown>) };
        // Handle deletedProperties: remove keys marked for deletion
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
    }
    default: throw new Error(`Unknown card tool: ${name}`);
  }
}
