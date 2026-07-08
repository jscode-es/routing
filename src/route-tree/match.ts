import type { RouteMatch, RouteNode, RouteParams } from './types';

// Parseo propio del pathname: el global `URL` no está garantizado en todas
// las versiones de React Native/Hermes.
function toSegments(pathname: string): string[] {
  return pathname.split('/').filter((s) => s.length > 0);
}

interface Candidate<C> {
  node: RouteNode<C>;
  params: RouteParams;
  chain: RouteNode<C>[];
}

function matchNode<C>(
  node: RouteNode<C>,
  segments: string[],
  params: RouteParams,
  chain: RouteNode<C>[],
): Candidate<C> | null {
  if (segments.length === 0) {
    if (node.component !== undefined) {
      return { node, params, chain: [...chain, node] };
    }
    // Los grupos no consumen segmento: un index puede vivir más adentro.
    return matchChildren(node, segments, params, chain);
  }
  return matchChildren(node, segments, params, chain);
}

function matchChildren<C>(
  node: RouteNode<C>,
  segments: string[],
  params: RouteParams,
  chain: RouteNode<C>[],
): Candidate<C> | null {
  const nextChain = [...chain, node];
  const [head, ...rest] = segments;

  // 1. Estáticas primero (prioridad estático > dinámico > catch-all).
  if (head !== undefined) {
    for (const child of node.children) {
      if (child.type === 'static' && child.segment === head) {
        const result = matchNode(child, rest, params, nextChain);
        if (result) return result;
      }
    }
  }

  // 2. Grupos: transparentes, no consumen segmento.
  for (const child of node.children) {
    if (child.type === 'group') {
      const result = matchNode(child, segments, params, nextChain);
      if (result) return result;
    }
  }

  if (head === undefined) return null;

  // 3. Dinámicas.
  for (const child of node.children) {
    if (child.type === 'dynamic' && child.paramName) {
      const result = matchNode(
        child,
        rest,
        { ...params, [child.paramName]: head },
        nextChain,
      );
      if (result) return result;
    }
  }

  // 4. Catch-all: consume todos los segmentos restantes (mínimo uno).
  for (const child of node.children) {
    if (child.type === 'catchAll' && child.paramName) {
      if (child.component !== undefined) {
        return {
          node: child,
          params: { ...params, [child.paramName]: segments },
          chain: [...nextChain, child],
        };
      }
    }
  }

  return null;
}

export function matchPath<C>(
  tree: RouteNode<C>,
  pathname: string,
): RouteMatch<C> | null {
  const segments = toSegments(pathname);

  if (segments.length === 0) {
    if (tree.component !== undefined) {
      return { node: tree, params: {}, chain: [tree] };
    }
    const result = matchChildren(tree, [], {}, []);
    return result ?? null;
  }

  return matchNode(tree, segments, {}, []);
}
