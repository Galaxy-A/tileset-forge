import { get, post } from '@/api/request';
import type { ApiResponse } from '@/types/api/common';
import type { ProjectSnapshot } from '@/types/business/project';

/**
 * 创建云端项目
 * 功能描述：为未来账号体系创建可同步的 Sprite Sheet 项目
 * 入参：{ name: string }
 * 返回参数：项目快照
 * url地址：/api/projects
 * 请求方式：POST
 */
export const createProject = (params: { readonly name: string }): Promise<ApiResponse<ProjectSnapshot>> =>
  post('/api/projects', params);

/**
 * 获取项目快照
 * 功能描述：按项目 ID 获取云端编辑状态快照
 * 入参：{ projectId: string }
 * 返回参数：项目快照
 * url地址：/api/projects/detail
 * 请求方式：GET
 */
export const getProjectSnapshot = (params: { readonly projectId: string }): Promise<ApiResponse<ProjectSnapshot>> =>
  get('/api/projects/detail', params);

/**
 * 保存项目快照
 * 功能描述：保存可跨设备恢复的编辑器状态
 * 入参：ProjectSnapshot
 * 返回参数：项目快照
 * url地址：/api/projects/snapshots
 * 请求方式：POST
 */
export const saveProjectSnapshot = (params: ProjectSnapshot): Promise<ApiResponse<ProjectSnapshot>> =>
  post('/api/projects/snapshots', params);