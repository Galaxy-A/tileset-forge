import { z } from 'zod';

/** 通用 API 响应结构。 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(bodySchema: T) =>
  z.object({
    error: z.number(),
    body: bodySchema,
    message: z.string(),
    success: z.boolean(),
  });

/** 通用 API 响应类型。 */
export type ApiResponse<T> = {
  readonly error: number;
  readonly body: T;
  readonly message: string;
  readonly success: boolean;
};