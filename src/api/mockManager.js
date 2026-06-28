import dayjs from 'dayjs';
import { createSuccessResponse, registerMockApi } from './request';

const defaultConfig = {
  grid: {
    tileWidth: 32,
    tileHeight: 32,
    margin: 0,
    spacing: 0,
    zoom: 100,
    showGrid: true,
  },
  export: {
    tilesetName: 'tileset-forge-export',
    imageFileName: 'tileset-forge-export.png',
    tsxFileName: 'tileset-forge-export.tsx',
    jsonFileName: 'tileset-forge-export.json',
    tiledVersion: '1.12.2',
    supportedFormats: ['PNG', 'JPG', 'WebP'],
  },
  futureFeatures: [
    { key: 'cloud-save', label: 'Save to Cloud', enabled: false },
    { key: 'history', label: 'History', enabled: false },
    { key: 'asset-library', label: 'Asset Library', enabled: false },
    { key: 'ai-remove-bg', label: 'AI Remove BG', enabled: true },
    { key: 'collaborate', label: 'Collaborate', enabled: false },
  ],
};

registerMockApi('GET', '/api/sprite-sheet/default-config', () =>
  createSuccessResponse(defaultConfig, '获取 Sprite Sheet 默认配置成功'),
);

registerMockApi('POST', '/api/exports/records', (payload) =>
  createSuccessResponse(
    {
      exportId: `export-${Date.now()}`,
      createdAt: dayjs().toISOString(),
      summary: payload,
    },
    '导出记录保存成功',
  ),
);

registerMockApi('GET', '/api/assets', () => createSuccessResponse([], '获取素材库列表成功'));

registerMockApi('POST', '/api/assets', (payload) => createSuccessResponse(payload, '素材登记成功'));

registerMockApi('POST', '/api/projects', (payload) =>
  createSuccessResponse(
    {
      projectId: `project-${Date.now()}`,
      ownerId: 'mock-user',
      workspaceId: 'mock-workspace',
      name: typeof payload === 'object' && payload && 'name' in payload ? payload.name : 'Untitled Project',
      grid: defaultConfig.grid,
      captures: [],
      layout: [],
      exportSettings: {
        tilesetName: defaultConfig.export.tilesetName,
        columns: 8,
        tiledVersion: defaultConfig.export.tiledVersion,
      },
      version: 1,
      updatedAt: dayjs().toISOString(),
    },
    '云端项目创建成功',
  ),
);

registerMockApi('GET', '/api/projects/detail', () =>
  createSuccessResponse(
    {
      projectId: 'mock-project',
      ownerId: 'mock-user',
      workspaceId: 'mock-workspace',
      name: 'Local Draft',
      grid: defaultConfig.grid,
      captures: [],
      layout: [],
      exportSettings: {
        tilesetName: defaultConfig.export.tilesetName,
        columns: 8,
        tiledVersion: defaultConfig.export.tiledVersion,
      },
      version: 1,
      updatedAt: dayjs().toISOString(),
    },
    '获取项目快照成功',
  ),
);

registerMockApi('POST', '/api/projects/snapshots', (payload) => createSuccessResponse(payload, '项目快照保存成功'));

registerMockApi('POST', '/api/ai/jobs', (payload) =>
  createSuccessResponse(
    {
      jobId: `ai-job-${Date.now()}`,
      ...(typeof payload === 'object' && payload ? payload : {}),
      status: 'queued',
      progress: 0,
      createdAt: dayjs().toISOString(),
    },
    'AI 任务创建成功',
  ),
);

registerMockApi('POST', '/api/ai/remove-background', (payload) =>
  createSuccessResponse(
    {
      jobId: `remove-bg-${Date.now()}`,
      status: 'completed',
      strategy: typeof payload === 'object' && payload && 'strategy' in payload ? payload.strategy : 'corner-sample',
      processedAt: dayjs().toISOString(),
      transparentBackground: true,
      message: '已基于四角背景采样生成透明背景图片',
    },
    '图片去背景处理成功',
  ),
);

registerMockApi('GET', '/api/ai/jobs/detail', () =>
  createSuccessResponse(
    {
      jobId: 'mock-ai-job',
      assetId: 'mock-asset',
      type: 'remove-background',
      status: 'queued',
      progress: 0,
      createdAt: dayjs().toISOString(),
    },
    '查询 AI 任务成功',
  ),
);