import React, { useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { buildRouteTree } from '../route-tree/context';
import type { RequireContext } from '../route-tree/context';
import { matchPath } from '../route-tree/match';
import { RouteLevel, RouterStateContext } from './RouterContext';

export interface RootRouterProps {
  context: RequireContext;
  initialPath?: string;
}

export function RootRouter({
  context,
  initialPath = '/',
}: RootRouterProps): React.JSX.Element {
  const tree = useMemo(() => buildRouteTree(context), [context]);
  const [pathname] = useState(initialPath);
  const match = useMemo(() => matchPath(tree, pathname), [tree, pathname]);
  const state = useMemo(
    () => ({ tree, pathname, match }),
    [tree, pathname, match],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RouterStateContext.Provider value={state}>
        {match ? <RouteLevel chain={match.chain} index={0} /> : null}
      </RouterStateContext.Provider>
    </GestureHandlerRootView>
  );
}
