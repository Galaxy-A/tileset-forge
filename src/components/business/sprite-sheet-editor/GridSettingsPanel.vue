<template>
  <aside class="settings-panel">
    <header class="panel-header">
      <p class="panel-kicker">
        设置项
      </p>
      <h2>Tileset 参数</h2>
    </header>

    <div class="settings-body">
      <label>Tileset 名称<el-input
        v-model="tilesetName"
        size="small"
      /></label>
      <label>单格宽度<el-input-number
        v-model="tileWidth"
        size="small"
        :min="1"
        controls-position="right"
      /></label>
      <label>单格高度<el-input-number
        v-model="tileHeight"
        size="small"
        :min="1"
        controls-position="right"
      /></label>
      <label>边距<el-input-number
        v-model="margin"
        size="small"
        :min="0"
        controls-position="right"
      /></label>
      <label>间距<el-input-number
        v-model="spacing"
        size="small"
        :min="0"
        controls-position="right"
      /></label>
      <label>列数<el-input-number
        v-model="columns"
        size="small"
        :min="0"
        controls-position="right"
      /></label>
      <label>Tiled 版本<el-input
        v-model="tiledVersion"
        size="small"
      /></label>
      <el-checkbox v-model="showGrid">
        显示网格
      </el-checkbox>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';

const store = useSpriteSheetEditorStore();
const tileWidth = computed({ get: () => store.grid.tileWidth, set: (value) => store.updateGrid({ tileWidth: value }) });
const tileHeight = computed({ get: () => store.grid.tileHeight, set: (value) => store.updateGrid({ tileHeight: value }) });
const margin = computed({ get: () => store.grid.margin, set: (value) => store.updateGrid({ margin: value }) });
const spacing = computed({ get: () => store.grid.spacing, set: (value) => store.updateGrid({ spacing: value }) });
const showGrid = computed({ get: () => store.grid.showGrid, set: (value) => store.updateGrid({ showGrid: value }) });
const tilesetName = computed({ get: () => store.exportSettings.tilesetName, set: (value) => store.updateExportSettings({ tilesetName: value }) });
const columns = computed({ get: () => store.exportSettings.columns, set: (value) => store.updateExportSettings({ columns: value }) });
const tiledVersion = computed({ get: () => store.exportSettings.tiledVersion, set: (value) => store.updateExportSettings({ tiledVersion: value }) });
</script>

<style scoped>
.settings-panel { width: 100%; background: var(--tf-color-surface); overflow: hidden; }
.panel-header { display: none; }
.panel-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 16px; }
.settings-body { padding: 12px; display: grid; gap: 10px; }
label { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 8px; font-size: 13px; color: var(--tf-color-text-muted); }
:deep(.el-input-number) { width: 100%; }
</style>