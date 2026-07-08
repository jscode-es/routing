import { useContext } from 'react';
import type { RouteParams } from '../route-tree/types';
import {
  DepthContext,
  RouterApiContext,
  useRouterState,
} from './RouterContext';
import type { Router } from './router';

export function useRouter(): Router {
  const api = useContext(RouterApiContext);
  if (!api) {
    throw new Error(
      'No router found. Wrap your app in <RootRouter> before using useRouter().',
    );
  }
  return api;
}

export function useGlobalSearchParams<
  T extends RouteParams = RouteParams,
>(): T {
  const { activeEntry } = useRouterState();
  return activeEntry.match.params as T;
}

export function useLocalSearchParams<T extends RouteParams = RouteParams>(): T {
  const { activeEntry } = useRouterState();
  const depth = useContext(DepthContext);
  const { chain } = activeEntry.match;
  const params: RouteParams = {};
  for (let i = 0; i <= depth && i < chain.length; i++) {
    const node = chain[i];
    if (node?.paramName !== undefined) {
      const value = activeEntry.match.params[node.paramName];
      if (value !== undefined) params[node.paramName] = value;
    }
  }
  return params as T;
}

export function usePathname(): string {
  const { activeEntry } = useRouterState();
  return activeEntry.pathname;
}

export function useSegments(): string[] {
  const { activeEntry } = useRouterState();
  return activeEntry.match.chain
    .map((node) => node.segment)
    .filter((segment) => segment !== '');
}
