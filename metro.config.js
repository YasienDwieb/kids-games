// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// three ≥ 0.18x resolves `require('three')` to a deprecated CJS shim that calls
// Node's process.emitWarning, which React Native doesn't have — the app crashes
// at startup. Point every `three` import (ours and react-three-fiber's) at the
// ES module build instead.
const THREE_ESM = path.join(__dirname, 'node_modules/three/build/three.module.js');
const resolveDefault = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: THREE_ESM };
  return (resolveDefault ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
