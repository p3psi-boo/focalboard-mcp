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
  /**
   * API prefix for Focalboard endpoints.
   * - Standalone: "/api/v2"
   * - Mattermost plugin: "/plugins/focalboard/api/v2"
   */
  apiPrefix: string;
  token: string;
  /** Optional CSRF token (Mattermost uses MMCSRF) */
  csrfToken?: string;
  /** Some deployments require this header (e.g. Mattermost). */
  requestedWith?: string;
}

export type PropertyOption = z.infer<typeof PropertyOptionSchema>;
export type PropertyTemplate = z.infer<typeof PropertyTemplateSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
