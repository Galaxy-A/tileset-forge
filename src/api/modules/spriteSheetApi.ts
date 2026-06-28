import { get, post } from '@/api/request';
import type { ApiResponse } from '@/types/api/common';
import type { CreateExportRecordParams, ExportRecord, SpriteSheetDefaultConfig } from '@/types/api/sprite-sheet';

/**
 * 获取 Sprite Sheet 编辑器默认配置
 * 功能描述：获取默认 tile 参数、导出文件名、支持格式和未来能力入口
 * 入参：无
 * 返回参数：Sprite Sheet 编辑器默认配置
 * url地址：/api/sprite-sheet/default-config
 * 请求方式：GET
 */
export const getSpriteSheetDefaultConfig = (): Promise<ApiResponse<SpriteSheetDefaultConfig>> =>
  get('/api/sprite-sheet/default-config');

/**
 * 创建导出记录
 * 功能描述：记录本地导出后的 tileset 摘要，后续可替换为服务端存储
 * 入参：{ projectId?: string, tilesetName: string, imageWidth: number, imageHeight: number, tileWidth: number, tileHeight: number, tileCount: number, columns: number, formats: string[] }
 * 返回参数：导出记录 ID 和创建时间
 * url地址：/api/exports/records
 * 请求方式：POST
 */
export const createExportRecord = (params: CreateExportRecordParams): Promise<ApiResponse<ExportRecord>> =>
  post('/api/exports/records', params);