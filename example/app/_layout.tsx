import React from 'react';
import { Stack } from '@jscode/react-native-routing';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ title: 'Routing Example' }} />
      <Stack.Screen name="(auth)" options={{ title: 'Login' }} />
      <Stack.Screen name="users" options={{ title: 'Usuario' }} />
      <Stack.Screen
        name="modal"
        options={{ title: 'Modal', presentation: 'modal' }}
      />
    </Stack>
  );
}
