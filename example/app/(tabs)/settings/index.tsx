import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from '@authuser/react-native-routing';
import type { ScreenMetadata } from '@authuser/react-native-routing';

// title alimenta a la vez la pestaña y el header del sub-stack; el icono
// de la pestaña de una carpeta sale del metadata de su index.
export const metadata: ScreenMetadata = {
  title: 'Ajustes',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>⚙️</Text>
    ),
  },
};

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Link href="/settings/details" style={styles.link}>
        Ir al detalle (sub-stack)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 18,
    color: '#0a7ea4',
  },
});
