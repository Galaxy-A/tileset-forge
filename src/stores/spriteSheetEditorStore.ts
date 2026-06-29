import { defineStore } from 'pinia';
import type { SpriteSheetGridConfig, TiledExportConfig } from '@/types/api/sprite-sheet';
import type { CapturedSprite, ExportSettings, LayoutItem, SourceImage } from '@/types/business/sprite-sheet';
import type { ProjectSnapshot } from '@/types/business/project';

type EditorState = {
  sourceImage?: SourceImage;
  grid: SpriteSheetGridConfig;
  captures: CapturedSprite[];
  layout: LayoutItem[];
  exportSettings: ExportSettings;
  futureFeatures: Array<{ key: string; label: string; enabled: boolean }>;
};

const defaultGrid: SpriteSheetGridConfig = {
  tileWidth: 32,
  tileHeight: 32,
  margin: 0,
  spacing: 0,
  zoom: 100,
  showGrid: true,
  snapToGrid: false,
};

/** Sprite Sheet 编辑器状态。 */
export const useSpriteSheetEditorStore = defineStore('sprite-sheet-editor', {
  state: (): EditorState => ({
    grid: defaultGrid,
    captures: [],
    layout: [],
    exportSettings: {
      tilesetName: 'tileset-forge-export',
      columns: 8,
      tiledVersion: '1.12.2',
    },
    futureFeatures: [],
  }),
  getters: {
    selectedCaptures: (state) => state.captures.filter((capture) => capture.selected),
    selectedCount: (state) => state.captures.filter((capture) => capture.selected).length,
    exportImageSize: (state) => {
      const width = Math.max(0, ...state.layout.map((item) => item.x + item.width));
      const height = Math.max(0, ...state.layout.map((item) => item.y + item.height));
      return { width, height };
    },
    tileCount: (state) => state.layout.reduce((sum, item) => {
      const cols = Math.max(1, Math.floor(item.width / state.grid.tileWidth));
      const rows = Math.max(1, Math.floor(item.height / state.grid.tileHeight));
      return sum + cols * rows;
    }, 0),
  },
  actions: {
    applyDefaultConfig(config: { grid: SpriteSheetGridConfig; export: TiledExportConfig; futureFeatures: EditorState['futureFeatures'] }) {
      this.grid = { ...config.grid };
      this.exportSettings = {
        tilesetName: config.export.tilesetName,
        columns: 8,
        tiledVersion: config.export.tiledVersion,
      };
      this.futureFeatures = config.futureFeatures;
    },
    setSourceImage(sourceImage: SourceImage) {
      this.sourceImage = sourceImage;
      this.captures = [];
      this.layout = [];
    },
    replaceSourceImage(sourceImage: SourceImage) {
      this.sourceImage = sourceImage;
      this.captures = [];
      this.layout = [];
    },
    updateGrid(grid: Partial<SpriteSheetGridConfig>) {
      this.grid = { ...this.grid, ...grid };
    },
    addCapture(capture: CapturedSprite) {
      this.captures.push(capture);
    },
    toggleCapture(id: string, selected: boolean) {
      this.captures = this.captures.map((capture) => (capture.id === id ? { ...capture, selected } : capture));
    },
    updateCaptureName(id: string, name: string) {
      const normalizedName = name.trim();
      if (!normalizedName) return false;
      const exists = this.captures.some((capture) => capture.id === id);
      if (!exists) return false;
      this.captures = this.captures.map((capture) => (capture.id === id ? { ...capture, name: normalizedName } : capture));
      return true;
    },
    syncLayoutZIndexFromCaptureOrder() {
      const captureOrder = new Map(this.captures.map((capture, index) => [capture.id, index]));
      this.layout = this.layout.map((item) => ({
        ...item,
        zIndex: captureOrder.get(item.captureId) ?? item.zIndex,
      }));
    },
    moveCapture(captureId: string, offset: -1 | 1) {
      const currentIndex = this.captures.findIndex((capture) => capture.id === captureId);
      const targetIndex = currentIndex + offset;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= this.captures.length) return false;

      const nextCaptures = [...this.captures];
      const [movingCapture] = nextCaptures.splice(currentIndex, 1);
      nextCaptures.splice(targetIndex, 0, movingCapture);
      this.captures = nextCaptures;
      this.syncLayoutZIndexFromCaptureOrder();
      return true;
    },
    selectAllCaptures() {
      this.captures = this.captures.map((capture) => ({ ...capture, selected: true }));
      this.syncLayoutFromSelection();
    },
    clearSelection() {
      this.captures = this.captures.map((capture) => ({ ...capture, selected: false }));
      this.layout = [];
    },
    syncLayoutFromSelection() {
      const existing = new Map(this.layout.map((item) => [item.captureId, item]));
      const captureOrder = new Map(this.captures.map((capture, index) => [capture.id, index]));
      this.layout = this.captures
        .filter((capture) => capture.selected)
        .map((capture, index) => {
          const zIndex = captureOrder.get(capture.id) ?? index;
          const existingItem = existing.get(capture.id);
          if (existingItem) return { ...existingItem, zIndex };

          return {
            captureId: capture.id,
            x: (index % this.exportSettings.columns) * capture.width,
            y: Math.floor(index / this.exportSettings.columns) * capture.height,
            width: capture.width,
            height: capture.height,
            zIndex,
          };
        });
    },
    updateLayoutItem(captureId: string, patch: Partial<LayoutItem>) {
      this.layout = this.layout.map((item) => (item.captureId === captureId ? { ...item, ...patch } : item));
    },
    updateExportSettings(settings: Partial<ExportSettings>) {
      this.exportSettings = { ...this.exportSettings, ...settings };
      this.syncLayoutFromSelection();
    },
    toProjectSnapshot(): ProjectSnapshot {
      return {
        projectId: 'local-draft',
        ownerId: 'local-user',
        workspaceId: 'local-workspace',
        name: this.exportSettings.tilesetName,
        sourceImage: this.sourceImage,
        grid: this.grid,
        captures: this.captures,
        layout: this.layout,
        exportSettings: this.exportSettings,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
    },
  },
});