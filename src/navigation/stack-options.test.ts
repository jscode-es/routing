import React from 'react';
import {
  collectScreenConfigs,
  createBackPressHandler,
  screenNameForEntry,
} from './stack-options';
import { StackScreen } from './stack-options';
import { createEntry } from './reducer';
import { parse } from '../route-tree/parse';
import { matchPath } from '../route-tree/match';

const resolve = (key: string) => key;
const tree = parse(
  ['./index.tsx', './users/[id].tsx', './settings.tsx'],
  resolve,
);

function entryFor(pathname: string) {
  const match = matchPath(tree, pathname);
  if (!match) throw new Error(`no match for ${pathname}`);
  return createEntry(pathname, match);
}

describe('screenNameForEntry', () => {
  it('returns "index" for the layout folder own index route', () => {
    expect(screenNameForEntry(entryFor('/'), 0)).toBe('index');
  });

  it('returns the first segment below the layout depth', () => {
    expect(screenNameForEntry(entryFor('/users/42'), 0)).toBe('users');
    expect(screenNameForEntry(entryFor('/settings'), 0)).toBe('settings');
  });
});

describe('collectScreenConfigs', () => {
  it('collects options declared via <Stack.Screen> children', () => {
    const children = [
      React.createElement(StackScreen, { name: 'index', options: { title: 'Home' } }),
      React.createElement(StackScreen, {
        name: 'users',
        options: { title: 'Detail' },
      }),
    ];
    const configs = collectScreenConfigs(children);
    expect(configs).toEqual({
      index: { title: 'Home' },
      users: { title: 'Detail' },
    });
  });

  it('returns an empty map without explicit children', () => {
    expect(collectScreenConfigs(undefined)).toEqual({});
  });
});

describe('createBackPressHandler', () => {
  it('pops and consumes the event when the stack is deeper than 1', () => {
    const back = jest.fn();
    const handler = createBackPressHandler(() => 2, back);
    expect(handler()).toBe(true);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('does not consume the event on the root entry', () => {
    const back = jest.fn();
    const handler = createBackPressHandler(() => 1, back);
    expect(handler()).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });
});
