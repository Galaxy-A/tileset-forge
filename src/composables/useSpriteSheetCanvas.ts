import type { SpriteSheetGridConfig } from '@/types/api/sprite-sheet';
import type { CapturedSprite, Rect } from '@/types/business/sprite-sheet';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });

type BackgroundColor = {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
};

type RemoveBackgroundOptions = {
  readonly threshold: number;
  readonly feather: number;
};

const getColorDistance = (red: number, green: number, blue: number, background: BackgroundColor) =>
  Math.hypot(red - background.red, green - background.green, blue - background.blue);

const getCornerAverageColor = (imageData: ImageData): BackgroundColor => {
  const { width, height, data } = imageData;
  const samplePoints = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const sum = samplePoints.reduce(
    (accumulator, [x, y]) => {
      const index = (y * width + x) * 4;
      return {
        red: accumulator.red + data[index],
        green: accumulator.green + data[index + 1],
        blue: accumulator.blue + data[index + 2],
      };
    },
    { red: 0, green: 0, blue: 0 },
  );

  return {
    red: sum.red / samplePoints.length,
    green: sum.green / samplePoints.length,
    blue: sum.blue / samplePoints.length,
  };
};

const drawGrid = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, grid: SpriteSheetGridConfig) => {
  if (!grid.showGrid) return;

  const stepX = Math.max(1, grid.tileWidth + grid.spacing);
  const stepY = Math.max(1, grid.tileHeight + grid.spacing);
  const startX = Math.max(0, grid.margin);
  const startY = Math.max(0, grid.margin);

  context.save();
  context.strokeStyle = 'rgba(79, 70, 229, .45)';
  context.lineWidth = 1;

  for (let x = startX + 0.5; x <= canvas.width; x += stepX) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }

  for (let y = startY + 0.5; y <= canvas.height; y += stepY) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  context.restore();
};

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

  /** 绘制源图和网格。 */
  const drawSourceImage = async (canvas: HTMLCanvasElement, imageUrl: string, grid: SpriteSheetGridConfig) => {
    const image = await loadImage(imageUrl);
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    drawGrid(context, canvas, grid);
  };

  /** 从源图生成透明背景图片。 */
  const removeImageBackground = async (
    imageUrl: string,
    options: RemoveBackgroundOptions = { threshold: 42, feather: 28 },
  ): Promise<string> => {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('无法创建去背景画布');

    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const backgroundColor = getCornerAverageColor(imageData);
    const { data } = imageData;

    for (let index = 0; index < data.length; index += 4) {
      const distance = getColorDistance(data[index], data[index + 1], data[index + 2], backgroundColor);
      if (distance <= options.threshold) {
        data[index + 3] = 0;
        continue;
      }
      if (distance <= options.threshold + options.feather) {
        const alphaRatio = (distance - options.threshold) / options.feather;
        data[index + 3] = Math.round(data[index + 3] * alphaRatio);
      }
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  /** 从源图裁切一个截图。 */
  const captureSprite = async (imageUrl: string, rect: Rect, index: number): Promise<CapturedSprite> => {
    const image = await loadImage(imageUrl);
    const sourceRect = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
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
    removeImageBackground,
  };
};