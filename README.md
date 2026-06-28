# Tileset Forge

简约、实用的本地 Sprite Sheet 编辑器。首版面向浏览器本地编辑：导入图片、Canvas 框选截图、排版预览，并导出 Tiled 可用的 `PNG + TSX + JSON`。

## 功能范围

- 本地导入 PNG / JPG / WebP 图片
- Canvas 原图预览、缩放、网格显示、鼠标框选
- 截图列表、选择、全选、清空选择
- Layout Board 拖拽排版
- 导出：
  - `tileset.png`
  - `tileset.tsx`
  - `tileset.json`
- 保留产品化边界：云端项目、素材库、导出记录、AI 图像任务、协作入口

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios
- Element Plus
- Zod

## 启动命令

```bash
npm install
npm run dev
```

## 质量检查

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 目录结构

```text
src/
  api/
    modules/              # 后端 API 边界，包含真实接口调用定义
    mockManager.js         # 本地 Mock 响应
    request.ts             # Axios + Mock 请求统一入口
  assets/styles/           # 全局主题与工具样式
  components/business/
    sprite-sheet-editor/   # 编辑器业务组件
  composables/             # Canvas 与导出逻辑
  router/                  # 路由
  stores/                  # Pinia 编辑状态
  types/
    api/                   # API 类型
    business/              # 业务领域类型
  views/
    sprite-sheet-editor/   # 页面容器

tests/
  api/                     # Mock/API 契约测试
  composables/             # 组合式函数与纯函数测试
  stores/                  # Pinia 状态测试

docs/api/
  common/                  # 通用业务 API 文档
  ai/                      # AI 队列 API 文档
```

## 数据流

```text
用户图片
  -> SourceImagePanel
  -> Pinia editor state
  -> CapturedSpritesPanel
  -> LayoutBoardPanel
  -> useTilesetExporter
  -> PNG / TSX / JSON 下载
  -> Mock export record
```

## API 文档

- `docs/api/common/SpriteSheetAPI.md`
- `docs/api/common/ProjectAPI.md`
- `docs/api/common/AssetAPI.md`
- `docs/api/ai/AiJobAPI.md`

首版不依赖真实后端服务；接口层与 Mock 已保留，后续可以按同一数据契约替换为真实服务。