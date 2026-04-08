import type { CuisineType } from '@/types';

export const CUISINE_COLOR: Record<CuisineType | string, string> = {
  chinese: '#860A15',
  korean: '#C4622D',
  japanese: '#2C5282',
  thai: '#276749',
  vietnamese: '#744C6E',
};

export const CUISINE_BG: Record<CuisineType | string, string> = {
  chinese: '#FBF0F0',
  korean: '#FDF4EE',
  japanese: '#EEF2FA',
  thai: '#EEF7F2',
  vietnamese: '#F5EFF5',
};

export const CUISINE_FALLBACK_COLOR = '#7A5C5C';
export const CUISINE_FALLBACK_BG = '#F5F0F0';
