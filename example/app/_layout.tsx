import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot } from '@jscode/react-native-routing';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
