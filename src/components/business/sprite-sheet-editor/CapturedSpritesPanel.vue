<template>
  <section class="editor-panel captures-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          CAPTURES
        </p>
        <h2>截图列表</h2>
      </div>
      <div class="panel-actions">
        <span
          v-if="store.captures.length"
          class="selection-meta tf-mono"
        >
          {{ selectedExportLabel }}
        </span>
        <el-button
          size="small"
          :disabled="!store.captures.length"
          @click="store.selectAllCaptures()"
        >
          全选
        </el-button>
        <el-button
          size="small"
          :disabled="!store.selectedCount"
          @click="store.clearSelection()"
        >
          清空选择
        </el-button>
        <el-button
          size="small"
          type="primary"
          :loading="isExporting"
          :disabled="!canExportSelected"
          @click="handleExportSelected"
        >
          导出选中
        </el-button>
      </div>
    </header>

    <div
      v-if="!store.captures.length"
      class="empty-state"
    >
      <span>从源图中框选区域后，会在这里生成可排版截图。</span>
    </div>

    <div
      v-else
      class="capture-grid"
    >
      <article
        v-for="(capture, index) in store.captures"
        :key="capture.id"
        class="capture-card"
        :class="{ 'is-selected': capture.selected }"
        @click="toggleCapture(capture.id, !capture.selected)"
      >
        <div class="thumb tf-checkerboard">
          <img
            :src="capture.imageDataUrl"
            :alt="capture.name"
          >
        </div>
        <div class="capture-meta">
          <el-input
            class="capture-name-input"
            :model-value="getCaptureNameValue(capture)"
            size="small"
            aria-label="修改截图名称"
            @focus="startCaptureNameEdit(capture)"
            @update:model-value="handleNameInput(capture.id, $event)"
            @blur="commitCaptureName(capture.id)"
            @keydown.enter.stop.prevent="commitCaptureName(capture.id)"
            @click.stop
            @keydown.stop
          />
          <span>{{ capture.width }}×{{ capture.height }}px · x{{ capture.sourceRect.x }} y{{ capture.sourceRect.y }} · 层级 {{ index + 1 }}</span>
        </div>
        <div
          class="order-actions"
          @click.stop
        >
          <el-button
            size="small"
            text
            :disabled="index === 0"
            aria-label="上移截图层级"
            @click="moveCapture(capture.id, -1)"
          >
            ↑
          </el-button>
          <el-button
            size="small"
            text
            :disabled="index === store.captures.length - 1"
            aria-label="下移截图层级"
            @click="moveCapture(capture.id, 1)"
          >
            ↓
          </el-button>
        </div>
        <el-checkbox
          :model-value="capture.selected"
          @change="handleCheckboxChange(capture.id, $event)"
          @click.stop
        />
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useTilesetExporter } from '@/composables/useTilesetExporter';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { CapturedSprite } from '@/types/business/sprite-sheet';

const store = useSpriteSheetEditorStore();
const { exportCapturedSprites } = useTilesetExporter();
const isExporting = ref(false);
const captureNameDrafts = ref<Record<string, string>>({});

const canExportSelected = computed(() => store.selectedCount > 0 && !isExporting.value);
const selectedExportLabel = computed(() => `已选 ${store.selectedCount}/${store.captures.length}`);

const getCaptureNameValue = (capture: CapturedSprite) => captureNameDrafts.value[capture.id] ?? capture.name;

const startCaptureNameEdit = (capture: CapturedSprite) => {
  captureNameDrafts.value = { ...captureNameDrafts.value, [capture.id]: capture.name };
};

const handleNameInput = (id: string, value: string | number) => {
  captureNameDrafts.value = { ...captureNameDrafts.value, [id]: String(value) };
};

const commitCaptureName = (id: string) => {
  const draftName = captureNameDrafts.value[id];
  if (draftName === undefined) return;

  const nextDrafts = { ...captureNameDrafts.value };
  delete nextDrafts[id];
  captureNameDrafts.value = nextDrafts;

  if (!draftName.trim()) {
    ElMessage.warning('截图名称不能为空');
    return;
  }

  store.updateCaptureName(id, draftName);
};

const moveCapture = (id: string, offset: -1 | 1) => {
  store.moveCapture(id, offset);
};

const toggleCapture = (id: string, selected: boolean) => {
  store.toggleCapture(id, selected);
  store.syncLayoutFromSelection();
};

const handleCheckboxChange = (id: string, value: string | number | boolean) => {
  toggleCapture(id, Boolean(value));
};

const handleExportSelected = async () => {
  if (!canExportSelected.value) return;

  isExporting.value = true;
  try {
    await exportCapturedSprites(store.selectedCaptures);
    ElMessage.success(`已导出 ${store.selectedCount} 个截图文件`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '截图导出失败');
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-height: 0; overflow: hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
.panel-header { height: 48px; padding: 7px 10px; border-bottom: 1px solid var(--tf-color-border); background: linear-gradient(180deg, #383838 0%, #2f2f2f 100%); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel-kicker { margin: 0; font-size: 10px; font-weight: 800; letter-spacing: .08em; color: #9f9f9f; }
h2 { margin: 0; font-size: 14px; line-height: 20px; font-weight: 650; color: var(--tf-color-text); }
.panel-actions { display: flex; align-items: center; gap: 6px; }
.selection-meta { color: var(--tf-color-text-muted); font-size: 11px; white-space: nowrap; }
.empty-state { height: calc(100% - 48px); min-height: 120px; display: grid; place-items: center; padding: 20px; background: #242424; color: var(--tf-color-text-muted); font-size: 13px; text-align: center; }
.capture-grid { height: calc(100% - 48px); min-height: 120px; padding: 10px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); align-content: start; gap: 8px; background: #242424; }
.capture-card { display: grid; grid-template-columns: 48px 1fr auto auto; align-items: center; gap: 8px; padding: 8px; border: 1px solid #484848; border-radius: var(--tf-radius-md); cursor: pointer; background: #303030; box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
.capture-card:hover { border-color: #666; background: #363636; }
.capture-card.is-selected { border-color: var(--tf-color-primary); background: var(--tf-color-primary-soft); }
.thumb { width: 48px; height: 48px; display: grid; place-items: center; border: 1px solid #1b1b1b; border-radius: var(--tf-radius-sm); overflow: hidden; }
.thumb img { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
.capture-meta { display: grid; min-width: 0; gap: 2px; }
.capture-name-input { min-width: 0; }
:deep(.capture-name-input .el-input__wrapper) { min-height: 24px; padding: 0 6px; background: rgba(0, 0, 0, .18); box-shadow: inset 0 0 0 1px transparent; }
:deep(.capture-name-input .el-input__wrapper:hover) { box-shadow: inset 0 0 0 1px #666; }
:deep(.capture-name-input .el-input__wrapper.is-focus) { box-shadow: inset 0 0 0 1px var(--tf-color-primary); }
:deep(.capture-name-input .el-input__inner) { height: 24px; font-size: 13px; font-weight: 650; color: var(--tf-color-text); }
.order-actions { display: grid; grid-template-columns: 1fr; gap: 2px; }
.order-actions .el-button { width: 24px; height: 20px; min-height: 20px; padding: 0; margin: 0; color: var(--tf-color-text-muted); }
.order-actions .el-button:not(.is-disabled):hover { color: var(--tf-color-primary); }
.capture-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--tf-color-text-muted); }
</style>