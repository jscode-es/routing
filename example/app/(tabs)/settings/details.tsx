import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePathname } from '@jscode/react-native-routing';
import type { ScreenMetadata } from '@jscode/react-native-routing';

export const metadata: ScreenMetadata = { title: 'Detalle de ajustes' };

export default function SettingsDetails() {
  const pathname = usePathname();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle</Text>
      <Text>pathname: {pathname}</Text>
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
});
