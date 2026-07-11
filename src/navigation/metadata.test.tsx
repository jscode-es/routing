import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Stack } from './Stack';
import { Tabs } from './Tabs';
import { router } from './router';
import type { RequireContext } from '../route-tree/context';
import type { GenerateMetadata, ScreenMetadata } from './metadata';

type RouteModule = Record<string, unknown>;

function fakeContext(modules: Record<string, RouteModule>): RequireContext {
  const ctx = ((key: string) => modules[key]!) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => <Text>Home</Text>;
const User = () => <Text>User</Text>;
const StackLayout = () => <Stack />;

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('metadata in Stack', () => {
  it('applies the page metadata export to the native screen', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': { default: Home, metadata: { title: 'Inicio' } },
      './users/[id].tsx': {
        default: User,
        metadata: {
          title: 'Detalle',
          presentation: 'modal',
          animation: 'fade',
          orientation: 'landscape',
          contentStyle: { backgroundColor: 'black' },
        } satisfies ScreenMetadata,
      },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('Inicio');

    await act(async () => {
      router.push('/users/42');
    });
    const top = screen.getAllByTestId('screen')[1]!;
    expect(top.props.stackPresentation).toBe('modal');
    expect(top.props.stackAnimation).toBe('fade');
    expect(top.props.screenOrientation).toBe('landscape');
    expect(screen.getAllByTestId('header-config')[1]?.props.title).toBe(
      'Detalle',
    );
    const content = screen.getAllByTestId('screen-content')[1];
    expect(StyleSheet.flatten(content?.props.style).backgroundColor).toBe(
      'black',
    );
  });

  it('hides the header and applies the safe area from metadata', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': { default: Home, metadata: { headerShown: false } },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.hidden).toBe(true);
    expect(screen.getByTestId('safe-area').props.edges).toEqual({ top: true });
  });

  it('goes full-bleed with safeArea: false from metadata', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': {
        default: Home,
        metadata: { headerShown: false, safeArea: false },
      },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.queryByTestId('safe-area')).toBeNull();
  });

  it('completes partial metadata with the package defaults', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': { default: Home, metadata: { title: 'Solo título' } },
    });
    await render(<RootRouter context={ctx} />);
    const header = screen.getByTestId('header-config');
    expect(header.props.title).toBe('Solo título');
    expect(header.props.hidden).toBeUndefined();
    const first = screen.getAllByTestId('screen')[0]!;
    expect(first.props.stackPresentation).toBe('push');
    expect(first.props.stackAnimation).toBeUndefined();
  });

  it('navigates as today without metadata exports and does not warn', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': { default: Home },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('index');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('merges generateMetadata over the static metadata with params, pathname and segments', async () => {
    const generateMetadata: GenerateMetadata = ({
      params,
      pathname,
      segments,
    }) => ({
      title: `${String(params.id)}|${pathname}|${segments.join('.')}`,
    });
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': { default: Home },
      './users/[id].tsx': {
        default: User,
        metadata: { title: 'Estático', animation: 'fade' },
        generateMetadata,
      },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/users/42');
    });
    expect(screen.getAllByTestId('header-config')[1]?.props.title).toBe(
      '42|/users/42|users.[id]',
    );
    expect(screen.getAllByTestId('screen')[1]?.props.stackAnimation).toBe(
      'fade',
    );
  });

  it('lets explicit Stack.Screen options win over metadata and generateMetadata', async () => {
    const Layout = () => (
      <Stack>
        <Stack.Screen name="users" options={{ title: 'Explícito' }} />
      </Stack>
    );
    const ctx = fakeContext({
      './layout.tsx': { default: Layout },
      './index.tsx': { default: Home },
      './users/[id].tsx': {
        default: User,
        metadata: { title: 'Meta', animation: 'fade' },
        generateMetadata: () => ({ title: 'Generado' }),
      },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/users/42');
    });
    expect(screen.getAllByTestId('header-config')[1]?.props.title).toBe(
      'Explícito',
    );
    expect(screen.getAllByTestId('screen')[1]?.props.stackAnimation).toBe(
      'fade',
    );
  });

  it('warns and ignores a malformed metadata export', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': { default: Home, metadata: 'nope' },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('index');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('metadata'),
    );
  });

  it('warns and keeps the static metadata when generateMetadata throws', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': {
        default: Home,
        metadata: { title: 'Estático' },
        generateMetadata: () => {
          throw new Error('boom');
        },
      },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('Estático');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('generateMetadata'),
    );
  });

  it('warns and ignores a non-function generateMetadata export', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: StackLayout },
      './index.tsx': {
        default: Home,
        metadata: { title: 'Estático' },
        generateMetadata: 42,
      },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('Estático');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('generateMetadata'),
    );
  });
});

describe('metadata in Tabs', () => {
  it('reads title and tab icon of every sibling when mounting the bar', async () => {
    const ctx = fakeContext({
      './(tabs)/layout.tsx': { default: () => <Tabs /> },
      './(tabs)/home.tsx': {
        default: Home,
        metadata: {
          title: 'Inicio',
          tab: {
            icon: ({ focused }: { focused: boolean }) => (
              <Text testID="icon-home">{focused ? 'H' : 'h'}</Text>
            ),
          },
        },
      },
      './(tabs)/profile.tsx': {
        default: () => <Text>Profile screen</Text>,
        metadata: {
          title: 'Perfil',
          tab: { icon: () => <Text testID="icon-profile">p</Text> },
        },
      },
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
    expect(screen.getByTestId('icon-home')).toHaveTextContent('H');
    expect(screen.getByTestId('icon-profile')).toBeTruthy();
  });

  it('reads the index tab metadata from the folder index module', async () => {
    const ctx = fakeContext({
      './(tabs)/layout.tsx': { default: () => <Tabs /> },
      './(tabs)/index.tsx': { default: Home, metadata: { title: 'Casa' } },
      './(tabs)/profile.tsx': { default: () => <Text>Profile screen</Text> },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByText('Casa')).toBeTruthy();
    expect(screen.getByText('profile')).toBeTruthy();
  });

  it('lets explicit Tabs.Screen options win but falls back to metadata per field', async () => {
    const Layout = () => (
      <Tabs>
        <Tabs.Screen name="home" options={{ title: 'Explícita' }} />
        <Tabs.Screen name="profile" />
      </Tabs>
    );
    const ctx = fakeContext({
      './(tabs)/layout.tsx': { default: Layout },
      './(tabs)/home.tsx': {
        default: Home,
        metadata: {
          title: 'Meta',
          tab: { icon: () => <Text testID="icon-h">i</Text> },
        },
      },
      './(tabs)/profile.tsx': {
        default: () => <Text>Profile screen</Text>,
        metadata: { title: 'Perfil' },
      },
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    expect(screen.getByText('Explícita')).toBeTruthy();
    expect(screen.queryByText('Meta')).toBeNull();
    expect(screen.getByTestId('icon-h')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
  });
});
