import { useEffect } from 'react';
import { Linking } from 'react-native';
import type { Router } from './router';

// Parseo propio (sin URL global, no garantizado en Hermes). Para esquemas
// propios (routingexample://share/42) el "host" es el primer segmento.
export function urlToPath(url: string): string {
  const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const withoutQuery = withoutScheme.split(/[?#]/, 1)[0] ?? '';
  const trimmed = withoutQuery.replace(/\/+$/, '');
  return trimmed.length > 0 ? `/${trimmed}` : '/';
}

export function useDeepLinks(router: Router): void {
  useEffect(() => {
    let cancelled = false;
    Linking.getInitialURL().then(
      (url) => {
        // replace: al abrir en frío desde un enlace no hay historial previo.
        if (url && !cancelled) router.replace(urlToPath(url));
      },
      () => {},
    );
    const subscription = Linking.addEventListener('url', ({ url }) => {
      router.push(urlToPath(url));
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [router]);
}
