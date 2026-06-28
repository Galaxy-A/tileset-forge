import { z } from 'zod';

/** 业务矩形区域。 */
export const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

/** 源图片信息。 */
export const sourceImageSchema = z.object({
  assetId: z.string().optional(),
  fileName: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  objectUrl: z.string(),
});

/** 已捕获截图。 */
export const capturedSpriteSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceRect: rectSchema,
  imageDataUrl: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  selected: z.boolean(),
});

/** Layout Board 上的排版项。 */
export const layoutItemSchema = z.object({
  captureId: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  zIndex: z.number().int().min(0),
});

/** 编辑器导出设置。 */
export const exportSettingsSchema = z.object({
  tilesetName: z.string(),
  columns: z.number().int().positive(),
  tiledVersion: z.string(),
});

export type Rect = z.infer<typeof rectSchema>;
export type SourceImage = z.infer<typeof sourceImageSchema>;
export type CapturedSprite = z.infer<typeof capturedSpriteSchema>;
export type LayoutItem = z.infer<typeof layoutItemSchema>;
export type ExportSettings = z.infer<typeof exportSettingsSchema>;