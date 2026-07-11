import type { RouteNode, RouteType } from './types';

const FILE_RE = /\.[jt]sx?$/;
const DYNAMIC_RE = /^\[(?!\.\.\.)(.+)\]$/;
const CATCH_ALL_RE = /^\[\.\.\.(.+)\]$/;
const GROUP_RE = /^\(.+\)$/;

function segmentType(segment: string): RouteType {
  if (CATCH_ALL_RE.test(segment)) return 'catchAll';
  if (DYNAMIC_RE.test(segment)) return 'dynamic';
  if (GROUP_RE.test(segment)) return 'group';
  return 'static';
}

function paramName(segment: string): string | undefined {
  const catchAll = CATCH_ALL_RE.exec(segment);
  if (catchAll) return catchAll[1];
  const dynamic = DYNAMIC_RE.exec(segment);
  if (dynamic) return dynamic[1];
  return undefined;
}

function makeNode<C>(segment: string): RouteNode<C> {
  const type = segmentType(segment);
  const param = paramName(segment);
  return {
    segment,
    type,
    ...(param !== undefined ? { paramName: param } : {}),
    children: [],
  };
}

function childFolder<C>(node: RouteNode<C>, segment: string): RouteNode<C> {
  let found = node.children.find((c) => c.segment === segment);
  if (!found) {
    found = makeNode<C>(segment);
    node.children.push(found);
  }
  return found;
}

export interface RouteModuleMeta {
  metadata?: unknown;
  generateMetadata?: unknown;
}

function attachMeta<C>(
  node: RouteNode<C>,
  key: string,
  resolveMeta?: (key: string) => RouteModuleMeta,
): void {
  if (!resolveMeta) return;
  const meta = resolveMeta(key);
  if (meta.metadata !== undefined) node.metadata = meta.metadata;
  if (meta.generateMetadata !== undefined) {
    node.generateMetadata = meta.generateMetadata;
  }
}

export function parse<C>(
  keys: readonly string[],
  resolve: (key: string) => C,
  resolveMeta?: (key: string) => RouteModuleMeta,
): RouteNode<C> {
  const root = makeNode<C>('');

  for (const key of keys) {
    const relative = key.replace(/^\.\//, '');
    if (!FILE_RE.test(relative)) continue;

    const segments = relative.replace(FILE_RE, '').split('/');
    const fileName = segments.pop() as string;

    let node = root;
    for (const segment of segments) {
      node = childFolder(node, segment);
    }

    if (fileName === 'layout') {
      node.layout = resolve(key);
    } else if (fileName === 'not-found') {
      node.notFound = resolve(key);
    } else if (fileName === 'index') {
      if (node.component !== undefined) {
        throw new Error(
          `Conflicting routes: "${key}" collides with an existing route for "${node.segment || '/'}"`,
        );
      }
      node.component = resolve(key);
      attachMeta(node, key, resolveMeta);
    } else {
      const leaf = childFolder(node, fileName);
      if (leaf.component !== undefined) {
        throw new Error(
          `Conflicting routes: "${key}" collides with an existing route for "${leaf.segment}"`,
        );
      }
      leaf.component = resolve(key);
      attachMeta(leaf, key, resolveMeta);
    }
  }

  return root;
}
