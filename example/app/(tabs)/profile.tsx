import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, usePathname } from '@jscode/react-native-routing';
import type { ScreenMetadata } from '@jscode/react-native-routing';
import { setSession, useSession } from '../../auth';

export const metadata: ScreenMetadata = {
  title: 'Perfil',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>👤</Text>
    ),
  },
};

export default function Profile() {
  const session = useSession();
  const pathname = usePathname();
  if (!session) return <Redirect href="/login" />;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text>pathname: {pathname}</Text>
      <Text>Sesión iniciada</Text>
      <Pressable style={styles.button} onPress={() => setSession(false)}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
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
