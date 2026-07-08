import React from 'react';
import { StyleSheet, Text } from 'react-native';

export default function Home() {
  return <Text style={styles.title}>Home</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
