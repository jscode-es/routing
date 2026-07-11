import { hasImplicitStack } from './implicit';
import type { RouteNode } from './types';

interface Row {
  tree: string;
  info: string;
  note: string;
}

function isFolder(node: RouteNode): boolean {
  return (
    node.children.length > 0 ||
    node.layout !== undefined ||
    node.navigator !== undefined
  );
}

function navigatorLabel(node: RouteNode, isRoot = false): string {
  const type =
    typeof node.navigator === 'object' && node.navigator !== null
      ? (node.navigator as { type?: unknown }).type
      : undefined;
  if (type === 'tabs') return 'Tabs';
  if (type === 'stack') return 'Stack';
  if (type === 'slot') return 'Slot';
  if (node.layout !== undefined) return 'layout manual';
  if (hasImplicitStack(node, isRoot)) return 'Stack (implícito)';
  return '';
}

function titleOf(node: RouteNode): string | undefined {
  const meta = node.metadata;
  if (typeof meta === 'object' && meta !== null && !Array.isArray(meta)) {
    const title = (meta as { title?: unknown }).title;
    if (typeof title === 'string') return title;
  }
  return undefined;
}

function urlSegment(node: RouteNode): string {
  if (node.type === 'dynamic') return `:${node.paramName}`;
  if (node.type === 'catchAll') return '*';
  return node.segment;
}

function typeMark(node: RouteNode): string {
  if (node.type === 'dynamic') return '(dinámica)';
  if (node.type === 'catchAll') return '(catch-all)';
  return '';
}

function noteFor(node: RouteNode): string {
  const title = titleOf(node);
  return title !== undefined ? `"${title}"` : typeMark(node);
}

export function formatRouteTree(tree: RouteNode): string {
  const rows: Row[] = [];
  let routeCount = 0;

  const pushPage = (
    treeText: string,
    segments: string[],
    node: RouteNode,
  ): void => {
    routeCount += 1;
    rows.push({
      tree: treeText,
      info: `/${segments.join('/')}`,
      note: noteFor(node),
    });
  };

  const walk = (node: RouteNode, prefix: string, segments: string[]): void => {
    interface Item {
      kind: 'index' | 'child' | 'notFound';
      child?: RouteNode;
    }
    const items: Item[] = [];
    if (node.component !== undefined) items.push({ kind: 'index' });
    for (const child of node.children) items.push({ kind: 'child', child });
    if (node === tree) items.push({ kind: 'notFound' });

    items.forEach((item, i) => {
      const last = i === items.length - 1;
      const branch = last ? '└── ' : '├── ';
      const childPrefix = prefix + (last ? '    ' : '│   ');

      if (item.kind === 'index') {
        pushPage(`${prefix}${branch}index`, segments, node);
      } else if (item.kind === 'notFound') {
        rows.push({
          tree: `${prefix}${branch}not-found`,
          info:
            tree.notFound !== undefined ? '404' : '404 (default del paquete)',
          note: '',
        });
      } else if (item.child) {
        const child = item.child;
        const nextSegments =
          child.type === 'group' ? segments : [...segments, urlSegment(child)];
        if (isFolder(child)) {
          rows.push({
            tree: `${prefix}${branch}${child.segment}/`,
            info: navigatorLabel(child),
            note: '',
          });
          walk(child, childPrefix, nextSegments);
        } else {
          pushPage(`${prefix}${branch}${child.segment}`, nextSegments, child);
        }
      }
    });
  };

  rows.push({ tree: 'app/', info: navigatorLabel(tree, true), note: '' });
  walk(tree, '', []);

  const treeWidth = Math.max(...rows.map((row) => row.tree.length));
  const infoWidth = Math.max(...rows.map((row) => row.info.length));
  const body = rows
    .map((row) => {
      const line = row.tree.padEnd(treeWidth + 2) + row.info;
      return (
        row.note === ''
          ? line
          : line.padEnd(treeWidth + 2 + infoWidth + 2) + row.note
      ).trimEnd();
    })
    .join('\n');

  const label = routeCount === 1 ? 'ruta' : 'rutas';
  return `@jscode/react-native-routing · ${routeCount} ${label}\n\n${body}`;
}
