import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@jscode/react-native-routing';
import type { ScreenMetadata } from '@jscode/react-native-routing';
import { setPremium } from '../../auth';

export const metadata: ScreenMetadata = {
  title: 'Premium',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>⭐</Text>
    ),
  },
};

export default function Premium() {
  const router = useRouter();
  const cancel = () => {
    setPremium(false);
    router.replace('/upgrade');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⭐ Premium</Text>
      <Text>Contenido exclusivo para suscriptores</Text>
      <Pressable style={styles.button} onPress={cancel}>
        <Text style={styles.buttonText}>Cancelar suscripción</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#c0392b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
