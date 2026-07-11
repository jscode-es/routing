import { hasImplicitStack } from '../route-tree/implicit';
import type { RouteNode } from '../route-tree/types';
import { warnDev } from './dev';

export interface NavigatorConfig {
  type: 'stack' | 'tabs' | 'slot';
  // Solo para type 'tabs':
  animation?: 'none' | 'fade';
  showLabel?: boolean;
  // Orden de las pestañas por nombre de ruta; las no listadas van detrás
  // en su orden natural (index primero, resto por descubrimiento).
  order?: string[];
}

const NAVIGATOR_TYPES: readonly string[] = ['stack', 'tabs', 'slot'];

const warned = new WeakSet<object>();

export function readNavigatorConfig(
  node: RouteNode,
): NavigatorConfig | undefined {
  const raw = node.navigator;
  if (raw === undefined) return undefined;
  const type =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as { type?: unknown }).type
      : undefined;
  if (typeof type !== 'string' || !NAVIGATOR_TYPES.includes(type)) {
    if (!warned.has(node)) {
      warned.add(node);
      warnDev(
        `Ignoring the navigator export of layout "${node.segment || '/'}": expected { type: 'stack' | 'tabs' | 'slot' }.`,
      );
    }
    return undefined;
  }
  return raw as NavigatorConfig;
}

// Un hijo con navegador propio agrupa sus entradas en una sola pantalla del
// stack exterior: layout manual, config declarativa (slot no crea nivel) o
// stack implícito de carpeta con varias rutas.
export function createsNavigator(node: RouteNode): boolean {
  if (node.layout !== undefined) return true;
  const config = readNavigatorConfig(node);
  if (config !== undefined) return config.type !== 'slot';
  return hasImplicitStack(node);
}
