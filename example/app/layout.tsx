import { Stack } from '@jscode/react-native-routing';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ title: 'Routing Example', headerShown: false }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ title: 'Login', headerShown: false }}
      />
      {/* users y modal declaran sus opciones vía metadata en la página */}
      <Stack.Screen
        name="not-found"
        options={{ title: 'No encontrado', animation: 'none' }}
      />
    </Stack>
  );
}
