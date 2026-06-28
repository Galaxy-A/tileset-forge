# Project API

项目接口保留云端保存、历史版本、跨设备同步和多人协作的服务端边界。首版编辑状态仍在浏览器本地完成。

## POST `/api/projects`

创建云端项目。

### Request

```ts
{
  name: string
}
```

### Response

```ts
ProjectSnapshot = {
  projectId: string
  ownerId: string
  workspaceId: string
  name: string
  sourceImage?: SourceImage
  grid: SpriteSheetGridConfig
  captures: CapturedSprite[]
  layout: LayoutItem[]
  exportSettings: ExportSettings
  version: number
  updatedAt: string
}
```

## GET `/api/projects/detail`

按项目 ID 获取编辑状态快照。

### Request

```ts
{
  projectId: string
}
```

## POST `/api/projects/snapshots`

保存可恢复的编辑器状态快照。

### Request

```ts
ProjectSnapshot
```