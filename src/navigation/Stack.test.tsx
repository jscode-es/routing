import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Stack } from './Stack';
import { router } from './router';
import { useLocalSearchParams, useRouter } from './hooks';
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
  return <Text>{`User ${id}`}</Text>;
};

const Layout = () => (
  <Stack>
    <Stack.Screen name="index" options={{ title: 'Inicio' }} />
    <Stack.Screen name="users" options={{ title: 'Detail' }} />
  </Stack>
);

function makeContext() {
  return fakeContext({
    './layout.tsx': Layout,
    './index.tsx': Home,
    './users/[id].tsx': User,
  });
}

describe('Stack', () => {
  it('renders one Screen per stack entry, all mounted', async () => {
    await render(<RootRouter context={makeContext()} />);
    expect(screen.getAllByTestId('screen')).toHaveLength(1);

    await fireEvent.press(screen.getByTestId('go'));
    const screens = screen.getAllByTestId('screen');
    expect(screens).toHaveLength(2);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('User 42')).toBeTruthy();
  });

  it('keeps every screen attached and freezes the ones deep in background', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    await act(async () => {
      router.push('/users/7');
    });
    const screens = screen.getAllByTestId('screen');
    // activityState nunca decrece dentro de un ScreenStack nativo.
    expect(screens.map((s) => s.props.activityState)).toEqual([2, 2, 2]);
    // Se congela todo salvo el top y la pantalla justo debajo (necesaria
    // para la animación de pop / swipe-back).
    expect(screens.map((s) => s.props.shouldFreeze)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('renders the native header config with the screen title', async () => {
    await render(<RootRouter context={makeContext()} />);
    expect(screen.getByTestId('header-config').props.title).toBe('Inicio');

    await fireEvent.press(screen.getByTestId('go'));
    const headers = screen.getAllByTestId('header-config');
    expect(headers[1]?.props.title).toBe('Detail');
  });

  it('pops the stack when a screen is dismissed natively', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    const screens = screen.getAllByTestId('screen');
    await act(async () => {
      screens[1]?.props.onDismissed?.({ nativeEvent: { dismissCount: 1 } });
    });
    expect(screen.getAllByTestId('screen')).toHaveLength(1);
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('background screens keep their own params', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    await act(async () => {
      router.push('/users/7');
    });
    expect(screen.getByText('User 42')).toBeTruthy();
    expect(screen.getByText('User 7')).toBeTruthy();
  });

  it('scopes nested stacks to their own subtree', async () => {
    const RootLayout = () => <Stack />;
    const SettingsLayout = () => <Stack />;
    const SettingsHome = () => <Text>Settings home</Text>;
    const SettingsDetails = () => <Text>Settings details</Text>;
    const ctx = fakeContext({
      './layout.tsx': RootLayout,
      './index.tsx': Home,
      './settings/layout.tsx': SettingsLayout,
      './settings/index.tsx': SettingsHome,
      './settings/details.tsx': SettingsDetails,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getAllByTestId('screen')).toHaveLength(1);

    await act(async () => {
      router.push('/settings');
    });
    // Raíz: index + grupo settings; interior: settings home.
    expect(screen.getAllByTestId('screen')).toHaveLength(3);

    await act(async () => {
      router.push('/settings/details');
    });
    // El push entra al stack interior sin añadir pantalla al stack raíz.
    expect(screen.getAllByTestId('screen')).toHaveLength(4);
    expect(screen.getByText('Settings home')).toBeTruthy();
    expect(screen.getByText('Settings details')).toBeTruthy();

    await act(async () => {
      router.back();
    });
    expect(screen.getAllByTestId('screen')).toHaveLength(3);
    expect(screen.queryByText('Settings details')).toBeNull();
  });

  it('gives every screen an opaque background so push transitions do not blend', async () => {
    await render(<RootRouter context={makeContext()} />);
    await fireEvent.press(screen.getByTestId('go'));
    const contents = screen.getAllByTestId('screen-content');
    for (const content of contents) {
      const style = StyleSheet.flatten(content.props.style);
      expect(style.backgroundColor).toBe('#f2f2f2');
    }
  });

  it('keeps transparentModal screens transparent and allows contentStyle overrides', async () => {
    const StyledLayout = () => (
      <Stack>
        <Stack.Screen
          name="index"
          options={{ contentStyle: { backgroundColor: 'papayawhip' } }}
        />
        <Stack.Screen
          name="users"
          options={{ presentation: 'transparentModal' }}
        />
      </Stack>
    );
    const ctx = fakeContext({
      './layout.tsx': StyledLayout,
      './index.tsx': Home,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    await fireEvent.press(screen.getByTestId('go'));
    const contents = screen.getAllByTestId('screen-content');
    expect(StyleSheet.flatten(contents[0]?.props.style).backgroundColor).toBe(
      'papayawhip',
    );
    expect(
      StyleSheet.flatten(contents[1]?.props.style).backgroundColor,
    ).toBeUndefined();
  });

  it('hides the native header with headerShown: false', async () => {
    const Layout = () => (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    );
    const ctx = fakeContext({
      './layout.tsx': Layout,
      './index.tsx': Home,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.hidden).toBe(true);
  });

  it('applies a top safe area by default when the header is hidden', async () => {
    const Layout = () => (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    );
    const ctx = fakeContext({
      './layout.tsx': Layout,
      './index.tsx': Home,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('safe-area').props.edges).toEqual({ top: true });
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('goes full-bleed with safeArea: false (OTT style)', async () => {
    const Layout = () => (
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, safeArea: false }}
        />
      </Stack>
    );
    const ctx = fakeContext({
      './layout.tsx': Layout,
      './index.tsx': Home,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.queryByTestId('safe-area')).toBeNull();
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('does not add a top safe area when the native header is shown', async () => {
    await render(<RootRouter context={makeContext()} />);
    expect(screen.getByTestId('header-config').props.hidden).toBeUndefined();
    expect(screen.queryByTestId('safe-area')).toBeNull();
  });

  it('falls back to the screen name as title without explicit options', async () => {
    const PlainLayout = () => <Stack />;
    const ctx = fakeContext({
      './layout.tsx': PlainLayout,
      './index.tsx': Home,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('index');
  });
});
