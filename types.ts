
export type AspectRatio = 'square' | 'landscape' | 'portrait';

export type BlurDirection = 'horizontal' | 'vertical' | 'none';

export interface FilterSettings {
  // Base Adjustments
  exposure: number;
  contrast: number;
  saturation: number;
  
  // Filters
  pixelSize: number;
  blurDirection: BlurDirection;
  blurRadius: number;
  
  // Finishing
  noiseEnabled: boolean;
  
  // Format
  aspectRatio: AspectRatio;
}

export const ASPECT_RATIOS: Record<AspectRatio, number> = {
  square: 1,
  landscape: 16 / 9,
  portrait: 9 / 16,
};
