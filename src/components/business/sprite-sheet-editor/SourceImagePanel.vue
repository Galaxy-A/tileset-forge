<template>
  <section class="editor-panel source-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          SOURCE IMAGE
        </p>
        <h2>上传并框选原始素材图</h2>
      </div>
      <div class="panel-actions">
        <el-button
          size="small"
          circle
          aria-label="调整 Tileset 参数"
          @click="openSettingsDialog"
        >
          <el-icon>
            <Setting />
          </el-icon>
        </el-button>
        <el-button
          size="small"
          :disabled="!store.sourceImage || isRemovingBackground"
          :loading="isRemovingBackground"
          @click="handleRemoveBackground"
        >
          去背景
        </el-button>
        <el-button
          size="small"
          @click="openFileDialog"
        >
          上传图片
        </el-button>
      </div>
    </header>

    <el-dialog
      v-model="isSettingsDialogVisible"
      class="settings-dialog"
      title="Tileset 参数"
      width="360px"
      draggable
      :modal="false"
      :close-on-click-modal="false"
    >
      <GridSettingsPanel
        v-model:grid="sourceGrid"
        v-model:export-settings="sourceExportSettings"
      />
    </el-dialog>

    <input
      ref="fileInputRef"
      class="hidden-input"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      @change="handleFileInput"
    >

    <div class="source-body">
      <div
        class="canvas-shell tf-checkerboard"
        :class="{ 'is-empty': !store.sourceImage }"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <div
          v-if="!store.sourceImage"
          class="upload-empty"
          @click="openFileDialog"
        >
          <strong>上传素材图</strong>
          <span>支持 PNG / JPG / WebP，或拖拽图片到这里</span>
        </div>

        <div
          v-else
          class="canvas-stage"
          :class="{ 'is-panning': isPanning }"
          @contextmenu.prevent
          @wheel.prevent="handleCanvasWheel"
        >
          <canvas
            ref="canvasRef"
            class="source-canvas"
            :style="sourceCanvasStyle"
            @mousedown="handleCanvasMouseDown"
          />
          <div
            v-if="visibleSelection"
            class="selection-box"
            :style="selectionStyle"
          />
          <div
            v-if="pendingSelection"
            class="selection-actions"
            :style="selectionActionStyle"
            @mousedown.stop
            @click.stop
          >
            <button
              class="selection-action is-confirm"
              type="button"
              aria-label="确认截图"
              :disabled="isCapturing"
              @click="confirmCapture"
            >
              ✓
            </button>
            <button
              class="selection-action is-cancel"
              type="button"
              aria-label="取消截图"
              @click="cancelSelection"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer class="source-actions">
      <span class="source-size">{{ store.sourceImage ? `${store.sourceImage.width} × ${store.sourceImage.height}px` : '未加载图片' }}</span>
      <div class="zoom-control">
        <span>缩放 {{ zoom }}%</span>
        <el-slider
          v-model="zoom"
          :min="25"
          :max="300"
          :step="5"
          size="small"
          :disabled="!store.sourceImage"
          aria-label="调整画布图片缩放"
        />
      </div>
      <span class="capture-hint">左键框选截图；右键拖动图片；点击 ✓ 生成截图，× 或再次左键取消。</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { ElMessage } from 'element-plus';
import { Setting } from '@element-plus/icons-vue';
import { removeImageBackground as submitRemoveImageBackground } from '@/api/modules/aiJobApi';
import GridSettingsPanel from '@/components/business/sprite-sheet-editor/GridSettingsPanel.vue';
import { snapRectToGrid, useSpriteSheetCanvas } from '@/composables/useSpriteSheetCanvas';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';
import type { Rect } from '@/types/business/sprite-sheet';

const store = useSpriteSheetEditorStore();
const { captureSprite, drawSourceImage, loadImageFile, removeImageBackground } = useSpriteSheetCanvas();
const canvasRef = ref<HTMLCanvasElement>();
const fileInputRef = ref<HTMLInputElement>();
type CanvasPoint = {
  readonly x: number;
  readonly y: number;
};

type PanDrag = {
  readonly pointerX: number;
  readonly pointerY: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const ZOOM_STEP = 5;

const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));

const getNextWheelZoom = (currentZoom: number, deltaY: number) => {
  const direction = deltaY > 0 ? -1 : 1;
  return clampZoom(currentZoom + direction * ZOOM_STEP);
};

const selectionStart = ref<CanvasPoint>();
const selectionEnd = ref<CanvasPoint>();
const pendingSelection = ref<Rect>();
const isSelecting = ref(false);
const isCapturing = ref(false);
const isRemovingBackground = ref(false);
const isSettingsDialogVisible = ref(false);
const isPanning = ref(false);
const panDrag = ref<PanDrag>();
const imageOffset = ref({ x: 0, y: 0 });
const sourceGrid = ref<SpriteSheetGridConfig>({ ...store.grid });
const zoom = computed({
  get: () => sourceGrid.value.zoom,
  set: (value) => {
    sourceGrid.value = { ...sourceGrid.value, zoom: value };
  },
});
const sourceExportSettings = computed({ get: () => store.exportSettings, set: (value) => store.updateExportSettings(value) });

const normalizedDraftSelection = computed<Rect | undefined>(() => {
  if (!selectionStart.value || !selectionEnd.value) return undefined;
  const x = Math.min(selectionStart.value.x, selectionEnd.value.x);
  const y = Math.min(selectionStart.value.y, selectionEnd.value.y);
  const width = Math.abs(selectionStart.value.x - selectionEnd.value.x);
  const height = Math.abs(selectionStart.value.y - selectionEnd.value.y);
  if (width <= 4 || height <= 4) return undefined;

  const rect = { x, y, width, height };
  const canvas = canvasRef.value;
  return sourceGrid.value.snapToGrid && canvas
    ? snapRectToGrid(rect, sourceGrid.value, { width: canvas.width, height: canvas.height })
    : rect;
});

const visibleSelection = computed(() => pendingSelection.value ?? normalizedDraftSelection.value);

const selectionDisplayRect = computed(() => {
  const rect = visibleSelection.value;
  const canvas = canvasRef.value;
  if (!rect || !canvas) return undefined;

  const bounds = canvas.getBoundingClientRect();
  const scaleX = bounds.width / canvas.width;
  const scaleY = bounds.height / canvas.height;

  return {
    left: canvas.offsetLeft + imageOffset.value.x + rect.x * scaleX,
    top: canvas.offsetTop + imageOffset.value.y + rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
});

const selectionStyle = computed(() => {
  const rect = selectionDisplayRect.value;
  return rect ? {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  } : {};
});

const selectionActionStyle = computed(() => {
  const rect = selectionDisplayRect.value;
  const stage = canvasRef.value?.parentElement;
  if (!rect || !stage) return {};

  const maxLeft = Math.max(0, stage.clientWidth - 56);
  const maxTop = Math.max(0, stage.clientHeight - 28);

  return {
    left: `${Math.min(rect.left + rect.width + 8, maxLeft)}px`,
    top: `${Math.min(rect.top + rect.height + 8, maxTop)}px`,
  };
});

const sourceCanvasStyle = computed<CSSProperties>(() => {
  if (!store.sourceImage) return {};
  const scale = sourceGrid.value.zoom / 100;
  return {
    width: `${store.sourceImage.width * scale}px`,
    height: `${store.sourceImage.height * scale}px`,
    transform: `translate(${imageOffset.value.x}px, ${imageOffset.value.y}px)`,
  };
});

const redraw = async () => {
  if (!canvasRef.value || !store.sourceImage) return;
  await drawSourceImage(canvasRef.value, store.sourceImage.objectUrl, sourceGrid.value);
};

const openFileDialog = () => fileInputRef.value?.click();

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
  return Boolean(document.querySelector('.settings-dialog')?.contains(target));
};

const closeSettingsDialogOnOutsidePointerDown = (event: PointerEvent) => {
  if (!isSettingsDialogVisible.value || isInsideSettingsDialog(event.target)) return;
  isSettingsDialogVisible.value = false;
};

const removeSettingsDialogOutsideListener = () => {
  document.removeEventListener('pointerdown', closeSettingsDialogOnOutsidePointerDown);
};

const loadFile = async (file?: File) => {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    ElMessage.warning('请选择 PNG / JPG / WebP 图片');
    return;
  }
  const sourceImage = await loadImageFile(file);
  cancelSelection();
  resetImageOffset();
  store.setSourceImage(sourceImage);
  await nextTick();
  await redraw();
};

const handleFileInput = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await loadFile(target.files?.[0]);
  target.value = '';
};

const handleDrop = async (event: DragEvent) => {
  await loadFile(event.dataTransfer?.files?.[0]);
};

const getCanvasPoint = (event: MouseEvent): CanvasPoint => {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(canvas.width, ((event.clientX - rect.left) / rect.width) * canvas.width)),
    y: Math.max(0, Math.min(canvas.height, ((event.clientY - rect.top) / rect.height) * canvas.height)),
  };
};

const removeSelectionListeners = () => {
  window.removeEventListener('mousemove', moveSelection);
  window.removeEventListener('mouseup', finishSelection);
};

const removePanListeners = () => {
  window.removeEventListener('mousemove', movePan);
  window.removeEventListener('mouseup', finishPan);
};

const removeCanvasListeners = () => {
  removeSelectionListeners();
  removePanListeners();
};

const resetDraftSelection = () => {
  selectionStart.value = undefined;
  selectionEnd.value = undefined;
  isSelecting.value = false;
};

const cancelSelection = () => {
  pendingSelection.value = undefined;
  resetDraftSelection();
  removeCanvasListeners();
};

const resetImageOffset = () => {
  imageOffset.value = { x: 0, y: 0 };
};

const commitDraftSelection = () => {
  const nextSelection = normalizedDraftSelection.value;
  pendingSelection.value = nextSelection;
  resetDraftSelection();
};

const moveSelection = (event: MouseEvent) => {
  if (!isSelecting.value || !selectionStart.value || event.buttons !== 1) return;
  selectionEnd.value = getCanvasPoint(event);
};

const finishSelection = (event: MouseEvent) => {
  if (!isSelecting.value || event.button !== 0) return;
  selectionEnd.value = getCanvasPoint(event);
  commitDraftSelection();
  removeSelectionListeners();
};

const movePan = (event: MouseEvent) => {
  if (!isPanning.value || !panDrag.value || event.buttons !== 2) return;
  imageOffset.value = {
    x: panDrag.value.offsetX + event.clientX - panDrag.value.pointerX,
    y: panDrag.value.offsetY + event.clientY - panDrag.value.pointerY,
  };
};

const finishPan = (event: MouseEvent) => {
  if (event.button !== 2) return;
  isPanning.value = false;
  panDrag.value = undefined;
  removePanListeners();
};

const startPan = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  cancelSelection();
  removePanListeners();
  panDrag.value = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    offsetX: imageOffset.value.x,
    offsetY: imageOffset.value.y,
  };
  isPanning.value = true;
  window.addEventListener('mousemove', movePan);
  window.addEventListener('mouseup', finishPan);
};

const startDraftSelection = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  removeSelectionListeners();
  const startPoint = getCanvasPoint(event);
  selectionStart.value = startPoint;
  selectionEnd.value = startPoint;
  pendingSelection.value = undefined;
  isSelecting.value = true;
  window.addEventListener('mousemove', moveSelection);
  window.addEventListener('mouseup', finishSelection, { once: true });
};

const handleCanvasMouseDown = (event: MouseEvent) => {
  if (!store.sourceImage || isSelecting.value || isPanning.value) return;

  if (event.button === 2) {
    startPan(event);
    return;
  }

  if (event.button !== 0) return;

  if (pendingSelection.value) {
    event.preventDefault();
    cancelSelection();
    return;
  }

  startDraftSelection(event);
};

const handleCanvasWheel = (event: globalThis.WheelEvent) => {
  if (!store.sourceImage) return;
  zoom.value = getNextWheelZoom(zoom.value, event.deltaY);
};

const handleRemoveBackground = async () => {
  const sourceImage = store.sourceImage;
  if (!sourceImage || isRemovingBackground.value) return;

  isRemovingBackground.value = true;
  try {
    const response = await submitRemoveImageBackground({
      assetId: sourceImage.assetId,
      fileName: sourceImage.fileName,
      width: sourceImage.width,
      height: sourceImage.height,
      strategy: 'corner-sample',
    });

    if (!response.success || !response.body.transparentBackground) {
      throw new Error(response.message || '图片去背景处理失败');
    }

    const objectUrl = await removeImageBackground(sourceImage.objectUrl);
    cancelSelection();
    resetImageOffset();
    store.replaceSourceImage({
      ...sourceImage,
      fileName: sourceImage.fileName.replace(/\.(png|jpe?g|webp)$/i, '') + '-no-bg.png',
      objectUrl,
    });
    await nextTick();
    await redraw();
    ElMessage.success(response.body.message);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '图片去背景处理失败');
  } finally {
    isRemovingBackground.value = false;
  }
};

const confirmCapture = async () => {
  if (!store.sourceImage || !pendingSelection.value || isCapturing.value) return;

  isCapturing.value = true;
  try {
    const capture = await captureSprite(store.sourceImage.objectUrl, pendingSelection.value, store.captures.length);
    store.addCapture(capture);
    store.syncLayoutFromSelection();
    cancelSelection();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '截图生成失败');
  } finally {
    isCapturing.value = false;
  }
};

watch(() => store.grid, (grid) => {
  sourceGrid.value = { ...grid };
}, { deep: true });

watch(() => [
  store.sourceImage?.objectUrl,
  sourceGrid.value.tileWidth,
  sourceGrid.value.tileHeight,
  sourceGrid.value.margin,
  sourceGrid.value.spacing,
  sourceGrid.value.zoom,
  sourceGrid.value.showGrid,
], redraw);

watch(() => sourceGrid.value.snapToGrid, (enabled) => {
  if (!enabled || !pendingSelection.value || !canvasRef.value) return;
  pendingSelection.value = snapRectToGrid(pendingSelection.value, sourceGrid.value, {
    width: canvasRef.value.width,
    height: canvasRef.value.height,
  });
});

watch(isSettingsDialogVisible, (visible) => {
  if (visible) {
    void addSettingsDialogOutsideListener();
    return;
  }

  removeSettingsDialogOutsideListener();
});

onBeforeUnmount(() => {
  cancelSelection();
  removeSettingsDialogOutsideListener();
});
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-height: 0; overflow: hidden; display: grid; grid-template-rows: 48px minmax(0, 1fr) 36px; box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
.panel-header { height: 48px; padding: 7px 10px; border-bottom: 1px solid var(--tf-color-border); background: linear-gradient(180deg, #383838 0%, #2f2f2f 100%); display: flex; align-items: center; justify-content: space-between; }
.panel-kicker { margin: 0; font-size: 10px; font-weight: 800; letter-spacing: .08em; color: #9f9f9f; }
h2 { margin: 0; font-size: 14px; line-height: 20px; font-weight: 650; color: var(--tf-color-text); }
.panel-actions { display: flex; align-items: center; gap: 6px; }
.hidden-input { display: none; }
.source-body { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tf-gutter); padding: var(--tf-gutter); background: #242424; }
.canvas-shell { position: relative; min-height: 0; overflow: hidden; border: 1px solid #111; border-radius: var(--tf-radius-sm); box-shadow: inset 0 0 0 1px rgba(255,255,255,.04); }
.canvas-shell.is-empty { display: grid; place-items: center; cursor: pointer; }
.upload-empty { display: grid; gap: 6px; text-align: center; color: var(--tf-color-text-muted); }
.upload-empty strong { color: var(--tf-color-text); }
.canvas-stage { position: relative; width: 100%; height: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center; padding: 12px; cursor: crosshair; }
.canvas-stage.is-panning { cursor: grabbing; }
.source-canvas { position: relative; z-index: 2; display: block; flex: none; cursor: inherit; image-rendering: pixelated; box-shadow: 0 10px 28px rgba(0,0,0,.28); }
.selection-box { position: absolute; z-index: 4; border: 2px solid #2d9cff; background: rgba(45, 156, 255, .14); box-shadow: inset 0 0 0 1px rgba(255,255,255,.28), 0 0 0 1px rgba(0,0,0,.35); pointer-events: none; }
.selection-actions { position: absolute; display: flex; align-items: center; gap: 4px; z-index: 5; }
.selection-action { width: 22px; height: 22px; padding: 0; border: 1px solid rgba(255,255,255,.16); border-radius: 2px; display: grid; place-items: center; color: #fff; font-size: 14px; font-weight: 800; line-height: 1; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,.4); }
.selection-action.is-confirm { background: #1473e6; }
.selection-action.is-cancel { background: rgba(28, 28, 28, .9); }
.selection-action:hover { filter: brightness(1.08); }
.source-actions { height: 36px; padding: 0 10px; display: grid; grid-template-columns: minmax(120px, auto) 240px minmax(0, 1fr); align-items: center; gap: 12px; border-top: 1px solid var(--tf-color-border); background: #2b2b2b; font-size: 12px; color: var(--tf-color-text-muted); }
.source-size { white-space: nowrap; }
.zoom-control { min-width: 0; display: grid; grid-template-columns: auto minmax(120px, 1fr); align-items: center; gap: 8px; white-space: nowrap; }
.zoom-control :deep(.el-slider) { --el-slider-button-size: 12px; }
.capture-hint { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; }
:deep(.settings-dialog) { margin: 80px 18px 0 auto; box-shadow: 0 18px 48px rgba(0, 0, 0, .48); }
:deep(.settings-dialog .el-dialog__header) { cursor: move; user-select: none; border-bottom: 1px solid var(--tf-color-border); padding: 10px 12px; background: #2f2f2f; }
:deep(.settings-dialog .el-dialog__body) { padding: 0; background: var(--tf-color-surface); }
@media (max-width: 900px) {
  .source-body { grid-template-columns: 1fr; }
  .source-actions { grid-template-columns: auto minmax(150px, 1fr); }
  .capture-hint { display: none; }
}
</style>