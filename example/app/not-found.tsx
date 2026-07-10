import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@jscode/react-native-routing';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text>Esta pantalla no existe</Text>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Volver</Text>
      </Pressable>
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
    fontSize: 48,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
