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
      <Stack.Screen name="users" options={{ title: 'Usuario' }} />
      <Stack.Screen
        name="modal"
        options={{
          title: 'Modal',
          presentation: 'modal',
          headerShown: false,
          safeArea: false,
          orientation: 'landscape',
          contentStyle: { backgroundColor: '#111' },
        }}
      />
      <Stack.Screen
        name="not-found"
        options={{ title: 'No encontrado', animation: 'none' }}
      />
    </Stack>
  );
}
