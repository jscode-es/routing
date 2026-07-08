import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Slot } from './Slot';
import { router } from './router';
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from './hooks';
import type { RequireContext } from '../route-tree/context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => {
  const r = useRouter();
  return (
    <Pressable testID="go" onPress={() => r.push('/users/42')}>
      <Text>Home</Text>
    </Pressable>
  );
};

const User = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  return (
    <View>
      <Text>{`User ${id}`}</Text>
      <Pressable testID="back" onPress={() => r.back()}>
        <Text>Back</Text>
      </Pressable>
      <Pressable testID="replace" onPress={() => r.replace('/users/7')}>
        <Text>Replace</Text>
      </Pressable>
      <Pressable testID="setParams" onPress={() => r.setParams({ id: '99' })}>
        <Text>SetParams</Text>
      </Pressable>
    </View>
  );
};

function makeContext() {
  return fakeContext({
    './index.tsx': Home,
    './users/[id].tsx': User,
  });
}

describe('useRouter navigation', () => {
  it('push navigates to the target route with params', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    expect(screen.getByText('User 42')).toBeTruthy();
  });

  it('back returns to the previous route', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    await fireEvent.press(screen.getByTestId('back'));
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('replace swaps the current route so back skips it', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    await fireEvent.press(screen.getByTestId('replace'));
    expect(screen.getByText('User 7')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('back'));
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('setParams updates the current entry params', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    await fireEvent.press(screen.getByTestId('setParams'));
    expect(screen.getByText('User 99')).toBeTruthy();
  });

  it('push to an unknown route throws a clear error', async () => {
    const BadLink = () => {
      const r = useRouter();
      return (
        <Pressable testID="bad" onPress={() => r.push('/nope')}>
          <Text>Bad</Text>
        </Pressable>
      );
    };
    await render(
      <RootRouter context={fakeContext({ './index.tsx': BadLink })} />,
    );
    await expect(
      fireEvent.press(screen.getByTestId('bad')),
    ).rejects.toThrow(/No route matches/);
  });
});

describe('imperative router', () => {
  it('navigates from outside the component tree once mounted', async () => {
    await render(<RootRouter context={makeContext()} />);
    await act(async () => {
      router.push('/users/42');
    });
    expect(screen.getByText('User 42')).toBeTruthy();
  });
});

describe('introspection hooks', () => {
  const Probe = () => {
    const pathname = usePathname();
    const segments = useSegments();
    return (
      <View>
        <Text>{`path:${pathname}`}</Text>
        <Text>{`segments:${segments.join(',')}`}</Text>
      </View>
    );
  };

  it('usePathname and useSegments reflect the active route', async () => {
    const ctx = fakeContext({
      './(tabs)/home.tsx': Probe,
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    expect(screen.getByText('path:/home')).toBeTruthy();
    expect(screen.getByText('segments:(tabs),home')).toBeTruthy();
  });

  it('useGlobalSearchParams sees leaf params from a layout, useLocalSearchParams does not', async () => {
    const Layout = () => {
      const global = useGlobalSearchParams<{ id?: string }>();
      const local = useLocalSearchParams<{ id?: string }>();
      return (
        <View>
          <Text>{`layout-global:${global.id ?? 'none'}`}</Text>
          <Text>{`layout-local:${local.id ?? 'none'}`}</Text>
          <Slot />
        </View>
      );
    };
    const ctx = fakeContext({
      './_layout.tsx': Layout,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} initialPath="/users/42" />);
    expect(screen.getByText('layout-global:42')).toBeTruthy();
    expect(screen.getByText('layout-local:none')).toBeTruthy();
    expect(screen.getByText('User 42')).toBeTruthy();
  });
});
