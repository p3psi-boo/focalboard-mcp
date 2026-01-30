import { z } from "zod";

export const PropertyOptionSchema = z.object({
  id: z.string(),
  value: z.string(),
  color: z.string().optional(),
});

export const PropertyTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["text", "number", "select", "multiSelect", "date", "person", "checkbox", "url", "email", "phone", "createdTime", "createdBy", "updatedTime", "updatedBy"]),
  options: z.array(PropertyOptionSchema).optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  errorCode: z.number().optional(),
});

export interface FocalboardConfig {
  baseUrl: string;
  token: string;
}

export type PropertyOption = z.infer<typeof PropertyOptionSchema>;
export type PropertyTemplate = z.infer<typeof PropertyTemplateSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
