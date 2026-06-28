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

export type AiJob = z.infer<typeof aiJobSchema>;