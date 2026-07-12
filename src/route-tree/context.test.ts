import { describe, it, expect } from 'vitest';
import { buildRouteTree } from './context';
import type { RequireContext } from './context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

describe('buildRouteTree', () => {
  it('builds a tree resolving default exports from the context', () => {
    const Home = () => null;
    const User = () => null;
    const ctx = fakeContext({
      './index.tsx': Home,
      './users/[id].tsx': User,
    });

    const tree = buildRouteTree(ctx);
    expect(tree.component).toBe(Home);
    const users = tree.children.find((c) => c.segment === 'users');
    expect(users?.children[0]?.component).toBe(User);
  });

  it('throws a clear error when a route file has no default export', () => {
    const ctx = fakeContext({ './broken.tsx': undefined });
    expect(() => buildRouteTree(ctx)).toThrow(/default export/);
  });

  it('accepts a component-less layout that exports a navigator config', () => {
    const Home = () => null;
    const modules: Record<string, Record<string, unknown>> = {
      './layout.ts': { navigator: { type: 'stack' } },
      './index.tsx': { default: Home },
    };
    const ctx = ((key: string) => modules[key]!) as RequireContext;
    ctx.keys = () => Object.keys(modules);

    const tree = buildRouteTree(ctx);
    expect(tree.navigator).toEqual({ type: 'stack' });
    expect(tree.layout).toBeUndefined();
    expect(tree.component).toBe(Home);
  });
});
