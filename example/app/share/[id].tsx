import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from '@authuser/react-native-routing';

export default function Share() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share {id}</Text>
      <Text>Abierto vía deep link</Text>
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
});
