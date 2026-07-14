import React from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useHideTabBarOnScroll } from '@authuser/react-native-routing';
import type { ScreenMetadata } from '@authuser/react-native-routing';

export const metadata: ScreenMetadata = {
  title: 'Home',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>🏠</Text>
    ),
    // Label más descriptivo que el título visual para lectores de
    // pantalla; cae a title si se omite.
    accessibilityLabel: 'Inicio, pantalla principal',
  },
};

const ROWS = Array.from({ length: 40 }, (_, i) => `Fila ${i + 1}`);

function ListHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Home</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe algo y cambia de tab"
      />
      <Link href="/users/42" style={styles.link}>
        Ir al usuario 42 (header transparente/tintado)
      </Link>
      <Link href="/modal" style={styles.link}>
        Abrir modal
      </Link>
      <Link href="/no-existe" style={styles.link}>
        Link roto (not-found)
      </Link>
      <Text style={styles.hint}>
        Baja la lista para ocultar el tabbar; sube (o vuelve arriba) para
        mostrarlo de nuevo.
      </Text>
    </View>
  );
}

// useHideTabBarOnScroll conecta esta lista con la barra de <Tabs>: oculta
// la barra con un scroll hacia abajo sostenido y la muestra al instante al
// scrollear hacia arriba o volver al principio.
export default function Home() {
  const { onScroll } = useHideTabBarOnScroll();
  return (
    <FlatList
      style={styles.container}
      data={ROWS}
      keyExtractor={(row) => row}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text>{item}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
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
  hint: {
    color: '#8e8e93',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
});
