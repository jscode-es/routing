import type { ReactNode } from 'react';
import type { RouteParams } from '../route-tree/types';

export interface PageProps<P extends RouteParams = RouteParams> {
  params: P;
  pathname: string;
}

export interface LayoutProps<P extends RouteParams = RouteParams>
  extends PageProps<P> {
  children?: ReactNode;
}
