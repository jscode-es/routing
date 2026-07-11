import React, { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { buildRouteTree } from '../route-tree/context';
import type { RequireContext } from '../route-tree/context';
import { getAppContext } from '../route-tree/app-context';
import { NavigationProvider } from './NavigationContext';

export interface RootRouterProps {
  context?: RequireContext;
  initialPath?: string;
}

const rootStyle = { flex: 1 } as const;

export function RootRouter({
  context,
  initialPath = '/',
}: RootRouterProps): React.JSX.Element {
  const tree = useMemo(() => {
    const ctx = context ?? getAppContext();
    if (!ctx) {
      throw new Error(
        'RootRouter has no route context. Add "@jscode/react-native-routing/babel" ' +
          'to the plugins of babel.config.js (routes are read from ./app), or pass ' +
          "the context prop: <RootRouter context={require.context('./app', true, /\\.[jt]sx?$/)} />",
      );
    }
    return buildRouteTree(ctx);
  }, [context]);

  return (
    <GestureHandlerRootView style={rootStyle}>
      <NavigationProvider tree={tree} initialPath={initialPath} />
    </GestureHandlerRootView>
  );
}
