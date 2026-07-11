import type { RouteNode } from './types';

function hasAnyRoute(node: RouteNode): boolean {
  if (node.component !== undefined) return true;
  return node.children.some(hasAnyRoute);
}

// Entradas directas de la carpeta: su index más cada hijo con rutas (un
// subárbol cuenta como una sola pantalla del stack de la carpeta).
function directEntryCount(node: RouteNode): number {
  let count = node.component !== undefined ? 1 : 0;
  for (const child of node.children) {
    if (hasAnyRoute(child)) count += 1;
  }
  return count;
}

// Una carpeta sin config de navegador obtiene un Stack implícito si tiene
// más de una entrada navegable; con una sola, queda como pantalla del stack
// ancestro. La raíz es implícita siempre (la app funciona sin ningún
// archivo de layout). Una config `navigator` explícita tiene prioridad —
// eso lo deciden los llamadores.
export function hasImplicitStack(node: RouteNode, isRoot = false): boolean {
  return isRoot || directEntryCount(node) > 1;
}
