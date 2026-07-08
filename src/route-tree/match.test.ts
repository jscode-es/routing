import { describe, it, expect } from 'vitest';
import { parse } from './parse';
import { matchPath } from './match';

const resolve = (key: string) => key;

describe('matchPath', () => {
  const tree = parse(
    [
      './index.tsx',
      './settings.tsx',
      './users/new.tsx',
      './users/[id].tsx',
      './blog/[...slug].tsx',
      './(tabs)/home.tsx',
      './(tabs)/profile/index.tsx',
    ],
    resolve,
  );

  it('matches / to the root index component', () => {
    const result = matchPath(tree, '/');
    expect(result?.node.component).toBe('./index.tsx');
    expect(result?.params).toEqual({});
  });

  it('matches a static route', () => {
    const result = matchPath(tree, '/settings');
    expect(result?.node.component).toBe('./settings.tsx');
  });

  it('matches a dynamic segment and extracts the param', () => {
    const result = matchPath(tree, '/users/42');
    expect(result?.node.component).toBe('./users/[id].tsx');
    expect(result?.params).toEqual({ id: '42' });
  });

  it('prefers static over dynamic siblings', () => {
    const result = matchPath(tree, '/users/new');
    expect(result?.node.component).toBe('./users/new.tsx');
    expect(result?.params).toEqual({});
  });

  it('matches a catch-all and collects segments as string[]', () => {
    const result = matchPath(tree, '/blog/a/b/c');
    expect(result?.node.component).toBe('./blog/[...slug].tsx');
    expect(result?.params).toEqual({ slug: ['a', 'b', 'c'] });
  });

  it('catch-all requires at least one segment', () => {
    expect(matchPath(tree, '/blog')).toBeNull();
  });

  it('matches through groups without consuming a segment', () => {
    const result = matchPath(tree, '/home');
    expect(result?.node.component).toBe('./(tabs)/home.tsx');
  });

  it('matches an index route inside a group folder', () => {
    const result = matchPath(tree, '/profile');
    expect(result?.node.component).toBe('./(tabs)/profile/index.tsx');
  });

  it('returns null when nothing matches', () => {
    expect(matchPath(tree, '/nope/nada')).toBeNull();
  });

  it('normalizes trailing slashes', () => {
    const result = matchPath(tree, '/users/42/');
    expect(result?.params).toEqual({ id: '42' });
  });

  it('returns the chain of nodes from root to leaf', () => {
    const result = matchPath(tree, '/users/42');
    expect(result?.chain.map((n) => n.segment)).toEqual(['', 'users', '[id]']);
  });

  it('includes group nodes in the chain', () => {
    const result = matchPath(tree, '/home');
    expect(result?.chain.map((n) => n.segment)).toEqual(['', '(tabs)', 'home']);
  });
});
