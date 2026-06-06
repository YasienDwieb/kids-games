export type AssetType = 'audio' | 'image' | 'icon' | 'texture';

export type AssetEntry = {
  // One or more interchangeable variants (each a require() result). Audio intents
  // play a random variant so repeated sounds don't feel monotonous.
  modules: number[];
  type: AssetType;
  tags: string[];
};
