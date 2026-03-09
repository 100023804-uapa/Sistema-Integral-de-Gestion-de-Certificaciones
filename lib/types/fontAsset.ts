export type FontAssetFormat = 'woff2' | 'woff' | 'ttf' | 'otf' | 'unknown';
export type FontAssetStyle = 'normal' | 'italic';
export type FontAssetSourceType = 'upload' | 'external';

export interface FontAsset {
  id: string;
  name: string;
  family: string;
  url: string;
  key?: string;
  format: FontAssetFormat;
  weight: string;
  style: FontAssetStyle;
  sourceType: FontAssetSourceType;
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
