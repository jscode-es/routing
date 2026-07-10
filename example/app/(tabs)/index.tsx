import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from '@jscode/react-native-routing';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe algo y cambia de tab"
      />
      <Link href="/users/42" style={styles.link}>
        Ir al usuario 42
      </Link>
      <Link href="/modal" style={styles.link}>
        Abrir modal
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
  input: {
    borderWidth: 1,
    borderColor: '#c7c7c7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 260,
  },
  link: {
    fontSize: 18,
    color: '#0a7ea4',
  },
});
