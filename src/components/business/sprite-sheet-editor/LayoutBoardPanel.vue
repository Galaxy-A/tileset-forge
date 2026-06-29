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
        <div class="board-stats tf-mono">
          {{ boardSize.width }}×{{ boardSize.height }}px · {{ store.layout.length }} items
        </div>
        <el-button
          class="settings-button"
          circle
          size="small"
          aria-label="打开排版设置"
          @click="openSettingsDialog"
        >
          <el-icon>
            <Setting />
          </el-icon>
        </el-button>
      </div>
    </header>

    <div
      class="board-shell"
      :style="boardShellStyle"
    >
      <div
        ref="boardRef"
        class="layout-board"
        :class="{ 'layout-board--grid-visible': layoutGrid.showGrid }"
        :style="boardStyle"
      >
        <div
          v-if="!store.layout.length"
          class="empty-state"
        >
          <strong>选择截图后开始排版</strong>
          <span>截图会按自动排版列数铺开，也可以拖拽微调位置。</span>
        </div>

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

    <el-dialog
      v-model="isSettingsDialogVisible"
      title="排版设置"
      width="420px"
      append-to-body
      destroy-on-close
      class="layout-settings-dialog"
      draggable
      :modal="false"
      :close-on-click-modal="false"
    >
      <div class="layout-settings-form">
        <section class="settings-section">
          <h3>网格基础设置</h3>
          <GridSettingsPanel
            v-model:grid="layoutGrid"
            scope="grid"
            embedded
          />
        </section>

        <section class="settings-section">
          <h3>排版预览设置</h3>
          <label class="setting-field">
            <span>预览背景</span>
            <span class="setting-control setting-control--inline">
              <el-color-picker
                v-model="customBackgroundColor"
                size="small"
                :predefine="predefinedBackgroundColors"
                aria-label="选择排版预览背景颜色"
              />
              <span class="color-value tf-mono">{{ customBackgroundColor }}</span>
            </span>
          </label>

          <label class="setting-field setting-field--with-help">
            <span>自动排版列数</span>
            <span class="setting-control">
              <el-input-number
                v-model="columns"
                size="small"
                :min="1"
                controls-position="right"
              />
              <small>截图进入排版预览时，每行自动放置的截图数量。</small>
            </span>
          </label>
        </section>
      </div>
    </el-dialog>

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
          {{ exportSize.width }}×{{ exportSize.height }}px · {{ layoutTileCount }} tiles
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
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { ElMessage } from 'element-plus';
import { Setting } from '@element-plus/icons-vue';
import { useTilesetExporter } from '@/composables/useTilesetExporter';
import { snapPointToGrid } from '@/composables/useSpriteSheetCanvas';
import GridSettingsPanel from '@/components/business/sprite-sheet-editor/GridSettingsPanel.vue';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';
import type { LayoutItem } from '@/types/business/sprite-sheet';

type ExportMode = 'png' | 'bundle';
type LayoutBoardStyle = CSSProperties & Record<`--${string}`, string>;

const store = useSpriteSheetEditorStore();
const { exportTileset } = useTilesetExporter();
const layoutGrid = ref<SpriteSheetGridConfig>({ ...store.grid });
const boardRef = ref<HTMLElement>();
const dragging = ref<{ captureId: string; offsetX: number; offsetY: number }>();
const exportMode = ref<ExportMode>('bundle');
const customBackgroundColor = ref('#263233');
const isSettingsDialogVisible = ref(false);
const isExporting = ref(false);
const predefinedBackgroundColors = ['#263233', '#111827', '#ffffff', '#f8fafc', '#22c55e', '#3b82f6', '#f97316', '#ef4444'];

const getLayoutGridPosition = (index: number) => {
  const stepX = Math.max(1, layoutGrid.value.tileWidth + layoutGrid.value.spacing);
  const stepY = Math.max(1, layoutGrid.value.tileHeight + layoutGrid.value.spacing);
  const safeColumns = Math.max(1, store.exportSettings.columns);

  return {
    x: Math.max(0, layoutGrid.value.margin + (index % safeColumns) * stepX),
    y: Math.max(0, layoutGrid.value.margin + Math.floor(index / safeColumns) * stepY),
  };
};

const alignLayoutItemsToGrid = () => {
  if (!layoutGrid.value.snapToGrid) return;
  store.layout.forEach((item, index) => {
    const position = getLayoutGridPosition(index);
    if (item.x === position.x && item.y === position.y) return;
    store.updateLayoutItem(item.captureId, position);
  });
};

const captureMap = computed(() => new Map(store.captures.map((capture) => [capture.id, capture])));
const visualItems = computed(() => store.layout
  .map((layout) => ({ layout, capture: captureMap.value.get(layout.captureId) }))
  .filter((item): item is { layout: LayoutItem; capture: NonNullable<typeof item.capture> } => Boolean(item.capture)));

const boardSize = computed(() => ({
  width: Math.max(360, store.exportImageSize.width || store.exportSettings.columns * layoutGrid.value.tileWidth),
  height: Math.max(220, store.exportImageSize.height || layoutGrid.value.tileHeight),
}));

const getGridOverlayVariables = (grid: SpriteSheetGridConfig): LayoutBoardStyle => {
  const cellWidth = grid.tileWidth + grid.spacing;
  const cellHeight = grid.tileHeight + grid.spacing;

  return {
    '--layout-grid-offset': `${grid.margin}px`,
    '--layout-grid-cell-width': `${cellWidth}px`,
    '--layout-grid-cell-height': `${cellHeight}px`,
    '--layout-grid-major-width': `${cellWidth * 4}px`,
    '--layout-grid-major-height': `${cellHeight * 4}px`,
  };
};

const boardStyle = computed<LayoutBoardStyle>(() => ({
  width: `${boardSize.value.width}px`,
  height: `${boardSize.value.height}px`,
  ...getGridOverlayVariables(layoutGrid.value),
}));
const boardShellStyle = computed<CSSProperties>(() => ({
  backgroundColor: customBackgroundColor.value,
}));
const exportSize = computed(() => store.exportImageSize);
const layoutTileCount = computed(() => store.layout.reduce((sum, item) => {
  const cols = Math.max(1, Math.floor(item.width / layoutGrid.value.tileWidth));
  const rows = Math.max(1, Math.floor(item.height / layoutGrid.value.tileHeight));
  return sum + cols * rows;
}, 0));
const canExport = computed(() => store.layout.length > 0 && layoutTileCount.value > 0);
const exportFormats = computed<Array<'png' | 'tsx' | 'json'>>(() => (exportMode.value === 'png' ? ['png'] : ['png', 'tsx', 'json']));
const exportButtonText = computed(() => (exportMode.value === 'png' ? '导出' : '导出'));
const columns = computed({ get: () => store.exportSettings.columns, set: (value) => store.updateExportSettings({ columns: value }) });

const openSettingsDialog = () => {
  isSettingsDialogVisible.value = true;
};

const addSettingsDialogOutsideListener = async () => {
  removeSettingsDialogOutsideListener();
  await nextTick();
  document.addEventListener('pointerdown', closeSettingsDialogOnOutsidePointerDown);
};

const isInsideSettingsDialog = (target: globalThis.EventTarget | null) => {
  if (!(target instanceof window.Node)) return false;
  return Boolean(document.querySelector('.layout-settings-dialog')?.contains(target));
};

const closeSettingsDialogOnOutsidePointerDown = (event: PointerEvent) => {
  if (!isSettingsDialogVisible.value || isInsideSettingsDialog(event.target)) return;
  isSettingsDialogVisible.value = false;
};

const removeSettingsDialogOutsideListener = () => {
  document.removeEventListener('pointerdown', closeSettingsDialogOnOutsidePointerDown);
};

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

const snapToLayoutGrid = (x: number, y: number) => {
  if (!layoutGrid.value.snapToGrid) return { x, y };
  return snapPointToGrid({ x, y }, layoutGrid.value);
};

const moveDrag = (event: PointerEvent) => {
  if (!dragging.value || !boardRef.value) return;
  const rect = boardRef.value.getBoundingClientRect();
  const rawX = Math.max(0, Math.round(event.clientX - rect.left + boardRef.value.scrollLeft - dragging.value.offsetX));
  const rawY = Math.max(0, Math.round(event.clientY - rect.top + boardRef.value.scrollTop - dragging.value.offsetY));
  const { x, y } = snapToLayoutGrid(rawX, rawY);
  store.updateLayoutItem(dragging.value.captureId, { x, y });
};

const startDrag = (event: PointerEvent, captureId: string) => {
  if (!boardRef.value) return;
  event.preventDefault();
  event.stopPropagation();
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
      grid: layoutGrid.value,
      settings: store.exportSettings,
      tileCount: layoutTileCount.value,
      formats: exportFormats.value,
    });
    ElMessage.success(exportMode.value === 'png' ? '已导出 PNG，并记录导出摘要' : '已导出 PNG、TSX、JSON，并记录导出摘要');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  } finally {
    isExporting.value = false;
  }
};

watch(() => store.grid, (grid) => {
  layoutGrid.value = { ...grid };
}, { deep: true });

watch(() => [
  layoutGrid.value.tileWidth,
  layoutGrid.value.tileHeight,
  layoutGrid.value.margin,
  layoutGrid.value.spacing,
  layoutGrid.value.snapToGrid,
  store.exportSettings.columns,
  store.selectedCaptures.map((capture) => capture.id).join('|'),
], alignLayoutItemsToGrid);

watch(isSettingsDialogVisible, (visible) => {
  if (visible) {
    void addSettingsDialogOutsideListener();
    return;
  }

  removeSettingsDialogOutsideListener();
});

onBeforeUnmount(() => {
  stopDrag();
  removeSettingsDialogOutsideListener();
});
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-width: 0; min-height: 0; overflow: hidden; display: grid; grid-template-rows: 48px minmax(0, 1fr) auto; box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
.panel-header { min-height: 48px; padding: 7px 10px; border-bottom: 1px solid var(--tf-color-border); background: linear-gradient(180deg, #383838 0%, #2f2f2f 100%); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel-kicker { margin: 0; font-size: 10px; font-weight: 800; letter-spacing: .08em; color: #9f9f9f; }
h2 { margin: 0; font-size: 14px; line-height: 20px; font-weight: 650; color: var(--tf-color-text); }
.board-tools { min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.settings-button { flex: 0 0 auto; }
.board-stats { flex: 0 0 auto; font-size: 12px; color: var(--tf-color-text-muted); }
.board-shell { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 260px; overflow: auto; padding: 16px; background-color: #242424; }
.empty-state { position: relative; z-index: 10001; height: 100%; min-height: 220px; display: grid; place-items: center; align-content: center; gap: 6px; text-align: center; color: var(--tf-color-text-muted); }
.empty-state strong { color: var(--tf-color-text); }
.layout-board { position: relative; isolation: isolate; min-width: 100%; background: transparent; border: 1px solid #111; box-shadow: 0 12px 30px rgba(0, 0, 0, .35), inset 0 0 0 1px rgba(255,255,255,.04); }
.layout-board--grid-visible::after { content: ''; position: absolute; inset: 0; z-index: 10000; pointer-events: none; background-image: linear-gradient(to right, rgba(45, 156, 255, .62) 0 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 156, 255, .62) 0 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, .28) 0 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, .28) 0 1px, transparent 1px); background-position: var(--layout-grid-offset) var(--layout-grid-offset); background-size: var(--layout-grid-major-width) var(--layout-grid-major-height), var(--layout-grid-major-width) var(--layout-grid-major-height), var(--layout-grid-cell-width) var(--layout-grid-cell-height), var(--layout-grid-cell-width) var(--layout-grid-cell-height); }
.layout-item { position: absolute; display: grid; place-items: center; border: 1px solid rgba(45, 156, 255, .75); background: rgba(20, 115, 230, .08); cursor: grab; user-select: none; }
.layout-item:active { cursor: grabbing; }
.layout-item img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; pointer-events: none; }
.item-label { position: absolute; left: 2px; bottom: 2px; padding: 1px 3px; border-radius: 2px; background: rgba(0, 0, 0, .76); color: #fff; font-size: 10px; pointer-events: none; }
:deep(.layout-settings-dialog) { margin: 80px 18px 0 auto; box-shadow: 0 18px 48px rgba(0, 0, 0, .48); }
:deep(.layout-settings-dialog .el-dialog__header) { cursor: move; user-select: none; border-bottom: 1px solid var(--tf-color-border); padding: 10px 12px; background: #2f2f2f; }
:deep(.layout-settings-dialog .el-dialog__body) { padding: 12px; background: var(--tf-color-surface); }
.layout-settings-form { display: grid; gap: 16px; }
.settings-section { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--tf-color-border); border-radius: 8px; background: #2f2f2f; }
.settings-section h3 { margin: 0; color: var(--tf-color-text); font-size: 13px; font-weight: 650; }
.setting-field { display: grid; grid-template-columns: 104px 1fr; align-items: center; gap: 10px; font-size: 12px; color: var(--tf-color-text-muted); }
.setting-field--with-help { align-items: start; }
.setting-control { min-width: 0; display: grid; gap: 4px; }
.setting-control--inline { display: flex; align-items: center; gap: 8px; }
.setting-control small { color: #8f8f8f; font-size: 11px; line-height: 16px; }
.color-value { color: var(--tf-color-text); font-size: 12px; }
:deep(.layout-settings-form .el-input-number) { width: 100%; }
.export-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px; border-top: 1px solid var(--tf-color-border); background: #2b2b2b; }
.export-control,
.export-submit { min-width: 0; display: flex; align-items: center; gap: 10px; }
.export-submit { justify-content: flex-end; }
.export-label,
.export-meta { color: var(--tf-color-text-muted); font-size: 12px; white-space: nowrap; }
@media (max-width: 900px) {
  .panel-header { align-items: stretch; flex-direction: column; }
  .board-tools { align-items: flex-start; flex-direction: column; }
  .export-actions { align-items: stretch; flex-direction: column; }
  .export-submit { justify-content: space-between; }
}
</style>