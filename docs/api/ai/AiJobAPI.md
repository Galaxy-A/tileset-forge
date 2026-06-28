# AI Job API

AI Job 接口保留服务端异步队列边界，覆盖 AI 抠图、批量切片、网格归一化等后续能力。

## POST `/api/ai/jobs`

创建图像处理任务。

### Request

```ts
{
  assetId: string
  projectId?: string
  type: 'remove-background' | 'batch-slice' | 'normalize-grid'
}
```

### Response

```ts
AiJob = {
  jobId: string
  projectId?: string
  assetId: string
  type: 'remove-background' | 'batch-slice' | 'normalize-grid'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  resultAssetId?: string
  createdAt: string
  updatedAt?: string
}
```

## GET `/api/ai/jobs/detail`

查询异步任务进度。

### Request

```ts
{
  jobId: string
}
```