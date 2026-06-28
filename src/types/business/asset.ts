import { z } from 'zod';

/** 素材库图片资产。 */
export const assetSchema = z.object({
  assetId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  size: z.number().int().min(0),
  previewUrl: z.string(),
  createdAt: z.string(),
});

export type Asset = z.infer<typeof assetSchema>;