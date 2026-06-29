import { describe, expect, it } from 'vitest';
import '@/api/mockManager';
import { createExportRecord, getSpriteSheetDefaultConfig } from '@/api/modules/spriteSheetApi';

describe('spriteSheetApi mock contract', () => {
  it('returns editor defaults that match visible settings', async () => {
    const response = await getSpriteSheetDefaultConfig();

    expect(response.success).toBe(true);
    expect(response.body.grid).toMatchObject({
      tileWidth: 32,
      tileHeight: 32,
      margin: 0,
      spacing: 0,
      zoom: 100,
      showGrid: true,
      snapToGrid: false,
    });
    expect(response.body.export).toMatchObject({
      tilesetName: 'tileset-forge-export',
      tiledVersion: '1.12.2',
    });
    expect(response.body.futureFeatures.map((feature) => feature.key)).toEqual([
      'cloud-save',
      'history',
      'asset-library',
      'ai-remove-bg',
      'collaborate',
    ]);
  });

  it('creates an export record summary boundary', async () => {
    const response = await createExportRecord({
      tilesetName: 'demo-tileset',
      imageWidth: 128,
      imageHeight: 64,
      tileWidth: 16,
      tileHeight: 16,
      tileCount: 32,
      columns: 8,
      formats: ['png', 'tsx', 'json'],
    });

    expect(response.success).toBe(true);
    expect(response.body.exportId).toMatch(/^export-/u);
    expect(response.body.createdAt).toEqual(expect.any(String));
  });
});