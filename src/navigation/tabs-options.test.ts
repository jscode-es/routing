import React from 'react';
import {
  collectTabConfigs,
  hrefForTab,
  resolveTabs,
  TabsScreen,
} from './tabs-options';
import { parse } from '../route-tree/parse';
import { matchPath } from '../route-tree/match';

const resolve = (key: string) => key;
const tree = parse(
  [
    './(tabs)/layout.tsx',
    './(tabs)/home.tsx',
    './(tabs)/profile.tsx',
    './(auth)/login.tsx',
  ],
  resolve,
);

const homeMatch = matchPath(tree, '/home');
if (!homeMatch) throw new Error('no match for /home');
const tabsNode = homeMatch.chain[1]!;

describe('resolveTabs', () => {
  it('auto-registers sibling routes when there are no explicit children', () => {
    expect(resolveTabs(tabsNode, undefined)).toEqual([
      { name: 'home', options: {} },
      { name: 'profile', options: {} },
    ]);
  });

  it('uses explicit <Tabs.Screen> children for order and options', () => {
    const children = [
      React.createElement(TabsScreen, {
        name: 'profile',
        options: { title: 'Perfil' },
      }),
      React.createElement(TabsScreen, {
        name: 'home',
        options: { title: 'Inicio' },
      }),
    ];
    expect(resolveTabs(tabsNode, children)).toEqual([
      { name: 'profile', options: { title: 'Perfil' } },
      { name: 'home', options: { title: 'Inicio' } },
    ]);
  });

  it('includes the folder index route as the "index" tab', () => {
    const flatTree = parse(
      ['./layout.tsx', './index.tsx', './settings.tsx'],
      resolve,
    );
    expect(resolveTabs(flatTree, undefined)).toEqual([
      { name: 'index', options: {} },
      { name: 'settings', options: {} },
    ]);
  });
});

describe('collectTabConfigs', () => {
  it('returns an empty map without children', () => {
    expect(collectTabConfigs(undefined)).toEqual({});
  });
});

describe('hrefForTab', () => {
  it('skips group segments when building the href', () => {
    expect(hrefForTab(homeMatch.chain, 1, 'home')).toBe('/home');
    expect(hrefForTab(homeMatch.chain, 1, 'profile')).toBe('/profile');
  });

  it('maps the "index" tab to the folder path itself', () => {
    const flatTree = parse(
      ['./layout.tsx', './index.tsx', './settings.tsx'],
      resolve,
    );
    const match = matchPath(flatTree, '/');
    expect(hrefForTab(match!.chain, 0, 'index')).toBe('/');
    expect(hrefForTab(match!.chain, 0, 'settings')).toBe('/settings');
  });
});
