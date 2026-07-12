import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from '@authuser/react-native-routing';
import type { ScreenMetadata } from '@authuser/react-native-routing';
import { setSession } from '../../auth';

export const metadata: ScreenMetadata = {
  title: 'Login',
  headerShown: false,
};

export default function Login() {
  const router = useRouter();
  const login = () => {
    setSession(true);
    router.replace('/profile');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text>El perfil requiere sesión</Text>
      <TextInput style={styles.input} placeholder="Email" />
      <Pressable style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Entrar</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#c7c7c7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 260,
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
