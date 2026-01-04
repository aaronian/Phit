/**
 * Babel Configuration
 *
 * Babel is a JavaScript compiler that transforms modern JavaScript
 * into code that can run on older platforms.
 *
 * WHY DO WE NEED THIS?
 * react-native-reanimated uses special syntax for worklets (functions
 * that run on the UI thread). The Reanimated babel plugin transforms
 * these into code that React Native can execute.
 *
 * IMPORTANT: The reanimated plugin MUST be listed last in the plugins array.
 */
module.exports = function (api) {
  // Cache the configuration for faster builds
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add the reanimated plugin LAST
      // This plugin enables worklet functions for smooth animations
      'react-native-reanimated/plugin',
    ],
  };
};
