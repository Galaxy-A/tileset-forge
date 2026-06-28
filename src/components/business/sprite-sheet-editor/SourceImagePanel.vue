<template>
  <section class="editor-panel source-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          SOURCE IMAGE
        </p>
        <h2>上传并框选原始素材图</h2>
      </div>
      <el-button
        size="small"
        @click="openFileDialog"
      >
        上传图片
      </el-button>
    </header>

    <input
      ref="fileInputRef"
      class="hidden-input"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      @change="handleFileInput"
    >

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
      >
        <canvas
          ref="canvasRef"
          class="source-canvas"
          @mousedown="startSelection"
          @mousemove="moveSelection"
          @mouseup="finishSelection"
          @mouseleave="finishSelection"
        />
        <div
          v-if="normalizedSelection"
          class="selection-box"
          :style="selectionStyle"
        />
      </div>
    </div>

    <footer class="source-actions">
      <span>{{ store.sourceImage ? `${store.sourceImage.width} × ${store.sourceImage.height}px` : '未加载图片' }}</span>
      <el-button
        size="small"
        type="primary"
        :disabled="!canCapture"
        @click="confirmCapture"
      >
        确认截图
      </el-button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useSpriteSheetCanvas } from '@/composables/useSpriteSheetCanvas';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { Rect } from '@/types/business/sprite-sheet';

const store = useSpriteSheetEditorStore();
const { captureSprite, drawSourceImage, loadImageFile } = useSpriteSheetCanvas();
const canvasRef = ref<HTMLCanvasElement>();
const fileInputRef = ref<HTMLInputElement>();
const selectionStart = ref<{ x: number; y: number }>();
const selectionEnd = ref<{ x: number; y: number }>();

const normalizedSelection = computed<Rect | undefined>(() => {
  if (!selectionStart.value || !selectionEnd.value) return undefined;
  const x = Math.min(selectionStart.value.x, selectionEnd.value.x);
  const y = Math.min(selectionStart.value.y, selectionEnd.value.y);
  const width = Math.abs(selectionStart.value.x - selectionEnd.value.x);
  const height = Math.abs(selectionStart.value.y - selectionEnd.value.y);
  return width > 4 && height > 4 ? { x, y, width, height } : undefined;
});

const canCapture = computed(() => Boolean(store.sourceImage && normalizedSelection.value));
const selectionStyle = computed(() => {
  const rect = normalizedSelection.value;
  return rect ? { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` } : {};
});

const redraw = async () => {
  if (!canvasRef.value || !store.sourceImage) return;
  await drawSourceImage(canvasRef.value, store.sourceImage.objectUrl, store.grid);
};

const openFileDialog = () => fileInputRef.value?.click();

const loadFile = async (file?: File) => {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    ElMessage.warning('请选择 PNG / JPG / WebP 图片');
    return;
  }
  const sourceImage = await loadImageFile(file);
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

const getCanvasPoint = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  return rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : { x: 0, y: 0 };
};

const startSelection = (event: MouseEvent) => {
  if (!store.sourceImage) return;
  selectionStart.value = getCanvasPoint(event);
  selectionEnd.value = selectionStart.value;
};

const moveSelection = (event: MouseEvent) => {
  if (!selectionStart.value) return;
  selectionEnd.value = getCanvasPoint(event);
};

const finishSelection = () => {
  if (!selectionStart.value || !selectionEnd.value) return;
};

const confirmCapture = async () => {
  if (!store.sourceImage || !normalizedSelection.value) return;
  const capture = await captureSprite(store.sourceImage.objectUrl, normalizedSelection.value, store.captures.length, store.grid.zoom);
  store.addCapture(capture);
  store.syncLayoutFromSelection();
  selectionStart.value = undefined;
  selectionEnd.value = undefined;
};

watch(() => [store.sourceImage?.objectUrl, store.grid.tileWidth, store.grid.tileHeight, store.grid.margin, store.grid.spacing, store.grid.zoom, store.grid.showGrid], redraw);
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-height: 0; }
.panel-header { height: 56px; padding: 8px 12px; border-bottom: 1px solid var(--tf-color-border); display: flex; align-items: center; justify-content: space-between; }
.panel-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 16px; line-height: 24px; }
.hidden-input { display: none; }
.canvas-shell { position: relative; height: calc(100% - 96px); min-height: 360px; overflow: auto; border-bottom: 1px solid var(--tf-color-border); }
.canvas-shell.is-empty { display: grid; place-items: center; cursor: pointer; }
.upload-empty { display: grid; gap: 6px; text-align: center; color: var(--tf-color-text-muted); }
.upload-empty strong { color: var(--tf-color-text); }
.canvas-stage { position: relative; width: max-content; min-width: 100%; min-height: 100%; }
.source-canvas { display: block; image-rendering: pixelated; }
.selection-box { position: absolute; border: 1px solid var(--tf-color-primary); background: rgba(79, 70, 229, .12); pointer-events: none; }
.source-actions { height: 40px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--tf-color-text-muted); }
</style>