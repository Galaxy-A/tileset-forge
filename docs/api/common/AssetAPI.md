# Asset API

素材接口用于未来素材库、云端项目复用和 AI 图像任务引用。首版本地图片通过 File API 加载，不依赖真实上传服务。

## GET `/api/assets`

获取素材库列表。

### Response

```ts
Asset[]
```

## POST `/api/assets`

登记素材元信息。

### Request

```ts
Asset = {
  assetId: string
  workspaceId: string
  name: string
  mimeType: string
  width: number
  height: number
  size: number
  url: string
  createdAt: string
}
```