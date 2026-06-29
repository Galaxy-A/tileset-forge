<template>
  <aside
    class="settings-panel"
    :class="{ 'settings-panel--embedded': embedded }"
  >
    <header
      v-if="showHeader"
      class="panel-header"
    >
      <p class="panel-kicker">
        设置项
      </p>
      <h2>Tileset 参数</h2>
    </header>

    <div class="settings-body">
      <label v-if="showExportFields">Tileset 名称<el-input
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
      <label v-if="showExportFields">Tiled 版本<el-input
        v-model="tiledVersion"
        size="small"
      /></label>
      <el-checkbox v-model="showGrid">
        显示网格
      </el-checkbox>
      <el-checkbox v-model="snapToGrid">
        标准化到网格
      </el-checkbox>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';
import type { ExportSettings } from '@/types/business/sprite-sheet';

type SettingsScope = 'all' | 'grid';

const props = withDefaults(defineProps<{
  grid: SpriteSheetGridConfig;
  exportSettings?: ExportSettings;
  scope?: SettingsScope;
  embedded?: boolean;
}>(), {
  exportSettings: undefined,
  scope: 'all',
  embedded: false,
});

const emit = defineEmits<{
  'update:grid': [value: SpriteSheetGridConfig];
  'update:exportSettings': [value: ExportSettings];
}>();

const showHeader = computed(() => !props.embedded);
const showExportFields = computed(() => props.scope === 'all');
const nextGrid = (patch: Partial<SpriteSheetGridConfig>) => emit('update:grid', { ...props.grid, ...patch });
const nextExportSettings = (patch: Partial<ExportSettings>) => {
  if (!props.exportSettings) return;
  emit('update:exportSettings', { ...props.exportSettings, ...patch });
};

const tileWidth = computed({ get: () => props.grid.tileWidth, set: (value) => nextGrid({ tileWidth: value }) });
const tileHeight = computed({ get: () => props.grid.tileHeight, set: (value) => nextGrid({ tileHeight: value }) });
const margin = computed({ get: () => props.grid.margin, set: (value) => nextGrid({ margin: value }) });
const spacing = computed({ get: () => props.grid.spacing, set: (value) => nextGrid({ spacing: value }) });
const showGrid = computed({ get: () => props.grid.showGrid, set: (value) => nextGrid({ showGrid: value }) });
const snapToGrid = computed({ get: () => props.grid.snapToGrid, set: (value) => nextGrid({ snapToGrid: value }) });
const tilesetName = computed({ get: () => props.exportSettings?.tilesetName ?? '', set: (value) => nextExportSettings({ tilesetName: value }) });
const tiledVersion = computed({ get: () => props.exportSettings?.tiledVersion ?? '', set: (value) => nextExportSettings({ tiledVersion: value }) });
</script>

<style scoped>
.settings-panel { width: 100%; background: var(--tf-color-surface); overflow: hidden; color: var(--tf-color-text); }
.settings-panel--embedded { background: transparent; }
.panel-header { display: none; }
.panel-kicker { margin: 0; font-size: 10px; font-weight: 800; letter-spacing: .08em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 14px; }
.settings-body { padding: 12px; display: grid; gap: 10px; background: #323232; }
.settings-panel--embedded .settings-body { padding: 0; background: transparent; }
label { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 8px; font-size: 12px; color: var(--tf-color-text-muted); }
:deep(.el-input-number) { width: 100%; }
:deep(.el-checkbox) { --el-checkbox-text-color: var(--tf-color-text-muted); --el-checkbox-checked-text-color: var(--tf-color-text); }
</style>