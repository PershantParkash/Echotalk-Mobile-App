
// const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
// const { withNativeWind } = require("nativewind/metro");

// const config = mergeConfig(getDefaultConfig(__dirname), {});

// module.exports = withNativeWind(config, {
//   input: "./global.css",
// });
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

const defaultConfig = getDefaultConfig(__dirname);

// Merge NativeWind and SVG transformer
const config = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== "svg"),
    sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
  },
});

module.exports = withNativeWind(config, {
  input: "./global.css",
});
