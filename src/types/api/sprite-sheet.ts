import { z } from 'zod';

/** Sprite Sheet 默认网格参数。 */
export const spriteSheetGridConfigSchema = z.object({
  tileWidth: z.number().int().positive(),
  tileHeight: z.number().int().positive(),
  margin: z.number().int().min(0),
  spacing: z.number().int().min(0),
  zoom: z.number().min(25).max(200),
  showGrid: z.boolean(),
});

/** Tiled 导出默认参数。 */
export const tiledExportConfigSchema = z.object({
  tilesetName: z.string(),
  imageFileName: z.string(),
  tsxFileName: z.string(),
  jsonFileName: z.string(),
  tiledVersion: z.string(),
  supportedFormats: z.array(z.string()),
});

/** Sprite Sheet 编辑器默认配置。 */
export const spriteSheetDefaultConfigSchema = z.object({
  grid: spriteSheetGridConfigSchema,
  export: tiledExportConfigSchema,
  futureFeatures: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      enabled: z.boolean(),
    }),
  ),
});

/** 导出记录创建参数。 */
export const createExportRecordParamsSchema = z.object({
  projectId: z.string().optional(),
  tilesetName: z.string(),
  imageWidth: z.number().int().min(0),
  imageHeight: z.number().int().min(0),
  tileWidth: z.number().int().positive(),
  tileHeight: z.number().int().positive(),
  tileCount: z.number().int().min(0),
  columns: z.number().int().min(0),
  formats: z.array(z.enum(['png', 'tsx', 'json'])),
});

/** 导出记录创建结果。 */
export const exportRecordSchema = z.object({
  exportId: z.string(),
  createdAt: z.string(),
});

export type SpriteSheetDefaultConfig = z.infer<typeof spriteSheetDefaultConfigSchema>;
export type SpriteSheetGridConfig = z.infer<typeof spriteSheetGridConfigSchema>;
export type TiledExportConfig = z.infer<typeof tiledExportConfigSchema>;
export type CreateExportRecordParams = z.infer<typeof createExportRecordParamsSchema>;
export type ExportRecord = z.infer<typeof exportRecordSchema>;