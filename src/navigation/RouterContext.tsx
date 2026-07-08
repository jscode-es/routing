import React, { createContext, useContext } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { RouteMatch, RouteNode } from '../route-tree/types';

export interface RouterState {
  tree: RouteNode;
  pathname: string;
  match: RouteMatch | null;
}

export const RouterStateContext = createContext<RouterState | null>(null);

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
  const content = isLeaf ? (
    Component ? (
      <Component />
    ) : null
  ) : (
    <RouteLevel chain={chain} index={index + 1} />
  );

  if (node.layout) {
    const Layout = node.layout as ComponentType;
    return (
      <SlotContext.Provider value={content}>
        <Layout />
      </SlotContext.Provider>
    );
  }
  return content;
}
