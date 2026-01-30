import { z } from "zod";
import { PropertyTemplateSchema } from "./common";

export const BoardSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  channelId: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  type: z.enum(["O", "P"]),
  minimumRole: z.enum(["admin", "editor", "commenter", "viewer"]).optional(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  showDescription: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  templateVersion: z.number().optional(),
  properties: z.record(z.any()).optional(),
  cardProperties: z.array(PropertyTemplateSchema).optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
});

export const BoardPatchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  showDescription: z.boolean().optional(),
  type: z.enum(["O", "P"]).optional(),
  minimumRole: z.enum(["admin", "editor", "commenter", "viewer"]).optional(),
  channelId: z.string().optional(),
  cardProperties: z.array(PropertyTemplateSchema).optional(),
  updatedProperties: z.record(z.any()).optional(),
  deletedProperties: z.array(z.string()).optional(),
  updatedCardProperties: z.array(PropertyTemplateSchema).optional(),
  deletedCardProperties: z.array(z.string()).optional(),
});

export const CreateBoardSchema = z.object({
  teamId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(["O", "P"]).optional(),
  cardProperties: z.array(PropertyTemplateSchema).optional(),
});

export type Board = z.infer<typeof BoardSchema>;
export type BoardPatch = z.infer<typeof BoardPatchSchema>;
export type CreateBoard = z.infer<typeof CreateBoardSchema>;
