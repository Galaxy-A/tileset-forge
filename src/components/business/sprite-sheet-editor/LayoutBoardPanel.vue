<template>
  <section class="editor-panel layout-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          LAYOUT BOARD
        </p>
        <h2>排版预览</h2>
      </div>
      <div class="board-tools">
        <div class="background-control">
          <span class="background-label">背景</span>
          <el-radio-group
            v-model="backgroundMode"
            size="small"
          >
            <el-radio-button
              v-for="option in backgroundOptions"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
          <el-color-picker
            v-if="backgroundMode === 'custom'"
            v-model="customBackgroundColor"
            size="small"
            :predefine="predefinedBackgroundColors"
            aria-label="选择排版预览背景颜色"
          />
        </div>
        <div class="board-stats tf-mono">
          {{ boardSize.width }}×{{ boardSize.height }}px · {{ store.layout.length }} items
        </div>
      </div>
    </header>

    <div
      class="board-shell"
      :class="boardShellClass"
      :style="boardShellStyle"
    >
      <div
        v-if="!store.layout.length"
        class="empty-state"
      >
        <strong>选择截图后开始排版</strong>
        <span>截图会按 columns 参数自动铺开，也可以拖拽微调位置。</span>
      </div>

      <div
        v-else
        ref="boardRef"
        class="layout-board"
        :style="boardStyle"
      >
        <div
          v-for="item in visualItems"
          :key="item.capture.id"
          class="layout-item"
          :style="itemStyle(item.layout)"
          @pointerdown="startDrag($event, item.layout.captureId)"
        >
          <img
            :src="item.capture.imageDataUrl"
            :alt="item.capture.name"
            draggable="false"
          >
          <span class="item-label tf-mono">{{ item.layout.x }}, {{ item.layout.y }}</span>
        </div>
      </div>
    </div>

    <footer class="export-actions">
      <div class="export-control">
        <span class="export-label">选择导出</span>
        <el-radio-group
          v-model="exportMode"
          size="small"
        >
          <el-radio-button label="png">
            PNG
          </el-radio-button>
          <el-radio-button label="bundle">
            TSX + JSON
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="export-submit">
        <span class="export-meta tf-mono">
          {{ exportSize.width }}×{{ exportSize.height }}px · {{ store.tileCount }} tiles
        </span>
        <el-button
          type="primary"
          :loading="isExporting"
          :disabled="!canExport"
          @click="handleExport"
        >
          {{ exportButtonText }}
        </el-button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { CSSProperties } from 'vue';
import { ElMessage } from 'element-plus';
import { useTilesetExporter } from '@/composables/useTilesetExporter';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { LayoutItem } from '@/types/business/sprite-sheet';

type ExportMode = 'png' | 'bundle';
type BackgroundMode = 'checkerboard' | 'dark' | 'light' | 'custom';

type BackgroundOption = {
  readonly label: string;
  readonly value: BackgroundMode;
};

const store = useSpriteSheetEditorStore();
const { exportTileset } = useTilesetExporter();
const boardRef = ref<HTMLElement>();
const dragging = ref<{ captureId: string; offsetX: number; offsetY: number }>();
const exportMode = ref<ExportMode>('bundle');
const backgroundMode = ref<BackgroundMode>('checkerboard');
const customBackgroundColor = ref('#263233');
const isExporting = ref(false);
const backgroundOptions: readonly BackgroundOption[] = [
  { label: '格子', value: 'checkerboard' },
  { label: '深色', value: 'dark' },
  { label: '浅色', value: 'light' },
  { label: '自定义', value: 'custom' },
];
const predefinedBackgroundColors = ['#263233', '#111827', '#ffffff', '#f8fafc', '#22c55e', '#3b82f6', '#f97316', '#ef4444'];

const captureMap = computed(() => new Map(store.captures.map((capture) => [capture.id, capture])));
const visualItems = computed(() => store.layout
  .map((layout) => ({ layout, capture: captureMap.value.get(layout.captureId) }))
  .filter((item): item is { layout: LayoutItem; capture: NonNullable<typeof item.capture> } => Boolean(item.capture)));

const boardSize = computed(() => ({
  width: Math.max(360, store.exportImageSize.width || store.exportSettings.columns * store.grid.tileWidth),
  height: Math.max(220, store.exportImageSize.height || store.grid.tileHeight),
}));

const boardStyle = computed(() => ({
  width: `${boardSize.value.width}px`,
  height: `${boardSize.value.height}px`,
}));
const boardShellClass = computed(() => ({
  'tf-checkerboard': backgroundMode.value === 'checkerboard',
}));
const boardShellStyle = computed<CSSProperties>(() => {
  if (backgroundMode.value === 'checkerboard') return {};
  if (backgroundMode.value === 'dark') return { backgroundColor: '#263233' };
  if (backgroundMode.value === 'light') return { backgroundColor: '#f8fafc' };
  return { backgroundColor: customBackgroundColor.value };
});
const exportSize = computed(() => store.exportImageSize);
const canExport = computed(() => store.layout.length > 0 && store.tileCount > 0);
const exportFormats = computed<Array<'png' | 'tsx' | 'json'>>(() => (exportMode.value === 'png' ? ['png'] : ['png', 'tsx', 'json']));
const exportButtonText = computed(() => (exportMode.value === 'png' ? '导出 PNG' : '导出 PNG + TSX + JSON'));

const itemStyle = (item: LayoutItem) => ({
  left: `${item.x}px`,
  top: `${item.y}px`,
  width: `${item.width}px`,
  height: `${item.height}px`,
  zIndex: item.zIndex,
});

const stopDrag = () => {
  dragging.value = undefined;
  window.removeEventListener('pointermove', moveDrag);
  window.removeEventListener('pointerup', stopDrag);
};

const moveDrag = (event: PointerEvent) => {
  if (!dragging.value || !boardRef.value) return;
  const rect = boardRef.value.getBoundingClientRect();
  const x = Math.max(0, Math.round(event.clientX - rect.left + boardRef.value.scrollLeft - dragging.value.offsetX));
  const y = Math.max(0, Math.round(event.clientY - rect.top + boardRef.value.scrollTop - dragging.value.offsetY));
  store.updateLayoutItem(dragging.value.captureId, { x, y });
};

const startDrag = (event: PointerEvent, captureId: string) => {
  if (!boardRef.value) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  dragging.value = {
    captureId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  target.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup', stopDrag);
};

const handleExport = async () => {
  if (!canExport.value) return;
  isExporting.value = true;
  try {
    await exportTileset({
      captures: store.captures,
      layout: store.layout,
      grid: store.grid,
      settings: store.exportSettings,
      tileCount: store.tileCount,
      formats: exportFormats.value,
    });
    ElMessage.success(exportMode.value === 'png' ? '已导出 PNG，并记录导出摘要' : '已导出 PNG、TSX、JSON，并记录导出摘要');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  } finally {
    isExporting.value = false;
  }
};

onBeforeUnmount(stopDrag);
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-width: 0; min-height: 0; overflow: hidden; display: grid; grid-template-rows: 56px minmax(0, 1fr) auto; }
.panel-header { min-height: 56px; padding: 8px 12px; border-bottom: 1px solid var(--tf-color-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 16px; line-height: 24px; }
.board-tools { min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.background-control { min-width: 0; display: flex; align-items: center; gap: 8px; }
.background-label { color: var(--tf-color-text-muted); font-size: 12px; white-space: nowrap; }
.board-stats { flex: 0 0 auto; font-size: 12px; color: var(--tf-color-text-muted); }
.board-shell { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 260px; overflow: auto; padding: 16px; }
.empty-state { height: 100%; min-height: 220px; display: grid; place-items: center; align-content: center; gap: 6px; text-align: center; color: var(--tf-color-text-muted); }
.empty-state strong { color: var(--tf-color-text); }
.layout-board { position: relative; min-width: 100%; background: transparent; border: 1px solid var(--tf-color-border-strong); box-shadow: 0 8px 24px rgba(15, 23, 42, .08); }
.layout-item { position: absolute; display: grid; place-items: center; border: 1px solid rgba(79, 70, 229, .6); background: transparent; cursor: grab; user-select: none; }
.layout-item:active { cursor: grabbing; }
.layout-item img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; pointer-events: none; }
.item-label { position: absolute; left: 2px; bottom: 2px; padding: 1px 3px; border-radius: 3px; background: rgba(15, 23, 42, .72); color: #fff; font-size: 10px; pointer-events: none; }
.export-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border-top: 1px solid var(--tf-color-border); background: rgba(255,255,255,.92); }
.export-control,
.export-submit { min-width: 0; display: flex; align-items: center; gap: 10px; }
.export-submit { justify-content: flex-end; }
.export-label,
.export-meta { color: var(--tf-color-text-muted); font-size: 12px; white-space: nowrap; }
@media (max-width: 900px) {
  .panel-header { align-items: stretch; flex-direction: column; }
  .board-tools { align-items: flex-start; flex-direction: column; }
  .background-control { flex-wrap: wrap; }
  .export-actions { align-items: stretch; flex-direction: column; }
  .export-submit { justify-content: space-between; }
}
</style>