// module.exports = {
//   presets: ['module:@react-native/babel-preset'],
//   plugins: ['react-native-reanimated/plugin'],
// };
// module.exports = {
//   presets: ['module:metro-react-native-babel-preset', 'nativewind/babel'],
// };
// module.exports = {
//   presets: ['@react-native/babel-preset', 'nativewind/babel'],
// };
module.exports = {
  presets: ['@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }]
  ]
};