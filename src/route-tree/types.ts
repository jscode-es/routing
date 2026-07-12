export type RouteType = 'static' | 'dynamic' | 'catchAll' | 'group';

export interface RouteNode<C = unknown> {
  segment: string;
  type: RouteType;
  paramName?: string;
  component?: C;
  layout?: C;
  notFound?: C;
  // Exports opcionales de los módulos (RFC metadata-layouts); se guardan
  // sin validar — la capa de navegación los lee y valida. metadata y
  // generateMetadata vienen de páginas; navigator, de layouts.
  metadata?: unknown;
  generateMetadata?: unknown;
  navigator?: unknown;
  // metadata del not-found de la carpeta: el archivo no es un nodo del
  // árbol, matchNotFound la copia en la hoja virtual que fabrica.
  notFoundMetadata?: unknown;
  children: RouteNode<C>[];
}

export type RouteParams = Record<string, string | string[]>;

export interface RouteMatch<C = unknown> {
  node: RouteNode<C>;
  params: RouteParams;
  chain: RouteNode<C>[];
}
