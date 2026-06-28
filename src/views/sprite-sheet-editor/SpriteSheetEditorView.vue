<template>
  <main class="sprite-editor-page">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">TF</span>
        <div>
          <h1>Tileset Forge</h1>
          <p>本地 Sprite Sheet 编辑器 · Tiled-ready export</p>
        </div>
      </div>

      <div class="future-actions">
        <el-button
          v-for="feature in store.futureFeatures"
          :key="feature.key"
          size="small"
          :disabled="!feature.enabled"
        >
          {{ feature.label }}
        </el-button>
      </div>

      <div class="export-actions">
        <span class="export-meta tf-mono">{{ exportSize.width }}×{{ exportSize.height }}px · {{ store.tileCount }} tiles</span>
        <el-button
          type="primary"
          :loading="isExporting"
          :disabled="!canExport"
          @click="handleExport"
        >
          导出 PNG + TSX + JSON
        </el-button>
      </div>
    </header>

    <section class="workspace">
      <div class="main-column">
        <SourceImagePanel class="source-area" />
        <CapturedSpritesPanel class="captures-area" />
      </div>

      <div class="side-column">
        <GridSettingsPanel />
        <LayoutBoardPanel class="layout-area" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getSpriteSheetDefaultConfig } from '@/api/modules/spriteSheetApi';
import CapturedSpritesPanel from '@/components/business/sprite-sheet-editor/CapturedSpritesPanel.vue';
import GridSettingsPanel from '@/components/business/sprite-sheet-editor/GridSettingsPanel.vue';
import LayoutBoardPanel from '@/components/business/sprite-sheet-editor/LayoutBoardPanel.vue';
import SourceImagePanel from '@/components/business/sprite-sheet-editor/SourceImagePanel.vue';
import { useTilesetExporter } from '@/composables/useTilesetExporter';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';

const store = useSpriteSheetEditorStore();
const { exportTileset } = useTilesetExporter();
const isExporting = ref(false);
const exportSize = computed(() => store.exportImageSize);
const canExport = computed(() => store.layout.length > 0 && store.tileCount > 0);

const loadDefaultConfig = async () => {
  const response = await getSpriteSheetDefaultConfig();
  if (!response.success) {
    ElMessage.error(response.message || '默认配置加载失败');
    return;
  }
  store.applyDefaultConfig(response.body);
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
    });
    ElMessage.success('已导出 PNG、TSX、JSON，并记录导出摘要');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  } finally {
    isExporting.value = false;
  }
};

onMounted(loadDefaultConfig);
</script>

<style scoped>
.sprite-editor-page { height: 100%; display: grid; grid-template-rows: var(--tf-toolbar-height) 1fr; background: var(--tf-color-background); }
.topbar { height: var(--tf-toolbar-height); display: grid; grid-template-columns: minmax(260px, auto) 1fr auto; align-items: center; gap: 12px; padding: 0 10px; border-bottom: 1px solid var(--tf-color-border); background: rgba(255,255,255,.86); backdrop-filter: blur(12px); }
.brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
.brand-mark { width: 26px; height: 26px; border-radius: var(--tf-radius-sm); display: grid; place-items: center; background: var(--tf-color-primary); color: #fff; font-size: 12px; font-weight: 800; }
h1 { margin: 0; font-size: 15px; line-height: 18px; }
p { margin: 0; font-size: 12px; color: var(--tf-color-text-muted); }
.future-actions { min-width: 0; display: flex; align-items: center; gap: 6px; overflow: hidden; }
.export-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.export-meta { color: var(--tf-color-text-muted); font-size: 12px; white-space: nowrap; }
.workspace { min-height: 0; padding: var(--tf-gutter); display: grid; grid-template-columns: minmax(520px, 1.25fr) minmax(520px, 1fr); gap: var(--tf-gutter); }
.main-column { min-height: 0; display: grid; grid-template-rows: minmax(420px, 1fr) 210px; gap: var(--tf-gutter); }
.side-column { min-height: 0; display: grid; grid-template-columns: var(--tf-panel-width) minmax(0, 1fr); gap: var(--tf-gutter); }
.source-area,
.captures-area,
.layout-area { min-height: 0; }
@media (max-width: 1180px) {
  .topbar { grid-template-columns: 1fr auto; height: auto; min-height: var(--tf-toolbar-height); padding: 8px 10px; }
  .future-actions { display: none; }
  .workspace { grid-template-columns: 1fr; overflow: auto; }
  .main-column,
  .side-column { min-height: 620px; }
}
</style>