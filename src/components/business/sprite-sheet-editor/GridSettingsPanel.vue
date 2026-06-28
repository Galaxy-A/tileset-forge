<template>
  <aside class="settings-panel">
    <header class="panel-header">
      <p class="panel-kicker">
        PROPERTIES
      </p>
      <h2>Tileset 设置</h2>
    </header>

    <div class="settings-body">
      <label>Tileset name<el-input
        v-model="tilesetName"
        size="small"
      /></label>
      <label>Tile width<el-input-number
        v-model="tileWidth"
        size="small"
        :min="1"
        controls-position="right"
      /></label>
      <label>Tile height<el-input-number
        v-model="tileHeight"
        size="small"
        :min="1"
        controls-position="right"
      /></label>
      <label>Margin<el-input-number
        v-model="margin"
        size="small"
        :min="0"
        controls-position="right"
      /></label>
      <label>Spacing<el-input-number
        v-model="spacing"
        size="small"
        :min="0"
        controls-position="right"
      /></label>
      <label>Columns<el-input-number
        v-model="columns"
        size="small"
        :min="1"
        controls-position="right"
      /></label>
      <label>Tiled version<el-input
        v-model="tiledVersion"
        size="small"
      /></label>
      <div class="slider-row">
        <span>Zoom {{ store.grid.zoom }}%</span><el-slider
          v-model="zoom"
          :min="25"
          :max="200"
          :step="5"
          size="small"
        />
      </div>
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
const zoom = computed({ get: () => store.grid.zoom, set: (value) => store.updateGrid({ zoom: value }) });
const showGrid = computed({ get: () => store.grid.showGrid, set: (value) => store.updateGrid({ showGrid: value }) });
const tilesetName = computed({ get: () => store.exportSettings.tilesetName, set: (value) => store.updateExportSettings({ tilesetName: value }) });
const columns = computed({ get: () => store.exportSettings.columns, set: (value) => store.updateExportSettings({ columns: value }) });
const tiledVersion = computed({ get: () => store.exportSettings.tiledVersion, set: (value) => store.updateExportSettings({ tiledVersion: value }) });
</script>

<style scoped>
.settings-panel { width: var(--tf-panel-width); background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); overflow: hidden; }
.panel-header { padding: 8px 12px; border-bottom: 1px solid var(--tf-color-border); }
.panel-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 16px; }
.settings-body { padding: 12px; display: grid; gap: 10px; }
label { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 8px; font-size: 13px; color: var(--tf-color-text-muted); }
.slider-row { display: grid; gap: 4px; font-size: 13px; color: var(--tf-color-text-muted); }
:deep(.el-input-number) { width: 100%; }
</style>