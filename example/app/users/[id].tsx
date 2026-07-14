import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  GenerateMetadata,
  PageProps,
} from '@authuser/react-native-routing';

// Header transparente/translúcido con tinte propio: demuestra
// headerTransparent + headerStyle + headerTintColor. El contenido lleva su
// propio fondo oscuro y padding superior porque el header flota encima sin
// reservar espacio.
export const generateMetadata: GenerateMetadata = ({ params }) => ({
  title: `Usuario ${String(params.id)}`,
  headerTransparent: true,
  headerStyle: { backgroundColor: 'rgba(10,126,164,0.55)' },
  headerTintColor: '#ffffff',
  headerBlurEffect: 'dark',
});

export default function User({ params }: PageProps<{ id: string }>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User {params.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
