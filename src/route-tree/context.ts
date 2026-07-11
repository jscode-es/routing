import { parse } from './parse';
import type { RouteNode } from './types';

export interface RequireContext {
  (key: string): {
    default?: unknown;
    metadata?: unknown;
    generateMetadata?: unknown;
  };
  keys(): string[];
}

export function buildRouteTree(ctx: RequireContext): RouteNode {
  return parse(
    ctx.keys(),
    (key) => {
      const component = ctx(key).default;
      if (component === undefined) {
        throw new Error(
          `Route file "${key}" has no default export. Every route file must export its screen component as default.`,
        );
      }
      return component;
    },
    (key) => {
      const { metadata, generateMetadata } = ctx(key);
      return { metadata, generateMetadata };
    },
  );
}
