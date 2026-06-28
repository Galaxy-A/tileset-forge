import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';
import type { CapturedSprite } from '@/types/business/sprite-sheet';

const createCapture = (id: string, width = 32, height = 32): CapturedSprite => ({
  id,
  name: `Capture ${id}`,
  sourceRect: {
    x: 0,
    y: 0,
    width,
    height,
  },
  imageDataUrl: `data:image/png;base64,${id}`,
  width,
  height,
  selected: true,
});

describe('spriteSheetEditorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds selected captures to layout using current columns', () => {
    const store = useSpriteSheetEditorStore();
    store.updateExportSettings({ columns: 2 });

    store.addCapture(createCapture('a'));
    store.addCapture(createCapture('b'));
    store.addCapture(createCapture('c'));
    store.syncLayoutFromSelection();

    expect(store.layout).toEqual([
      { captureId: 'a', x: 0, y: 0, width: 32, height: 32, zIndex: 0 },
      { captureId: 'b', x: 32, y: 0, width: 32, height: 32, zIndex: 1 },
      { captureId: 'c', x: 0, y: 32, width: 32, height: 32, zIndex: 2 },
    ]);
  });

  it('calculates tile count from current layout and grid', () => {
    const store = useSpriteSheetEditorStore();
    store.updateGrid({ tileWidth: 16, tileHeight: 16 });
    store.addCapture(createCapture('large', 32, 48));
    store.syncLayoutFromSelection();

    expect(store.tileCount).toBe(6);
    expect(store.exportImageSize).toEqual({ width: 32, height: 48 });
  });

  it('clears layout when selection is cleared', () => {
    const store = useSpriteSheetEditorStore();
    store.addCapture(createCapture('a'));
    store.syncLayoutFromSelection();

    store.clearSelection();

    expect(store.selectedCount).toBe(0);
    expect(store.layout).toEqual([]);
  });
});