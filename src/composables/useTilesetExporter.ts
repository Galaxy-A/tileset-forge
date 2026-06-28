import { createExportRecord } from '@/api/modules/spriteSheetApi';
import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';
import type { CapturedSprite, ExportSettings, LayoutItem } from '@/types/business/sprite-sheet';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

type TilesetMetadataParams = {
  readonly settings: ExportSettings;
  readonly grid: SpriteSheetGridConfig;
  readonly imageFileName: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly tileCount: number;
};

/** 生成 Tiled 外部 tileset XML 文本。 */
export const buildTilesetTsx = ({ settings, grid, imageFileName, imageWidth, imageHeight, tileCount }: TilesetMetadataParams) => {
  const columns = Math.max(1, settings.columns);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<tileset version="${escapeXml(settings.tiledVersion)}" tiledversion="${escapeXml(settings.tiledVersion)}" name="${escapeXml(settings.tilesetName)}" tilewidth="${grid.tileWidth}" tileheight="${grid.tileHeight}" spacing="${grid.spacing}" margin="${grid.margin}" tilecount="${tileCount}" columns="${columns}">\n  <image source="${escapeXml(imageFileName)}" width="${imageWidth}" height="${imageHeight}"/>\n</tileset>\n`;
};

/** 生成 Tiled JSON tileset 元数据。 */
export const buildTilesetJson = ({ settings, grid, imageFileName, imageWidth, imageHeight, tileCount }: TilesetMetadataParams) => ({
  type: 'tileset',
  version: settings.tiledVersion,
  tiledversion: settings.tiledVersion,
  name: settings.tilesetName,
  tilewidth: grid.tileWidth,
  tileheight: grid.tileHeight,
  spacing: grid.spacing,
  margin: grid.margin,
  columns: Math.max(1, settings.columns),
  tilecount: tileCount,
  image: imageFileName,
  imagewidth: imageWidth,
  imageheight: imageHeight,
});

/** Tileset 导出能力。 */
export const useTilesetExporter = () => {
  const renderPngBlob = async (captures: CapturedSprite[], layout: LayoutItem[]) => {
    const imageMap = new Map(captures.map((capture) => [capture.id, capture]));
    const width = Math.max(1, ...layout.map((item) => item.x + item.width));
    const height = Math.max(1, ...layout.map((item) => item.y + item.height));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建导出画布');
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);

    const orderedLayout = [...layout].sort((left, right) => left.zIndex - right.zIndex);

    for (const item of orderedLayout) {
      const capture = imageMap.get(item.captureId);
      if (!capture) continue;
      const image = await loadImage(capture.imageDataUrl);
      context.drawImage(image, item.x, item.y, item.width, item.height);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('PNG 导出失败'));
      }, 'image/png');
    });

    return { blob, width, height };
  };

  const exportTileset = async (params: {
    captures: CapturedSprite[];
    layout: LayoutItem[];
    grid: SpriteSheetGridConfig;
    settings: ExportSettings;
    tileCount: number;
    formats?: Array<'png' | 'tsx' | 'json'>;
  }) => {
    const formats = params.formats ?? ['png', 'tsx', 'json'];
    const shouldExportPng = formats.includes('png');
    const shouldExportTsx = formats.includes('tsx');
    const shouldExportJson = formats.includes('json');
    const baseName = params.settings.tilesetName || 'tileset-forge-export';
    const pngFileName = `${baseName}.png`;
    const tsxFileName = `${baseName}.tsx`;
    const jsonFileName = `${baseName}.json`;
    const { blob, width, height } = await renderPngBlob(params.captures, params.layout);
    const tsx = buildTilesetTsx({
      settings: params.settings,
      grid: params.grid,
      imageFileName: pngFileName,
      imageWidth: width,
      imageHeight: height,
      tileCount: params.tileCount,
    });
    const json = buildTilesetJson({
      settings: params.settings,
      grid: params.grid,
      imageFileName: pngFileName,
      imageWidth: width,
      imageHeight: height,
      tileCount: params.tileCount,
    });

    if (shouldExportPng) {
      downloadBlob(blob, pngFileName);
    }
    if (shouldExportTsx) {
      downloadBlob(new Blob([tsx], { type: 'application/xml;charset=utf-8' }), tsxFileName);
    }
    if (shouldExportJson) {
      downloadBlob(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json;charset=utf-8' }), jsonFileName);
    }

    await createExportRecord({
      tilesetName: params.settings.tilesetName,
      imageWidth: width,
      imageHeight: height,
      tileWidth: params.grid.tileWidth,
      tileHeight: params.grid.tileHeight,
      tileCount: params.tileCount,
      columns: params.settings.columns,
      formats,
    });
  };

  return {
    exportTileset,
  };
};