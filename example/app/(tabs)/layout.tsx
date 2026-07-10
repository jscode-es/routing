import React from 'react';
import { Text } from 'react-native';
import { Tabs } from '@jscode/react-native-routing';

export default function TabsLayout() {
  return (
    <Tabs animation="fade">
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          icon: ({ focused, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>
              🏠
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          icon: ({ focused, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>
              👤
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          icon: ({ focused, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>
              ⚙️
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
