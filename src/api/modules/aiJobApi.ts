import { get, post } from '@/api/request';
import type { ApiResponse } from '@/types/api/common';
import type { AiJob } from '@/types/business/ai-job';

/**
 * 创建 AI 图像任务
 * 功能描述：创建未来服务端 AI 抠图、批量切片或网格归一化任务
 * 入参：{ assetId: string, projectId?: string, type: string }
 * 返回参数：AI 任务状态
 * url地址：/api/ai/jobs
 * 请求方式：POST
 */
export const createAiJob = (params: Pick<AiJob, 'assetId' | 'projectId' | 'type'>): Promise<ApiResponse<AiJob>> =>
  post('/api/ai/jobs', params);

/**
 * 查询 AI 图像任务
 * 功能描述：按任务 ID 查询未来异步图像处理进度
 * 入参：{ jobId: string }
 * 返回参数：AI 任务状态
 * url地址：/api/ai/jobs/detail
 * 请求方式：GET
 */
export const getAiJob = (params: { readonly jobId: string }): Promise<ApiResponse<AiJob>> =>
  get('/api/ai/jobs/detail', params);