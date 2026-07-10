import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { NavigationEntry } from './reducer';

export interface StackScreenOptions {
  title?: string;
  presentation?: 'push' | 'modal' | 'transparentModal' | 'formSheet';
  contentStyle?: StyleProp<ViewStyle>;
}

export interface StackScreenProps {
  name: string;
  options?: StackScreenOptions;
}

// Declarativo: no pinta nada, Stack lee sus props vía collectScreenConfigs.
export function StackScreen(_props: StackScreenProps): null {
  return null;
}

export function screenNameForEntry(
  entry: NavigationEntry,
  layoutDepth: number,
): string {
  return entry.match.chain[layoutDepth + 1]?.segment ?? 'index';
}

export function collectScreenConfigs(
  children: ReactNode,
): Record<string, StackScreenOptions> {
  const configs: Record<string, StackScreenOptions> = {};
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === StackScreen) {
      const { name, options } = child.props as StackScreenProps;
      configs[name] = options ?? {};
    }
  });
  return configs;
}

export function createBackPressHandler(
  getStackDepth: () => number,
  back: () => void,
): () => boolean {
  return () => {
    if (getStackDepth() > 1) {
      back();
      return true;
    }
    return false;
  };
}
