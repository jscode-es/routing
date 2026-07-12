import React, { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { buildRouteTree } from '../route-tree/context';
import type { RequireContext } from '../route-tree/context';
import { getAppContext } from '../route-tree/app-context';
import { formatRouteTree } from '../route-tree/format';
import { logDev } from './dev';
import { NavigationProvider } from './NavigationContext';

export interface RootRouterProps {
  context?: RequireContext;
  initialPath?: string;
  // Solo desarrollo: imprime el árbol de rutas descubierto en la terminal
  // de Metro al montar y al reevaluarse con Fast Refresh.
  logRoutes?: boolean;
}

const rootStyle = { flex: 1 } as const;

export function RootRouter({
  context,
  initialPath = '/',
  logRoutes = true,
}: RootRouterProps): React.JSX.Element {
  const tree = useMemo(() => {
    const ctx = context ?? getAppContext();
    if (!ctx) {
      throw new Error(
        'RootRouter has no route context. Add "@authuser/react-native-routing/babel" ' +
          'to the plugins of babel.config.js (routes are read from ./app), or pass ' +
          "the context prop: <RootRouter context={require.context('./app', true, /\\.[jt]sx?$/)} />",
      );
    }
    return buildRouteTree(ctx);
  }, [context]);

  useEffect(() => {
    if (!logRoutes) return;
    logDev(formatRouteTree(tree));
  }, [tree, logRoutes]);

  return (
    <GestureHandlerRootView style={rootStyle}>
      <NavigationProvider tree={tree} initialPath={initialPath} />
    </GestureHandlerRootView>
  );
}
