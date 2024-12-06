export enum FeatureType {
    SIZE = 'size',
    NUMBER = 'number',
    COLOR = 'color'
  }

export const VISUAL_FEATURE_TYPES = [FeatureType.COLOR];

export interface FeatureConfig {
  type: FeatureType;
  isVisual: boolean;
  requiresNumericSort: boolean;
}

export const FEATURE_CONFIGS: { [key: string]: FeatureConfig } = {
  'Size': {
    type: FeatureType.SIZE,
    isVisual: false,
    requiresNumericSort: true
  },
  'Number': {
    type: FeatureType.NUMBER,
    isVisual: false,
    requiresNumericSort: true
  },
  'Color': {
    type: FeatureType.COLOR,
    isVisual: true,
    requiresNumericSort: false
  }
};