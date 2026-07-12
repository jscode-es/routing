module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // worklets/plugin debe ser el último
  plugins: [
    '@authuser/react-native-routing/babel',
    'react-native-worklets/plugin',
  ],
};
