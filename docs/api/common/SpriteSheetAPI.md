# SpriteSheet API

## 统一响应

```ts
ApiResponse<T> = {
  error: number
  body: T
  message: string
  success: boolean
}
```

## GET `/api/sprite-sheet/default-config`

获取编辑器默认配置。页面启动时调用，避免 Vue 页面硬编码默认参数。

### Response

```ts
{
  grid: {
    tileWidth: number
    tileHeight: number
    margin: number
    spacing: number
    zoom: number
    showGrid: boolean
  }
  export: {
    tilesetName: string
    imageFileName: string
    tsxFileName: string
    jsonFileName: string
    tiledVersion: string
    supportedFormats: string[]
  }
  futureFeatures: Array<{
    key: string
    label: string
    enabled: boolean
  }>
}
```

## POST `/api/exports/records`

记录本地导出摘要。首版由 Mock 接收，后续可替换为服务端导出历史。

### Request

```ts
{
  projectId?: string
  tilesetName: string
  imageWidth: number
  imageHeight: number
  tileWidth: number
  tileHeight: number
  tileCount: number
  columns: number
  formats: Array<'png' | 'tsx' | 'json'>
}
```

### Response

```ts
{
  exportId: string
  createdAt: string
}
```