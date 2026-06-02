export type AssetType = 'audio' | 'image' | 'icon' | 'texture';

export type AssetEntry = {
  module: number; // result of require()
  type: AssetType;
  tags: string[];
};
