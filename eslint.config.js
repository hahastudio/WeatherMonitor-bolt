// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      '.expo/*',
      'node_modules/*',
      'dist/*',
      'build/*',
      'node_modules/*',
      'coverage/*',
      'ios/*',
      'android/*',
    ],
  },
]);
