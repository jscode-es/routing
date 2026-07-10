import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, usePathname } from '@jscode/react-native-routing';

export default function Profile() {
  const pathname = usePathname();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text>pathname: {pathname}</Text>
      <Link href="/login" style={styles.link}>
        Ir a login
      </Link>
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
  link: {
    fontSize: 18,
    color: '#0a7ea4',
  },
});
