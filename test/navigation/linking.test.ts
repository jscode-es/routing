import React from 'react';
import { Linking, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { RootRouter } from '../../src/navigation/RootRouter';
import { urlToPath } from '../../src/navigation/linking';
import { useLocalSearchParams } from '../../src/navigation/hooks';
import type { RequireContext } from '../../src/route-tree/context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => React.createElement(Text, null, 'Home');
const Share = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  return React.createElement(Text, null, `Share ${id}`);
};

function makeContext() {
  return fakeContext({
    './index.tsx': Home,
    './share/[id].tsx': Share,
  });
}

describe('urlToPath', () => {
  it('turns a scheme URL into a path (host is the first segment)', () => {
    expect(urlToPath('routingexample://share/42')).toBe('/share/42');
  });

  it('maps a bare scheme URL to the root path', () => {
    expect(urlToPath('routingexample://')).toBe('/');
  });

  it('strips query strings and trailing slashes', () => {
    expect(urlToPath('routingexample://share/42/?utm=x#frag')).toBe(
      '/share/42',
    );
  });
});

describe('deep linking', () => {
  let urlListener: ((event: { url: string }) => void) | null;
  let removeSubscription: jest.Mock;

  beforeEach(() => {
    urlListener = null;
    removeSubscription = jest.fn();
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest
      .spyOn(Linking, 'addEventListener')
      .mockImplementation((_type, handler) => {
        urlListener = handler as (event: { url: string }) => void;
        return { remove: removeSubscription } as unknown as ReturnType<
          typeof Linking.addEventListener
        >;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves the initial screen from getInitialURL', async () => {
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue('routingexample://share/42');
    await render(React.createElement(RootRouter, { context: makeContext() }));
    expect(await screen.findByText('Share 42')).toBeTruthy();
  });

  it('navigates when a url event arrives with the app open', async () => {
    await render(React.createElement(RootRouter, { context: makeContext() }));
    expect(screen.getByText('Home')).toBeTruthy();

    await act(async () => {
      urlListener?.({ url: 'routingexample://share/7' });
    });
    expect(screen.getByText('Share 7')).toBeTruthy();
  });

  it('removes the url listener on unmount', async () => {
    await render(React.createElement(RootRouter, { context: makeContext() }));
    await act(async () => {
      screen.unmount();
    });
    expect(removeSubscription).toHaveBeenCalled();
  });
});
