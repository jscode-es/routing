import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from '@jscode/react-native-routing';

export default function User() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User {id}</Text>
      {/* Botón temporal: en la Fase 4 lo sustituye el back nativo del Stack */}
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Volver</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
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
