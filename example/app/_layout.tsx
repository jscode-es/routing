import React from 'react';
import { Stack } from '@jscode/react-native-routing';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Inicio' }} />
      <Stack.Screen name="users" options={{ title: 'Usuario' }} />
      <Stack.Screen
        name="modal"
        options={{ title: 'Modal', presentation: 'modal' }}
      />
    </Stack>
  );
}
