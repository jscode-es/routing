import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouterState } from './RouterContext';
import { useRouter, usePathname } from './hooks';

// Pantalla 404 por defecto cuando la app no define app/not-found.tsx.
export function DefaultNotFound(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { stack } = useRouterState();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.message}>This screen does not exist.</Text>
      <Text style={styles.path}>{pathname}</Text>
      {stack.length > 1 && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
  },
  path: {
    fontSize: 14,
    color: '#8e8e93',
    fontFamily: 'monospace',
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
