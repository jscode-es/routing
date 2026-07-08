import { reducer, createEntry } from './reducer';
import type { NavigationState } from './reducer';
import { parse } from '../route-tree/parse';
import { matchPath } from '../route-tree/match';

const resolve = (key: string) => key;
const tree = parse(['./index.tsx', './users/[id].tsx'], resolve);

function entryFor(pathname: string) {
  const match = matchPath(tree, pathname);
  if (!match) throw new Error(`no match for ${pathname}`);
  return createEntry(pathname, match);
}

function stateWith(...pathnames: string[]): NavigationState {
  return { stack: pathnames.map(entryFor) };
}

describe('navigation reducer', () => {
  it('PUSH appends an entry', () => {
    const state = stateWith('/');
    const next = reducer(state, { type: 'PUSH', entry: entryFor('/users/42') });
    expect(next.stack).toHaveLength(2);
    expect(next.stack[1]?.pathname).toBe('/users/42');
  });

  it('POP removes the top entry', () => {
    const state = stateWith('/', '/users/42');
    const next = reducer(state, { type: 'POP' });
    expect(next.stack).toHaveLength(1);
    expect(next.stack[0]?.pathname).toBe('/');
  });

  it('POP on the root entry is a no-op', () => {
    const state = stateWith('/');
    const next = reducer(state, { type: 'POP' });
    expect(next).toBe(state);
  });

  it('REPLACE swaps the top entry keeping stack depth', () => {
    const state = stateWith('/', '/users/42');
    const next = reducer(state, {
      type: 'REPLACE',
      entry: entryFor('/users/7'),
    });
    expect(next.stack).toHaveLength(2);
    expect(next.stack[1]?.pathname).toBe('/users/7');
    expect(next.stack[0]?.pathname).toBe('/');
  });

  it('SET_PARAMS merges params into the entry with the given key', () => {
    const state = stateWith('/', '/users/42');
    const key = state.stack[1]?.key as string;
    const next = reducer(state, {
      type: 'SET_PARAMS',
      key,
      params: { tab: 'settings' },
    });
    expect(next.stack[1]?.match.params).toEqual({ id: '42', tab: 'settings' });
    expect(next.stack[0]?.match.params).toEqual({});
  });

  it('entries get unique keys even for the same pathname', () => {
    const a = entryFor('/users/42');
    const b = entryFor('/users/42');
    expect(a.key).not.toBe(b.key);
  });
});
