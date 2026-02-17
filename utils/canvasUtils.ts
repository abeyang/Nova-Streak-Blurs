
import { FilterSettings, ASPECT_RATIOS } from '../types';

/**
 * Calculates the crop dimensions to mimic 'object-fit: cover'
 */
export const getCoverDimensions = (
  imgWidth: number,
  imgHeight: number,
  targetRatio: number
) => {
  let sourceWidth, sourceHeight, sourceX, sourceY;
  const currentRatio = imgWidth / imgHeight;

  if (currentRatio > targetRatio) {
    sourceHeight = imgHeight;
    sourceWidth = imgHeight * targetRatio;
    sourceX = (imgWidth - sourceWidth) / 2;
    sourceY = 0;
  } else {
    sourceWidth = imgWidth;
    sourceHeight = imgWidth / targetRatio;
    sourceX = 0;
    sourceY = (imgHeight - sourceHeight) / 2;
  }

  return { sourceX, sourceY, sourceWidth, sourceHeight };
};

/**
 * Applies basic image adjustments using CSS filters
 */
export const applyAdjustments = (
  ctx: CanvasRenderingContext2D,
  settings: { exposure: number; contrast: number; saturation: number }
) => {
  const brightnessVal = 100 + settings.exposure;
  const contrastVal = 100 + settings.contrast;
  const saturationVal = 100 + settings.saturation;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = ctx.canvas.width;
  tempCanvas.height = ctx.canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturationVal}%)`;
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = 'none';
};

/**
 * Applies pixellation
 */
export const applyPixellation = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelSize: number
) => {
  if (pixelSize <= 1) return;

  const offscreen = document.createElement('canvas');
  const octx = offscreen.getContext('2d');
  if (!octx) return;

  const w = Math.ceil(width / pixelSize);
  const h = Math.ceil(height / pixelSize);
  offscreen.width = w;
  offscreen.height = h;

  octx.imageSmoothingEnabled = false;
  octx.drawImage(ctx.canvas, 0, 0, width, height, 0, 0, w, h);

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, w, h, 0, 0, width, height);
};

/**
 * Applies directional blur with ease-in-quad weight
 */
export const applyDirectionalBlur = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  direction: 'horizontal' | 'vertical'
) => {
  if (radius <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const output = new Uint8ClampedArray(pixels.length);

  const weights: number[] = [];
  let weightSum = 0;
  for (let i = -radius; i <= radius; i++) {
    const dist = Math.abs(i) / radius;
    const weight = 1 - dist * dist; 
    weights.push(weight);
    weightSum += weight;
  }

  for (let i = 0; i < weights.length; i++) weights[i] /= weightSum;

  if (direction === 'horizontal') {
    for (let y = 0; y < height; y++) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let i = -radius; i <= radius; i++) {
          const sampleX = Math.min(width - 1, Math.max(0, x + i));
          const offset = rowOffset + sampleX * 4;
          const weight = weights[i + radius];
          r += pixels[offset] * weight;
          g += pixels[offset + 1] * weight;
          b += pixels[offset + 2] * weight;
          a += pixels[offset + 3] * weight;
        }
        const outOffset = rowOffset + x * 4;
        output[outOffset] = r;
        output[outOffset + 1] = g;
        output[outOffset + 2] = b;
        output[outOffset + 3] = a;
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let i = -radius; i <= radius; i++) {
          const sampleY = Math.min(height - 1, Math.max(0, y + i));
          const offset = (sampleY * width + x) * 4;
          const weight = weights[i + radius];
          r += pixels[offset] * weight;
          g += pixels[offset + 1] * weight;
          b += pixels[offset + 2] * weight;
          a += pixels[offset + 3] * weight;
        }
        const outOffset = (y * width + x) * 4;
        output[outOffset] = r;
        output[outOffset + 1] = g;
        output[outOffset + 2] = b;
        output[outOffset + 3] = a;
      }
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
};

/**
 * Applies noise overlay: #888 base, randomized, blend mode overlay
 */
export const applyNoise = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const grainSize = 4;
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const octx = offscreen.getContext('2d');
  if (!octx) return;

  // Base layer #888
  octx.fillStyle = '#888888';
  octx.fillRect(0, 0, width, height);

  // Add "multi" randomized grain
  for (let x = 0; x < width; x += grainSize) {
    for (let y = 0; y < height; y += grainSize) {
      const rand = (Math.random() - 0.5) * 60; // deviation from #888
      const val = 136 + rand; // 136 is ~#88 hex
      octx.fillStyle = `rgb(${val}, ${val}, ${val})`;
      octx.fillRect(x, y, grainSize, grainSize);
    }
  }

  // Blending: overlay
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
};
