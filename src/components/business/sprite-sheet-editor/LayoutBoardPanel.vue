<template>
  <section class="editor-panel layout-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          LAYOUT BOARD
        </p>
        <h2>排版预览</h2>
      </div>
      <div class="board-stats tf-mono">
        {{ boardSize.width }}×{{ boardSize.height }}px · {{ store.layout.length }} items
      </div>
    </header>

    <div class="board-shell tf-checkerboard">
      <div
        v-if="!store.layout.length"
        class="empty-state"
      >
        <strong>选择截图后开始排版</strong>
        <span>截图会按 columns 参数自动铺开，也可以拖拽微调位置。</span>
      </div>

      <div
        v-else
        ref="boardRef"
        class="layout-board"
        :style="boardStyle"
      >
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
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { LayoutItem } from '@/types/business/sprite-sheet';

const store = useSpriteSheetEditorStore();
const boardRef = ref<HTMLElement>();
const dragging = ref<{ captureId: string; offsetX: number; offsetY: number }>();

const captureMap = computed(() => new Map(store.captures.map((capture) => [capture.id, capture])));
const visualItems = computed(() => store.layout
  .map((layout) => ({ layout, capture: captureMap.value.get(layout.captureId) }))
  .filter((item): item is { layout: LayoutItem; capture: NonNullable<typeof item.capture> } => Boolean(item.capture)));

const boardSize = computed(() => ({
  width: Math.max(360, store.exportImageSize.width || store.exportSettings.columns * store.grid.tileWidth),
  height: Math.max(220, store.exportImageSize.height || store.grid.tileHeight),
}));

const boardStyle = computed(() => ({
  width: `${boardSize.value.width}px`,
  height: `${boardSize.value.height}px`,
}));

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

const moveDrag = (event: PointerEvent) => {
  if (!dragging.value || !boardRef.value) return;
  const rect = boardRef.value.getBoundingClientRect();
  const x = Math.max(0, Math.round(event.clientX - rect.left - dragging.value.offsetX));
  const y = Math.max(0, Math.round(event.clientY - rect.top - dragging.value.offsetY));
  store.updateLayoutItem(dragging.value.captureId, { x, y });
};

const startDrag = (event: PointerEvent, captureId: string) => {
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

onBeforeUnmount(stopDrag);
</script>

<style scoped>
.editor-panel { background: var(--tf-color-surface); border: 1px solid var(--tf-color-border); border-radius: var(--tf-radius-md); min-height: 0; overflow: hidden; }
.panel-header { height: 56px; padding: 8px 12px; border-bottom: 1px solid var(--tf-color-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .05em; color: var(--tf-color-text-muted); }
h2 { margin: 0; font-size: 16px; line-height: 24px; }
.board-stats { font-size: 12px; color: var(--tf-color-text-muted); }
.board-shell { position: relative; height: calc(100% - 56px); min-height: 260px; overflow: auto; padding: 16px; }
.empty-state { height: 100%; min-height: 220px; display: grid; place-items: center; align-content: center; gap: 6px; text-align: center; color: var(--tf-color-text-muted); }
.empty-state strong { color: var(--tf-color-text); }
.layout-board { position: relative; background: rgba(255, 255, 255, .8); border: 1px solid var(--tf-color-border-strong); box-shadow: 0 8px 24px rgba(15, 23, 42, .08); }
.layout-item { position: absolute; display: grid; place-items: center; border: 1px solid rgba(79, 70, 229, .6); background: rgba(255,255,255,.7); cursor: grab; user-select: none; }
.layout-item:active { cursor: grabbing; }
.layout-item img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; pointer-events: none; }
.item-label { position: absolute; left: 2px; bottom: 2px; padding: 1px 3px; border-radius: 3px; background: rgba(15, 23, 42, .72); color: #fff; font-size: 10px; pointer-events: none; }
</style>