import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { matchNotFound, matchPath } from '../route-tree/match';
import type { RouteNode } from '../route-tree/types';
import { createEntry, reducer } from './reducer';
import type { NavigationState } from './reducer';
import {
  RouteLevel,
  RouterApiContext,
  RouterStateContext,
  TabSwitchContext,
} from './RouterContext';
import { setActiveRouter } from './router';
import type { Router } from './router';

function initialState(tree: RouteNode, initialPath: string): NavigationState {
  const match = matchPath(tree, initialPath) ?? matchNotFound(tree);
  return { stack: match ? [createEntry(initialPath, match)] : [] };
}

export function NavigationProvider({
  tree,
  initialPath,
}: {
  tree: RouteNode;
  initialPath: string;
}): React.JSX.Element | null {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => initialState(tree, initialPath),
  );

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const api = useMemo<Router>(() => {
    const resolve = (href: string) => {
      const match = matchPath(tree, href) ?? matchNotFound(tree);
      if (!match) {
        throw new Error(`No route matches "${href}"`);
      }
      return createEntry(href, match);
    };
    return {
      push: (href) => dispatch({ type: 'PUSH', entry: resolve(href) }),
      replace: (href) => dispatch({ type: 'REPLACE', entry: resolve(href) }),
      back: () => dispatch({ type: 'POP' }),
      setParams: (params) => {
        const top = stateRef.current.stack[stateRef.current.stack.length - 1];
        if (!top) return;
        dispatch({ type: 'SET_PARAMS', key: top.key, params });
      },
    };
  }, [tree]);

  useEffect(() => {
    setActiveRouter(api);
    return () => setActiveRouter(null);
  }, [api]);

  const switchTab = useCallback(
    (href: string) => {
      const match = matchPath(tree, href);
      if (!match) {
        throw new Error(`No route matches "${href}"`);
      }
      dispatch({ type: 'SET_ACTIVE_TAB', entry: createEntry(href, match) });
    },
    [tree],
  );

  const activeEntry = state.stack[state.stack.length - 1];
  const routerState = useMemo(
    () => (activeEntry ? { tree, stack: state.stack, activeEntry } : null),
    [tree, state.stack, activeEntry],
  );

  if (!routerState) return null;

  return (
    <RouterApiContext.Provider value={api}>
      <TabSwitchContext.Provider value={switchTab}>
        <RouterStateContext.Provider value={routerState}>
          <RouteLevel chain={routerState.activeEntry.match.chain} index={0} />
        </RouterStateContext.Provider>
      </TabSwitchContext.Provider>
    </RouterApiContext.Provider>
  );
}
