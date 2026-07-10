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
    ScreenContentWrapper: ({ children, ...props }) =>
      React.createElement(
        View,
        { testID: 'screen-content', ...props },
        children,
      ),
    ScreenContainer: ({ children, ...props }) =>
      React.createElement(
        View,
        { testID: 'screen-container', ...props },
        children,
      ),
  };
});

// El mock oficial de reanimated importa react-native-worklets, que necesita
// el módulo nativo: mock manual mínimo con la API que usa el paquete.
jest.mock('react-native-screens/experimental', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }) =>
      React.createElement(View, { testID: 'safe-area', ...props }, children),
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (styleFactory) => styleFactory(),
    withTiming: (value) => value,
  };
});
