import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from '@jscode/react-native-routing';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Link href="/users/42" style={styles.link}>
        Ir al usuario 42
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 18,
    color: '#0a7ea4',
  },
});
