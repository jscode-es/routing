import type { RouteParams } from '../route-tree/types';

export interface Router {
  push(href: string): void;
  replace(href: string): void;
  back(): void;
  setParams(params: RouteParams): void;
}

let active: Router | null = null;

export function setActiveRouter(router: Router | null): void {
  active = router;
}

function requireActive(): Router {
  if (!active) {
    throw new Error(
      'Router not ready: <RootRouter> must be mounted before using the imperative router.',
    );
  }
  return active;
}

export const router: Router = {
  push: (href) => requireActive().push(href),
  replace: (href) => requireActive().replace(href),
  back: () => requireActive().back(),
  setParams: (params) => requireActive().setParams(params),
};
