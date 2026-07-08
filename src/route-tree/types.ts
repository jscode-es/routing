export type RouteType = 'static' | 'dynamic' | 'catchAll' | 'group';

export interface RouteNode<C = unknown> {
  segment: string;
  type: RouteType;
  paramName?: string;
  component?: C;
  layout?: C;
  notFound?: C;
  children: RouteNode<C>[];
}

export type RouteParams = Record<string, string | string[]>;

export interface RouteMatch<C = unknown> {
  node: RouteNode<C>;
  params: RouteParams;
  chain: RouteNode<C>[];
}
