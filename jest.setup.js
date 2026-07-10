require('react-native-gesture-handler/jestSetup');

// react-native-screens no publica mock oficial de Jest: mapeamos las
// primitivas nativas a Views planas conservando las props para poder
// asertar sobre ellas (activityState, title, onDismissed...).
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    ScreenStack: ({ children, ...props }) =>
      React.createElement(View, { testID: 'screen-stack', ...props }, children),
    Screen: ({ children, ...props }) =>
      React.createElement(View, { testID: 'screen', ...props }, children),
    ScreenStackHeaderConfig: (props) =>
      React.createElement(View, { testID: 'header-config', ...props }),
  };
});
