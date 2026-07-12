import { parse } from './parse';
import type { RouteNode } from './types';

export interface RequireContext {
  (key: string): {
    default?: unknown;
    metadata?: unknown;
    generateMetadata?: unknown;
    navigator?: unknown;
  };
  keys(): string[];
}

export function buildRouteTree(ctx: RequireContext): RouteNode {
  return parse(
    ctx.keys(),
    (key) => ctx(key).default,
    (key) => {
      const { metadata, generateMetadata, navigator } = ctx(key);
      return { metadata, generateMetadata, navigator };
    },
  );
}
