import { z } from 'zod';
import { capturedSpriteSchema, exportSettingsSchema, layoutItemSchema, sourceImageSchema } from './sprite-sheet';
import { spriteSheetGridConfigSchema } from '../api/sprite-sheet';

/** 云端项目快照。 */
export const projectSnapshotSchema = z.object({
  projectId: z.string(),
  ownerId: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  sourceImage: sourceImageSchema.optional(),
  grid: spriteSheetGridConfigSchema,
  captures: z.array(capturedSpriteSchema),
  layout: z.array(layoutItemSchema),
  exportSettings: exportSettingsSchema,
  version: z.number().int().min(1),
  updatedAt: z.string(),
});

export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;