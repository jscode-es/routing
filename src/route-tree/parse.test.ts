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

  it('ignores non-route files without resolving them', () => {
    const resolved: string[] = [];
    const tree = parse(
      ['./index.tsx', './logo.png', './data.json', './notes.md'],
      (key) => {
        resolved.push(key);
        return key;
      },
    );
    expect(tree.component).toBe('./index.tsx');
    expect(tree.children).toHaveLength(0);
    expect(resolved).toEqual(['./index.tsx']);
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

  it('attaches layout.tsx to the folder node, not as a child', () => {
    const tree = parse(['./(tabs)/layout.tsx', './(tabs)/home.tsx'], resolve);
    const tabs = child(tree, '(tabs)');
    expect(tabs.layout).toBe('./(tabs)/layout.tsx');
    expect(tabs.children.map((c) => c.segment)).toEqual(['home']);
  });

  it('attaches a root layout.tsx to the root node', () => {
    const tree = parse(['./layout.tsx', './index.tsx'], resolve);
    expect(tree.layout).toBe('./layout.tsx');
    expect(tree.component).toBe('./index.tsx');
  });

  it('attaches not-found.tsx to the folder node instead of routing it', () => {
    const tree = parse(['./not-found.tsx', './index.tsx'], resolve);
    expect(tree.notFound).toBe('./not-found.tsx');
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
        './layout.tsx',
        './(auth)/login.tsx',
        './(tabs)/layout.tsx',
        './(tabs)/home.tsx',
        './(tabs)/settings/layout.tsx',
        './(tabs)/settings/index.tsx',
        './(tabs)/settings/notifications.tsx',
      ],
      resolve,
    );
    expect(tree.layout).toBe('./layout.tsx');
    const auth = child(tree, '(auth)');
    expect(auth.type).toBe('group');
    expect(child(auth, 'login').component).toBe('./(auth)/login.tsx');
    const tabs = child(tree, '(tabs)');
    expect(tabs.layout).toBe('./(tabs)/layout.tsx');
    const settings = child(tabs, 'settings');
    expect(settings.layout).toBe('./(tabs)/settings/layout.tsx');
    expect(settings.component).toBe('./(tabs)/settings/index.tsx');
    expect(child(settings, 'notifications').component).toBe(
      './(tabs)/settings/notifications.tsx',
    );
  });
});

describe('metadata exports', () => {
  const gen = () => ({});

  it('captures metadata and generateMetadata on page nodes', () => {
    const tree = parse(['./index.tsx', './users/[id].tsx'], resolve, (key) => ({
      metadata: { title: key },
      generateMetadata: gen,
    }));
    expect(tree.metadata).toEqual({ title: './index.tsx' });
    expect(tree.generateMetadata).toBe(gen);
    const id = child(child(tree, 'users'), '[id]');
    expect(id.metadata).toEqual({ title: './users/[id].tsx' });
    expect(id.generateMetadata).toBe(gen);
  });

  it('does not attach metadata from layout or not-found exports', () => {
    const tree = parse(
      ['./sec/layout.tsx', './sec/not-found.tsx', './sec/index.tsx'],
      resolve,
      (key) =>
        key === './sec/index.tsx' ? {} : { metadata: { title: 'X' } },
    );
    const sec = child(tree, 'sec');
    expect(sec.metadata).toBeUndefined();
    expect(sec.generateMetadata).toBeUndefined();
  });

  it('captures the not-found metadata aside for the virtual leaf', () => {
    const tree = parse(['./not-found.tsx', './index.tsx'], resolve, (key) =>
      key === './not-found.tsx' ? { metadata: { title: '404' } } : {},
    );
    expect(tree.notFoundMetadata).toEqual({ title: '404' });
    expect(tree.metadata).toBeUndefined();
  });

  it('leaves nodes bare when the module exports no metadata', () => {
    const tree = parse(['./index.tsx'], resolve, () => ({}));
    expect(tree.metadata).toBeUndefined();
    expect(tree.generateMetadata).toBeUndefined();
  });
});

describe('navigator exports', () => {
  it('captures the navigator export of a component-less layout.ts', () => {
    const tree = parse(
      ['./(tabs)/layout.ts', './(tabs)/home.tsx'],
      (key) => (key === './(tabs)/layout.ts' ? undefined : key),
      (key) =>
        key === './(tabs)/layout.ts' ? { navigator: { type: 'tabs' } } : {},
    );
    const tabs = child(tree, '(tabs)');
    expect(tabs.navigator).toEqual({ type: 'tabs' });
    expect(tabs.layout).toBeUndefined();
  });

  it('captures navigator and component when the layout exports both', () => {
    const tree = parse(['./layout.tsx', './index.tsx'], resolve, (key) =>
      key === './layout.tsx' ? { navigator: { type: 'stack' } } : {},
    );
    expect(tree.layout).toBe('./layout.tsx');
    expect(tree.navigator).toEqual({ type: 'stack' });
  });

  it('throws when a layout exports neither a component nor a navigator', () => {
    expect(() =>
      parse(
        ['./sec/layout.ts', './sec/index.tsx'],
        (key) => (key === './sec/layout.ts' ? undefined : key),
        () => ({}),
      ),
    ).toThrow(/layout/i);
  });

  it('throws when a page has no default export', () => {
    expect(() =>
      parse(['./index.tsx'], () => undefined, () => ({}))
    ).toThrow(/default export/);
  });
});

describe('deep nesting', () => {
  it('builds three levels of folders with layouts at each level', () => {
    const tree = parse(
      [
        './layout.tsx',
        './a/layout.tsx',
        './a/index.tsx',
        './a/b/layout.tsx',
        './a/b/index.tsx',
        './a/b/c.tsx',
      ],
      (key: string) => key,
    );
    expect(tree.layout).toBe('./layout.tsx');
    const a = tree.children.find((n) => n.segment === 'a');
    expect(a?.layout).toBe('./a/layout.tsx');
    expect(a?.component).toBe('./a/index.tsx');
    const b = a?.children.find((n) => n.segment === 'b');
    expect(b?.layout).toBe('./a/b/layout.tsx');
    expect(b?.component).toBe('./a/b/index.tsx');
    const c = b?.children.find((n) => n.segment === 'c');
    expect(c?.component).toBe('./a/b/c.tsx');
  });
});
