/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  rootDir: '.',
  roots: ['<rootDir>/test/navigation'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-worklets)/)',
  ],
};
