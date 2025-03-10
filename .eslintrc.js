module.exports = {
  root: true,
  extends: ['@react-native', '@react-native-community'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      plugins: ['@babel/plugin-proposal-optional-chaining'],
    },
  },
};
