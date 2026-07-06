const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Add wasm asset support
config.resolver.assetExts.push('wasm');

// 2. Add COEP and COOP headers to support SharedArrayBuffer (required by wa-sqlite on Web)
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

const path = require('path');

// 3. Resolve Node.js core module polyfills
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  punycode: path.resolve(__dirname, 'node_modules/punycode'),
};

module.exports = config;
