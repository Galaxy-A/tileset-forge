import type { CapturedSprite, Rect } from '@/types/business/sprite-sheet';
import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });

/** Canvas 图像处理能力。 */
export const useSpriteSheetCanvas = () => {
  /** 读取用户选择的图片。 */
  const loadImageFile = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const image = await loadImage(objectUrl);

    return {
      fileName: file.name,
      width: image.naturalWidth,
      height: image.naturalHeight,
      objectUrl,
    };
  };

  /** 绘制源图和参考网格。 */
  const drawSourceImage = async (canvas: HTMLCanvasElement, imageUrl: string, grid: SpriteSheetGridConfig) => {
    const image = await loadImage(imageUrl);
    const context = canvas.getContext('2d');
    if (!context) return;

    const scale = grid.zoom / 100;
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (!grid.showGrid) return;

    context.save();
    context.strokeStyle = 'rgba(79, 70, 229, 0.32)';
    context.lineWidth = 1;

    const stepX = Math.max(1, grid.tileWidth + grid.spacing) * scale;
    const stepY = Math.max(1, grid.tileHeight + grid.spacing) * scale;
    const startX = grid.margin * scale;
    const startY = grid.margin * scale;

    for (let x = startX; x <= canvas.width; x += stepX) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, canvas.height);
      context.stroke();
    }

    for (let y = startY; y <= canvas.height; y += stepY) {
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(canvas.width, y + 0.5);
      context.stroke();
    }

    context.restore();
  };

  /** 从源图裁切一个截图。 */
  const captureSprite = async (imageUrl: string, rect: Rect, index: number, zoom: number): Promise<CapturedSprite> => {
    const image = await loadImage(imageUrl);
    const scale = zoom / 100;
    const sourceRect = {
      x: Math.round(rect.x / scale),
      y: Math.round(rect.y / scale),
      width: Math.round(rect.width / scale),
      height: Math.round(rect.height / scale),
    };

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, sourceRect.width);
    canvas.height = Math.max(1, sourceRect.height);

    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建截图画布');

    context.imageSmoothingEnabled = false;
    context.drawImage(
      image,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      0,
      0,
      sourceRect.width,
      sourceRect.height,
    );

    return {
      id: `capture-${Date.now()}-${index}`,
      name: `Capture ${index + 1}`,
      sourceRect,
      imageDataUrl: canvas.toDataURL('image/png'),
      width: sourceRect.width,
      height: sourceRect.height,
      selected: true,
    };
  };

  return {
    captureSprite,
    drawSourceImage,
    loadImageFile,
  };
};