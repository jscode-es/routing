import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { NavigationEntry } from './reducer';

export type ScreenOrientation =
  | 'default'
  | 'all'
  | 'portrait'
  | 'portrait_up'
  | 'portrait_down'
  | 'landscape'
  | 'landscape_left'
  | 'landscape_right';

export type StackAnimation =
  | 'default'
  | 'fade'
  | 'fade_from_bottom'
  | 'flip'
  | 'none'
  | 'simple_push'
  | 'slide_from_bottom'
  | 'slide_from_right'
  | 'slide_from_left';

export interface StackScreenOptions {
  title?: string;
  presentation?: 'push' | 'modal' | 'transparentModal' | 'formSheet';
  animation?: StackAnimation;
  orientation?: ScreenOrientation;
  contentStyle?: StyleProp<ViewStyle>;
  headerShown?: boolean;
  // Solo aplica con headerShown: false (con header, el inset superior lo
  // gestiona el propio header nativo). false = contenido a sangre bajo la
  // barra de estado (full-bleed, estilo OTT).
  safeArea?: boolean;
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
