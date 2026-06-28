import { get, post } from '@/api/request';
import type { ApiResponse } from '@/types/api/common';
import type { Asset } from '@/types/business/asset';

/**
 * 获取素材库列表
 * 功能描述：获取未来云端素材库中的图片资产
 * 入参：无
 * 返回参数：素材列表
 * url地址：/api/assets
 * 请求方式：GET
 */
export const getAssets = (): Promise<ApiResponse<Asset[]>> => get('/api/assets');

/**
 * 登记素材
 * 功能描述：登记浏览器本地导入的图片资产元信息
 * 入参：Asset
 * 返回参数：素材信息
 * url地址：/api/assets
 * 请求方式：POST
 */
export const createAsset = (params: Asset): Promise<ApiResponse<Asset>> => post('/api/assets', params);