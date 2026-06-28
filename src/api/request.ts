import axios from 'axios';
import type { ApiResponse } from '@/types/api/common';

type MockHandler = (payload?: unknown) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>;

const mockApis = new Map<string, MockHandler>();

const request = axios.create({
  baseURL: '',
  timeout: 10000,
});

const getMockKey = (method: string, url: string) => `${method.toUpperCase()} ${url}`;

/**
 * 注册 Mock 接口
 * 功能描述：为本地开发环境注册接口响应处理器
 * 入参：{ method: 请求方式, url: 接口地址, handler: 响应处理器 }
 * 返回参数：无
 * url地址：本地 Mock 注册
 * 请求方式：GET/POST
 */
export const registerMockApi = (method: string, url: string, handler: MockHandler): void => {
  mockApis.set(getMockKey(method, url), handler);
};

/** 创建成功响应。 */
export const createSuccessResponse = <T>(body: T, message = '请求成功'): ApiResponse<T> => ({
  error: 0,
  body,
  message,
  success: true,
});

/** 创建失败响应。 */
export const createErrorResponse = <T>(body: T, message = '请求失败', error = 1): ApiResponse<T> => ({
  error,
  body,
  message,
  success: false,
});

const requestWithMock = async <T>(method: 'GET' | 'POST', url: string, payload?: unknown): Promise<ApiResponse<T>> => {
  const mockHandler = mockApis.get(getMockKey(method, url));

  if (mockHandler) {
    return (await mockHandler(payload)) as ApiResponse<T>;
  }

  const response = method === 'GET'
    ? await request.get<ApiResponse<T>>(url, { params: payload })
    : await request.post<ApiResponse<T>>(url, payload);

  return response.data;
};

/** GET 请求。 */
export const get = <T>(url: string, params?: unknown): Promise<ApiResponse<T>> => requestWithMock<T>('GET', url, params);

/** POST 请求。 */
export const post = <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => requestWithMock<T>('POST', url, data);