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
        v-for="capture in store.captures"
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
          <strong>{{ capture.name }}</strong>
          <span>{{ capture.width }}×{{ capture.height }}px · x{{ capture.sourceRect.x }} y{{ capture.sourceRect.y }}</span>
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
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';

const store = useSpriteSheetEditorStore();

const toggleCapture = (id: string, selected: boolean) => {
  store.toggleCapture(id, selected);
  store.syncLayoutFromSelection();
};

const handleCheckboxChange = (id: string, value: string | number | boolean) => {
  toggleCapture(id, Boolean(value));
};
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-height: 0; overflow: hidden; }
.panel-header { height: 56px; padding: 8px 12px; border-bottom: 1px solid var(--tf-color-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 16px; line-height: 24px; }
.panel-actions { display: flex; align-items: center; gap: 6px; }
.empty-state { height: calc(100% - 56px); min-height: 120px; display: grid; place-items: center; padding: 20px; color: var(--tf-color-text-muted); font-size: 13px; text-align: center; }
.capture-grid { height: calc(100% - 56px); min-height: 120px; padding: 10px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); align-content: start; gap: 8px; }
.capture-card { display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); cursor: pointer; background: #fff; }
.capture-card.is-selected { border-color: var(--tf-color-primary); background: var(--tf-color-primary-soft); }
.thumb { width: 48px; height: 48px; display: grid; place-items: center; border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-sm); overflow: hidden; }
.thumb img { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
.capture-meta { display: grid; min-width: 0; gap: 2px; }
.capture-meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.capture-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--tf-color-text-muted); }
</style>