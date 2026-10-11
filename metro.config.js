const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultPort = 8084;
process.env.RCT_METRO_PORT = process.env.RCT_METRO_PORT || String(defaultPort);

config.server = {
  ...config.server,
  port: Number(process.env.RCT_METRO_PORT) || defaultPort,
};

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-background-fetch') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'utils/backgroundFetch.web.ts'),
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
