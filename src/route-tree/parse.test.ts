import { describe, it, expect } from 'vitest';
import { parse } from './parse';
import type { RouteNode } from './types';

const resolve = (key: string) => key;

function child(node: RouteNode, segment: string): RouteNode {
  const found = node.children.find((c) => c.segment === segment);
  if (!found) {
    throw new Error(
      `child "${segment}" not found in [${node.children.map((c) => c.segment).join(', ')}]`,
    );
  }
  return found;
}

describe('parse', () => {
  it('maps ./index.tsx to the root component', () => {
    const tree = parse(['./index.tsx'], resolve);
    expect(tree.segment).toBe('');
    expect(tree.component).toBe('./index.tsx');
    expect(tree.children).toHaveLength(0);
  });

  it('maps a top-level file to a static child route', () => {
    const tree = parse(['./settings.tsx'], resolve);
    const settings = child(tree, 'settings');
    expect(settings.type).toBe('static');
    expect(settings.component).toBe('./settings.tsx');
  });

  it('maps nested static routes', () => {
    const tree = parse(['./profile/index.tsx', './profile/edit.tsx'], resolve);
    const profile = child(tree, 'profile');
    expect(profile.type).toBe('static');
    expect(profile.component).toBe('./profile/index.tsx');
    const edit = child(profile, 'edit');
    expect(edit.component).toBe('./profile/edit.tsx');
  });

  it('parses [id].tsx as a dynamic segment', () => {
    const tree = parse(['./users/[id].tsx'], resolve);
    const users = child(tree, 'users');
    const id = child(users, '[id]');
    expect(id.type).toBe('dynamic');
    expect(id.paramName).toBe('id');
    expect(id.component).toBe('./users/[id].tsx');
  });

  it('parses [...slug].tsx as a catch-all segment', () => {
    const tree = parse(['./blog/[...slug].tsx'], resolve);
    const blog = child(tree, 'blog');
    const slug = child(blog, '[...slug]');
    expect(slug.type).toBe('catchAll');
    expect(slug.paramName).toBe('slug');
  });

  it('parses (group)/ as a group that keeps children', () => {
    const tree = parse(['./(tabs)/home.tsx', './(tabs)/profile.tsx'], resolve);
    const tabs = child(tree, '(tabs)');
    expect(tabs.type).toBe('group');
    expect(child(tabs, 'home').component).toBe('./(tabs)/home.tsx');
    expect(child(tabs, 'profile').component).toBe('./(tabs)/profile.tsx');
  });

  it('attaches _layout.tsx to the folder node, not as a child', () => {
    const tree = parse(['./(tabs)/_layout.tsx', './(tabs)/home.tsx'], resolve);
    const tabs = child(tree, '(tabs)');
    expect(tabs.layout).toBe('./(tabs)/_layout.tsx');
    expect(tabs.children.map((c) => c.segment)).toEqual(['home']);
  });

  it('attaches a root _layout.tsx to the root node', () => {
    const tree = parse(['./_layout.tsx', './index.tsx'], resolve);
    expect(tree.layout).toBe('./_layout.tsx');
    expect(tree.component).toBe('./index.tsx');
  });

  it('attaches +not-found.tsx to the folder node', () => {
    const tree = parse(['./+not-found.tsx', './index.tsx'], resolve);
    expect(tree.notFound).toBe('./+not-found.tsx');
    expect(tree.children).toHaveLength(0);
  });

  it('accepts .js, .jsx and .ts extensions', () => {
    const tree = parse(['./a.js', './b.jsx', './c.ts'], resolve);
    expect(child(tree, 'a').component).toBe('./a.js');
    expect(child(tree, 'b').component).toBe('./b.jsx');
    expect(child(tree, 'c').component).toBe('./c.ts');
  });

  it('throws on conflicting foo.tsx + foo/index.tsx', () => {
    expect(() => parse(['./foo.tsx', './foo/index.tsx'], resolve)).toThrow(
      /Conflicting routes/,
    );
  });

  it('parses nested groups and layouts several levels deep', () => {
    const tree = parse(
      [
        './_layout.tsx',
        './(auth)/login.tsx',
        './(tabs)/_layout.tsx',
        './(tabs)/home.tsx',
        './(tabs)/settings/_layout.tsx',
        './(tabs)/settings/index.tsx',
        './(tabs)/settings/notifications.tsx',
      ],
      resolve,
    );
    expect(tree.layout).toBe('./_layout.tsx');
    const auth = child(tree, '(auth)');
    expect(auth.type).toBe('group');
    expect(child(auth, 'login').component).toBe('./(auth)/login.tsx');
    const tabs = child(tree, '(tabs)');
    expect(tabs.layout).toBe('./(tabs)/_layout.tsx');
    const settings = child(tabs, 'settings');
    expect(settings.layout).toBe('./(tabs)/settings/_layout.tsx');
    expect(settings.component).toBe('./(tabs)/settings/index.tsx');
    expect(child(settings, 'notifications').component).toBe(
      './(tabs)/settings/notifications.tsx',
    );
  });
});
