import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@jscode/react-native-routing';

export default function Modal() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal OTT</Text>
      <Text style={styles.subtitle}>
        Sin header y sin safe area: el contenido llega hasta el borde
        superior, debajo del reloj.
      </Text>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Cerrar</Text>
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    color: '#bbb',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
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
