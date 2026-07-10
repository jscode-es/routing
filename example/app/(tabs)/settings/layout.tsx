import React from 'react';
import { Stack } from '@jscode/react-native-routing';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="details" options={{ title: 'Detalle de ajustes' }} />
    </Stack>
  );
}
