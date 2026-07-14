import React from 'react';
import type { ReactNode } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import type { BlurEffectTypes } from 'react-native-screens';
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
  headerStyle?: { backgroundColor?: ColorValue };
  // Color de icono de back, texto de back (iOS) y título.
  headerTintColor?: ColorValue;
  // Sombra/borde inferior del header nativo. Por defecto true.
  headerShadowVisible?: boolean;
  // Fondo transparente + translúcido; combínalo con headerBlurEffect (iOS)
  // o con headerStyle.backgroundColor semitransparente para un navbar OTT.
  headerTransparent?: boolean;
  headerBlurEffect?: BlurEffectTypes;
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
