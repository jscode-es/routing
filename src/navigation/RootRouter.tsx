import React, { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { buildRouteTree } from '../route-tree/context';
import type { RequireContext } from '../route-tree/context';
import { NavigationProvider } from './NavigationContext';

export interface RootRouterProps {
  context: RequireContext;
  initialPath?: string;
}

const rootStyle = { flex: 1 } as const;

export function RootRouter({
  context,
  initialPath = '/',
}: RootRouterProps): React.JSX.Element {
  const tree = useMemo(() => buildRouteTree(context), [context]);

  return (
    <GestureHandlerRootView style={rootStyle}>
      <NavigationProvider tree={tree} initialPath={initialPath} />
    </GestureHandlerRootView>
  );
}
