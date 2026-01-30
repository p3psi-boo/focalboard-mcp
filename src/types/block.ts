import { z } from "zod";

export const BlockTypeSchema = z.enum([
  "text", "image", "divider", "checkbox", "h1", "h2", "h3",
  "list-item", "attachment", "quote", "video", "card", "view", "comment"
]);

export const BlockSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  parentId: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  schema: z.number().optional(),
  type: BlockTypeSchema,
  title: z.string().optional(),
  fields: z.record(z.any()).optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
});

export const BlockPatchSchema = z.object({
  title: z.string().optional(),
  parentId: z.string().optional(),
  schema: z.number().optional(),
  type: BlockTypeSchema.optional(),
  updatedFields: z.record(z.any()).optional(),
  deletedFields: z.array(z.string()).optional(),
});

export const CreateBlockSchema = z.object({
  boardId: z.string(),
  parentId: z.string().optional(),
  type: BlockTypeSchema,
  title: z.string().optional(),
  fields: z.record(z.any()).optional(),
});

export type BlockType = z.infer<typeof BlockTypeSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type BlockPatch = z.infer<typeof BlockPatchSchema>;
export type CreateBlock = z.infer<typeof CreateBlockSchema>;
