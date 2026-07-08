import React from 'react';
import { RootRouter } from '@jscode/react-native-routing';

export default function App() {
  return <RootRouter context={require.context('./app', true, /\.[jt]sx?$/)} />;
}
