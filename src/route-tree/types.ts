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
  children: RouteNode<C>[];
}

export type RouteParams = Record<string, string | string[]>;

export interface RouteMatch<C = unknown> {
  node: RouteNode<C>;
  params: RouteParams;
  chain: RouteNode<C>[];
}
