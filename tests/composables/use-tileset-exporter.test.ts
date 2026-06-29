import { describe, expect, it } from 'vitest';
import { buildTilesetJson, buildTilesetTsx } from '@/composables/useTilesetExporter';
import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';
import type { ExportSettings } from '@/types/business/sprite-sheet';

const grid: SpriteSheetGridConfig = {
  tileWidth: 16,
  tileHeight: 24,
  margin: 1,
  spacing: 2,
  zoom: 100,
  showGrid: true,
  snapToGrid: false,
};

const settings: ExportSettings = {
  tilesetName: 'demo-&-tileset',
  columns: 4,
  tiledVersion: '1.12.2',
};

describe('tileset metadata builders', () => {
  it('builds Tiled TSX metadata with escaped XML values', () => {
    const tsx = buildTilesetTsx({
      settings,
      grid,
      imageFileName: 'demo-<tiles>.png',
      imageWidth: 128,
      imageHeight: 96,
      tileCount: 24,
    });

    expect(tsx).toContain('name="demo-&amp;-tileset"');
    expect(tsx).toContain('tilewidth="16"');
    expect(tsx).toContain('tileheight="24"');
    expect(tsx).toContain('spacing="2"');
    expect(tsx).toContain('margin="1"');
    expect(tsx).toContain('tilecount="24"');
    expect(tsx).toContain('columns="4"');
    expect(tsx).toContain('source="demo-&lt;tiles&gt;.png"');
    expect(tsx).toContain('width="128"');
    expect(tsx).toContain('height="96"');
  });

  it('builds Tiled JSON metadata that matches current export settings', () => {
    const json = buildTilesetJson({
      settings,
      grid,
      imageFileName: 'demo-tileset.png',
      imageWidth: 128,
      imageHeight: 96,
      tileCount: 24,
    });

    expect(json).toEqual({
      type: 'tileset',
      version: '1.12.2',
      tiledversion: '1.12.2',
      name: 'demo-&-tileset',
      tilewidth: 16,
      tileheight: 24,
      spacing: 2,
      margin: 1,
      columns: 4,
      tilecount: 24,
      image: 'demo-tileset.png',
      imagewidth: 128,
      imageheight: 96,
    });
  });

  it('normalizes invalid column count to one', () => {
    const json = buildTilesetJson({
      settings: { ...settings, columns: 0 },
      grid,
      imageFileName: 'demo.png',
      imageWidth: 16,
      imageHeight: 24,
      tileCount: 1,
    });

    expect(json.columns).toBe(1);
  });
});