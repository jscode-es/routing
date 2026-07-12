import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  GenerateMetadata,
  PageProps,
} from '@authuser/react-native-routing';

export const generateMetadata: GenerateMetadata = ({ params }) => ({
  title: `Usuario ${String(params.id)}`,
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
