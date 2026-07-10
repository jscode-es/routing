import type { RouteMatch, RouteParams } from '../route-tree/types';

export interface NavigationEntry {
  key: string;
  pathname: string;
  match: RouteMatch;
}

export interface NavigationState {
  stack: NavigationEntry[];
}

export type NavigationAction =
  | { type: 'PUSH'; entry: NavigationEntry }
  | { type: 'POP' }
  | { type: 'REPLACE'; entry: NavigationEntry }
  | { type: 'SET_ACTIVE_TAB'; entry: NavigationEntry }
  | { type: 'SET_PARAMS'; key: string; params: RouteParams };

let nextKey = 0;

export function createEntry(
  pathname: string,
  match: RouteMatch,
): NavigationEntry {
  nextKey += 1;
  return { key: `route-${nextKey}`, pathname, match };
}

export function reducer(
  state: NavigationState,
  action: NavigationAction,
): NavigationState {
  switch (action.type) {
    case 'PUSH':
      return { stack: [...state.stack, action.entry] };
    case 'POP': {
      if (state.stack.length <= 1) return state;
      return { stack: state.stack.slice(0, -1) };
    }
    case 'REPLACE':
      return { stack: [...state.stack.slice(0, -1), action.entry] };
    case 'SET_ACTIVE_TAB': {
      const top = state.stack[state.stack.length - 1];
      if (top?.pathname === action.entry.pathname) return state;
      const entry = top
        ? { ...action.entry, key: top.key }
        : action.entry;
      return { stack: [...state.stack.slice(0, -1), entry] };
    }
    case 'SET_PARAMS':
      return {
        stack: state.stack.map((entry) =>
          entry.key === action.key
            ? {
                ...entry,
                match: {
                  ...entry.match,
                  params: { ...entry.match.params, ...action.params },
                },
              }
            : entry,
        ),
      };
  }
}
