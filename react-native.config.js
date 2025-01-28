module.exports = {
  project: {
    ios: {},
    android: {}, // grouped into "project"
  },
  assets: ['./src/assets/fonts/'], // stays the same
  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer');
  },
  getSourceExts() {
    return ['ts', 'tsx'];
  },
};
