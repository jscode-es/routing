import React from 'react';
import { Pressable, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { useRouter } from './hooks';

export interface LinkProps {
  href: string;
  replace?: boolean;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function Link({
  href,
  replace = false,
  children,
  style,
}: LinkProps): React.JSX.Element {
  const router = useRouter();
  const navigate = () => {
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };
  return (
    <Pressable accessibilityRole="link" onPress={navigate}>
      <Text style={style}>{children}</Text>
    </Pressable>
  );
}
