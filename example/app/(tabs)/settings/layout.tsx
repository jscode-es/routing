import React from 'react';
import { Stack } from '@jscode/react-native-routing';

export default function SettingsLayout() {
  return (
    <Stack>
      {/* index toma su título del metadata de la página */}
      <Stack.Screen name="details" options={{ title: 'Detalle de ajustes' }} />
    </Stack>
  );
}
