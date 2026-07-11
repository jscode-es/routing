import { describe, it, expect } from 'vitest';
import { formatRouteTree } from './format';
import { parse } from './parse';

const resolve = (key: string) =>
  key === './(tabs)/layout.ts' ? undefined : key;

function demoTree() {
  return parse(
    [
      './layout.tsx',
      './(tabs)/layout.ts',
      './(tabs)/index.tsx',
      './(tabs)/profile.tsx',
      './users/[id].tsx',
      './blog/[...slug].tsx',
      './not-found.tsx',
    ],
    resolve,
    (key) => {
      if (key === './(tabs)/layout.ts') {
        return { navigator: { type: 'tabs' } };
      }
      if (key === './(tabs)/index.tsx') {
        return { metadata: { title: 'Home' } };
      }
      if (key === './(tabs)/profile.tsx') {
        return { metadata: { title: 'Perfil' } };
      }
      return {};
    },
  );
}

describe('formatRouteTree', () => {
  it('prints the header with the route count', () => {
    const output = formatRouteTree(demoTree());
    expect(output).toContain('@jscode/react-native-routing');
    expect(output).toContain('4 rutas');
  });

  it('labels folders with their navigator', () => {
    const output = formatRouteTree(demoTree());
    expect(output).toMatch(/app\/\s+layout manual/);
    expect(output).toMatch(/\(tabs\)\/\s+Tabs/);
  });

  it('prints pages with their resolved URL and metadata title', () => {
    const output = formatRouteTree(demoTree());
    expect(output).toMatch(/index\s+\/\s+"Home"/);
    expect(output).toMatch(/profile\s+\/profile\s+"Perfil"/);
  });

  it('marks dynamic and catch-all segments', () => {
    const output = formatRouteTree(demoTree());
    expect(output).toMatch(/\[id\]\s+\/users\/:id\s+\(dinámica\)/);
    expect(output).toMatch(/\[\.\.\.slug\]\s+\/blog\/\*\s+\(catch-all\)/);
  });

  it('shows the not-found fallback', () => {
    const output = formatRouteTree(demoTree());
    expect(output).toMatch(/not-found\s+404/);
    expect(output).not.toContain('default del paquete');
  });

  it('annotates the package default when not-found is missing', () => {
    const tree = parse(['./index.tsx'], resolve, () => ({}));
    const output = formatRouteTree(tree);
    expect(output).toMatch(/not-found\s+404 \(default del paquete\)/);
  });

  it('draws the tree with box-drawing branches', () => {
    const output = formatRouteTree(demoTree());
    expect(output).toContain('├── (tabs)/');
    expect(output).toContain('│   ├── index');
    expect(output).toContain('└── not-found');
  });
});
