import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import type { RequireContext } from '../route-tree/context';

type RouteModule = Record<string, unknown>;

function fakeContext(modules: Record<string, RouteModule>): RequireContext {
  const ctx = ((key: string) => modules[key]!) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

function makeContext() {
  return fakeContext({
    './(tabs)/layout.ts': { navigator: { type: 'tabs' } },
    './(tabs)/home.tsx': {
      default: () => <Text>Home</Text>,
      metadata: { title: 'Inicio' },
    },
    './(tabs)/profile.tsx': {
      default: () => <Text>Profile</Text>,
      metadata: { title: 'Perfil' },
    },
  });
}

let logSpy: jest.SpyInstance;

beforeEach(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('route tree log', () => {
  it('prints the route tree once on mount in development', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    const calls = logSpy.mock.calls.filter(([message]) =>
      String(message).includes('@authuser/react-native-routing'),
    );
    expect(calls).toHaveLength(1);
    const output = String(calls[0]?.[0]);
    expect(output).toMatch(/\(tabs\)\/\s+Tabs/);
    expect(output).toMatch(/home\s+\/home\s+"Inicio"/);
  });

  it('does not print with logRoutes={false}', async () => {
    await render(
      <RootRouter
        context={makeContext()}
        initialPath="/home"
        logRoutes={false}
      />,
    );
    expect(logSpy).not.toHaveBeenCalled();
  });
});
