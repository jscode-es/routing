import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Interno: gatea la duración de las animaciones de Tabs (indicador, fade,
// ocultar/mostrar tabbar con scroll).
export function useReduceMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}

// Público: para que la app adapte su propia UI a un lector de pantalla
// activo (p. ej. desactivar el auto-hide del tabbar con scroll).
export function useScreenReaderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}
