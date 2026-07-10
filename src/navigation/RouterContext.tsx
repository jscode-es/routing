import React, { createContext, useContext } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { RouteNode } from '../route-tree/types';
import type { NavigationEntry } from './reducer';
import type { Router } from './router';

export interface RouterState {
  tree: RouteNode;
  stack: NavigationEntry[];
  activeEntry: NavigationEntry;
}

export const RouterStateContext = createContext<RouterState | null>(null);

export const RouterApiContext = createContext<Router | null>(null);

// Entrada del stack a la que pertenece el subárbol (pantallas en background
// conservan sus propios params aunque activeEntry haya cambiado).
export const EntryContext = createContext<NavigationEntry | null>(null);

// Interno: cambia de pestaña sin apilar historial (SET_ACTIVE_TAB).
export const TabSwitchContext = createContext<((href: string) => void) | null>(
  null,
);

export const DepthContext = createContext(0);

export const SlotContext = createContext<ReactNode>(null);

export function useRouterState(): RouterState {
  const state = useContext(RouterStateContext);
  if (!state) {
    throw new Error(
      'No router found. Wrap your app in <RootRouter> before using routing components or hooks.',
    );
  }
  return state;
}

export function RouteLevel({
  chain,
  index,
}: {
  chain: RouteNode[];
  index: number;
}): React.JSX.Element | null {
  const node = chain[index];
  if (!node) return null;

  const isLeaf = index === chain.length - 1;
  const Component = node.component as ComponentType | undefined;
  const inner = isLeaf ? (
    Component ? (
      <Component />
    ) : null
  ) : (
    <RouteLevel chain={chain} index={index + 1} />
  );

  let body = inner;
  if (node.layout) {
    const Layout = node.layout as ComponentType;
    body = (
      <SlotContext.Provider value={inner}>
        <Layout />
      </SlotContext.Provider>
    );
  }

  return <DepthContext.Provider value={index}>{body}</DepthContext.Provider>;
}

export function EntrySubtree({
  entry,
  layoutDepth,
}: {
  entry: NavigationEntry;
  layoutDepth: number;
}): React.JSX.Element | null {
  const { chain } = entry.match;
  // Ruta index: la hoja es el propio nodo del layout, no hay nivel inferior.
  if (layoutDepth === chain.length - 1) {
    const Component = chain[layoutDepth]?.component as
      | ComponentType
      | undefined;
    return Component ? <Component /> : null;
  }
  return <RouteLevel chain={chain} index={layoutDepth + 1} />;
}
