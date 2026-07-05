const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Zustand ESM build uses import.meta — force Metro to resolve CJS entry instead.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
