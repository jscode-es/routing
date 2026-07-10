import React from 'react';
import { Tabs } from '@jscode/react-native-routing';

export default function TabsLayout() {
  return (
    <Tabs animation="fade">
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
