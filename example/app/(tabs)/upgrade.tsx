import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@jscode/react-native-routing';
import type { ScreenMetadata } from '@jscode/react-native-routing';
import { setPremium } from '../../auth';

export const metadata: ScreenMetadata = {
  title: 'Mejorar',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>🔒</Text>
    ),
  },
};

export default function Upgrade() {
  const router = useRouter();
  const subscribe = () => {
    setPremium(true);
    router.replace('/premium');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Hazte premium</Text>
      <Text>Desbloquea la pestaña Premium</Text>
      <Pressable style={styles.button} onPress={subscribe}>
        <Text style={styles.buttonText}>Suscribirme</Text>
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
    fontSize: 28,
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
