import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from '@jscode/react-native-routing';

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
