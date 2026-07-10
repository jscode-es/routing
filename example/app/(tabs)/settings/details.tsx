import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePathname } from '@jscode/react-native-routing';

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
