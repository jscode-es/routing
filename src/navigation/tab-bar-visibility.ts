import { createContext, useContext, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';
import { useReduceMotionEnabled } from './accessibility';

// Progreso de ocultación de la tabbar (0 = visible, 1 = oculta), compartido
// por Tabs con cualquier pantalla descendiente vía useHideTabBarOnScroll.
export const TabBarVisibilityContext =
  createContext<SharedValue<number> | null>(null);

const HIDE_DISTANCE = 24;
const DURATION = 200;

export interface TabBarScrollHandlers {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// Oculta la tabbar tras un scroll hacia abajo sostenido (más de
// HIDE_DISTANCE px); cualquier scroll hacia arriba, o volver al offset 0,
// la muestra de inmediato. Sin un <Tabs> ancestro, onScroll es un no-op.
export function useHideTabBarOnScroll(): TabBarScrollHandlers {
  const progress = useContext(TabBarVisibilityContext);
  const reduceMotion = useReduceMotionEnabled();
  const duration = reduceMotion ? 0 : DURATION;
  const lastOffset = useRef(0);
  const downDistance = useRef(0);
  return {
    onScroll(event) {
      if (!progress) return;
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const delta = y - lastOffset.current;
      lastOffset.current = y;
      if (y === 0 || delta < 0) {
        downDistance.current = 0;
        // reanimated SharedValue: mutar .value es la API soportada para
        // pilotar la animación desde fuera del árbol de Tabs.
        // eslint-disable-next-line react-hooks/immutability
        progress.value = withTiming(0, { duration });
        return;
      }
      downDistance.current += delta;
      if (downDistance.current > HIDE_DISTANCE) {
        progress.value = withTiming(1, { duration });
      }
    },
  };
}
