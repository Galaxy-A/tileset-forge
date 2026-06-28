import { z } from 'zod';

/** AI 图像处理任务。 */
export const aiJobSchema = z.object({
  jobId: z.string(),
  projectId: z.string().optional(),
  assetId: z.string(),
  type: z.enum(['remove-background', 'batch-slice', 'normalize-grid']),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  resultAssetId: z.string().optional(),
  createdAt: z.string(),
});

/** 去背景处理请求。 */
export const removeBackgroundRequestSchema = z.object({
  assetId: z.string().optional(),
  fileName: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  strategy: z.enum(['corner-sample']).default('corner-sample'),
});

/** 去背景处理结果摘要。 */
export const removeBackgroundResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['completed']),
  strategy: z.enum(['corner-sample']),
  processedAt: z.string(),
  transparentBackground: z.boolean(),
  message: z.string(),
});

export type AiJob = z.infer<typeof aiJobSchema>;
export type RemoveBackgroundRequest = z.infer<typeof removeBackgroundRequestSchema>;
export type RemoveBackgroundResult = z.infer<typeof removeBackgroundResultSchema>;