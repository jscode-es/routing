import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from '@jscode/react-native-routing';
import type { GenerateMetadata } from '@jscode/react-native-routing';

export const generateMetadata: GenerateMetadata = ({ params }) => ({
  title: `Usuario ${String(params.id)}`,
});

export default function User() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
