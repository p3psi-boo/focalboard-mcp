import { z } from "zod";

export const CardSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  title: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  contentOrder: z.array(z.any()).optional(),
  icon: z.string().optional(),
  isTemplate: z.boolean().optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
});

export const CardPatchSchema = z.object({
  title: z.string().optional(),
  icon: z.string().optional(),
  contentOrder: z.array(z.any()).optional(),
  updatedProperties: z.record(z.string(), z.any()).optional(),
  deletedProperties: z.array(z.string()).optional(),
});

export const CreateCardSchema = z.object({
  title: z.string().optional(),
  icon: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  contentOrder: z.array(z.any()).optional(),
});

export type Card = z.infer<typeof CardSchema>;
export type CardPatch = z.infer<typeof CardPatchSchema>;
export type CreateCard = z.infer<typeof CreateCardSchema>;
