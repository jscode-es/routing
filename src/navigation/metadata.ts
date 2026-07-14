import type { ReactNode } from 'react';
import type { RouteNode, RouteParams } from '../route-tree/types';
import { warnDev } from './dev';
import type { NavigationEntry } from './reducer';
import type { StackScreenOptions } from './stack-options';
import type { TabIconProps } from './tabs-options';

export interface ScreenMetadata extends StackScreenOptions {
  // Opciones de pestaña agrupadas: una misma pantalla puede vivir a la vez
  // dentro de un Tabs y de un Stack anidado.
  tab?: {
    icon?: (props: TabIconProps) => ReactNode;
    accessibilityLabel?: string;
  };
}

export interface GenerateMetadataContext {
  params: RouteParams;
  pathname: string;
  segments: string[];
}

export type GenerateMetadata = (
  context: GenerateMetadataContext,
) => ScreenMetadata;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function routeLabel(node: RouteNode): string {
  return node.segment === '' ? '/' : node.segment;
}

// La ausencia de la export es el caso base: defaults sin warning. Una
// export malformada tampoco tumba la navegación: warning en dev + defaults.
export function staticMetadata(node: RouteNode): ScreenMetadata {
  const raw = node.metadata;
  if (raw === undefined) return {};
  if (!isObject(raw)) {
    warnDev(
      `Ignoring the metadata export of route "${routeLabel(node)}": expected an object, got ${typeof raw}.`,
    );
    return {};
  }
  return raw as ScreenMetadata;
}

export function entryMetadata(
  node: RouteNode,
  entry: NavigationEntry,
): ScreenMetadata {
  const base = staticMetadata(node);
  const generate = node.generateMetadata;
  if (generate === undefined) return base;
  if (typeof generate !== 'function') {
    warnDev(
      `Ignoring the generateMetadata export of route "${routeLabel(node)}": expected a function, got ${typeof generate}.`,
    );
    return base;
  }
  let generated: unknown;
  try {
    generated = generate({
      params: entry.match.params,
      pathname: entry.pathname,
      segments: entry.match.chain
        .map((chainNode) => chainNode.segment)
        .filter((segment) => segment !== ''),
    } satisfies GenerateMetadataContext);
  } catch (error) {
    warnDev(
      `generateMetadata of route "${routeLabel(node)}" threw (${String(error)}); falling back to the static metadata.`,
    );
    return base;
  }
  if (!isObject(generated)) {
    warnDev(
      `Ignoring the generateMetadata result of route "${routeLabel(node)}": expected an object, got ${typeof generated}.`,
    );
    return base;
  }
  return { ...base, ...(generated as ScreenMetadata) };
}
