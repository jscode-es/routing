import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Stack } from './Stack';
import { router } from './router';
import type { RequireContext } from '../route-tree/context';

type RouteModule = Record<string, unknown>;

function fakeContext(modules: Record<string, RouteModule>): RequireContext {
  const ctx = ((key: string) => modules[key]!) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => <Text>Home</Text>;
const SecHome = () => <Text>Sec home</Text>;
const SecDetails = () => <Text>Sec details</Text>;

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('declarative navigator (layout.ts)', () => {
  it('mounts Tabs with its props from a component-less navigator export', async () => {
    const ctx = fakeContext({
      './(tabs)/layout.ts': {
        navigator: { type: 'tabs', animation: 'fade', showLabel: false },
      },
      './(tabs)/home.tsx': {
        default: Home,
        metadata: {
          title: 'Inicio',
          tab: { icon: () => <Text testID="icon-home">h</Text> },
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
    // 3 = pantalla del grupo en el stack raíz implícito + una por pestaña.
    expect(screen.getAllByTestId('screen')).toHaveLength(3);
    expect(screen.getAllByTestId('tab-fade').length).toBeGreaterThan(0);
    expect(screen.getByTestId('icon-home')).toBeTruthy();
    expect(screen.getByTestId('icon-profile')).toBeTruthy();
    // showLabel: false → sin etiquetas de texto en la barra.
    expect(screen.queryByText('Inicio')).toBeNull();
    expect(screen.queryByText('Perfil')).toBeNull();
  });

  it('mounts a root stack from a component-less layout.ts', async () => {
    const ctx = fakeContext({
      './layout.ts': { navigator: { type: 'stack' } },
      './index.tsx': { default: Home, metadata: { title: 'Inicio' } },
      './details.tsx': { default: SecDetails, metadata: { title: 'Detalle' } },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('header-config').props.title).toBe('Inicio');

    await act(async () => {
      router.push('/details');
    });
    expect(screen.getAllByTestId('screen')).toHaveLength(2);
    expect(screen.getAllByTestId('header-config')[1]?.props.title).toBe(
      'Detalle',
    );
  });

  it('groups pushes inside a nested stack declared via navigator export', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.ts': { navigator: { type: 'stack' } },
      './sec/index.tsx': { default: SecHome },
      './sec/details.tsx': { default: SecDetails },
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getAllByTestId('screen')).toHaveLength(1);

    await act(async () => {
      router.push('/sec');
    });
    // Raíz: index + grupo sec; interior: sec home.
    expect(screen.getAllByTestId('screen')).toHaveLength(3);

    await act(async () => {
      router.push('/sec/details');
    });
    // El push entra al stack interior declarado, no al exterior.
    expect(screen.getAllByTestId('screen')).toHaveLength(4);
    expect(screen.getByText('Sec home')).toBeTruthy();
    expect(screen.getByText('Sec details')).toBeTruthy();
  });

  it('reproduces the pass-through with a slot navigator export', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.ts': { navigator: { type: 'slot' } },
      './sec/index.tsx': { default: SecHome, metadata: { title: 'Sec' } },
      './sec/details.tsx': {
        default: SecDetails,
        metadata: { title: 'Detalle sec' },
      },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    await act(async () => {
      router.push('/sec/details');
    });
    // Sin navegador propio: cada entrada es una pantalla del stack raíz.
    expect(screen.getAllByTestId('screen')).toHaveLength(3);
    const headers = screen.getAllByTestId('header-config');
    expect(headers[1]?.props.title).toBe('Sec');
    expect(headers[2]?.props.title).toBe('Detalle sec');
  });

  it('orders the tabs with the navigator order config', async () => {
    const ctx = fakeContext({
      './(tabs)/layout.ts': {
        navigator: { type: 'tabs', order: ['profile', 'settings', 'home'] },
      },
      './(tabs)/home.tsx': { default: Home },
      './(tabs)/profile.tsx': { default: () => <Text>P</Text> },
      './(tabs)/settings.tsx': { default: () => <Text>S</Text> },
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    const names = screen
      .getAllByTestId(/^tab-/)
      .map((tab) => tab.props.testID as string)
      .filter((id) => id !== 'tab-indicator');
    expect(names).toEqual(['tab-profile', 'tab-settings', 'tab-home']);
  });

  it('keeps unlisted tabs after the ordered ones, in file order', async () => {
    const ctx = fakeContext({
      './(tabs)/layout.ts': {
        navigator: { type: 'tabs', order: ['settings'] },
      },
      './(tabs)/index.tsx': { default: Home },
      './(tabs)/profile.tsx': { default: () => <Text>P</Text> },
      './(tabs)/settings.tsx': { default: () => <Text>S</Text> },
    });
    await render(<RootRouter context={ctx} />);
    const names = screen
      .getAllByTestId(/^tab-/)
      .map((tab) => tab.props.testID as string)
      .filter((id) => id !== 'tab-indicator');
    expect(names).toEqual(['tab-settings', 'tab-index', 'tab-profile']);
  });

  it('warns and falls back to pass-through on a malformed navigator export', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.ts': { navigator: { type: 'drawer' } },
      './sec/index.tsx': { default: SecHome },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    expect(screen.getByText('Sec home')).toBeTruthy();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('navigator'));
  });
});

describe('layout children contract', () => {
  it('passes the declared navigator as children of the layout component', async () => {
    const Shell = ({ children }: { children?: ReactNode }) => (
      <View testID="shell">{children}</View>
    );
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.tsx': { default: Shell, navigator: { type: 'stack' } },
      './sec/index.tsx': { default: SecHome },
      './sec/details.tsx': { default: SecDetails },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    await act(async () => {
      router.push('/sec/details');
    });
    expect(screen.getByTestId('shell')).toBeTruthy();
    // children es el stack interior: el push agrupa dentro, no fuera.
    expect(screen.getAllByTestId('screen')).toHaveLength(4);
    expect(screen.getByText('Sec details')).toBeTruthy();
  });

  it('does not remount the layout when navigating between its children', async () => {
    const mounts = jest.fn();
    const Shell = ({ children }: { children?: ReactNode }) => {
      useEffect(() => {
        mounts();
      }, []);
      return <View testID="shell">{children}</View>;
    };
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.tsx': { default: Shell, navigator: { type: 'stack' } },
      './sec/index.tsx': { default: SecHome },
      './sec/details.tsx': { default: SecDetails },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    await act(async () => {
      router.push('/sec/details');
    });
    await act(async () => {
      router.back();
    });
    expect(mounts).toHaveBeenCalledTimes(1);
  });

  it('does not remount a tabs shell when switching tabs', async () => {
    const mounts = jest.fn();
    const TabsShell = ({ children }: { children?: ReactNode }) => {
      useEffect(() => {
        mounts();
      }, []);
      return <View testID="tabs-shell">{children}</View>;
    };
    const ctx = fakeContext({
      './(tabs)/layout.tsx': {
        default: TabsShell,
        navigator: { type: 'tabs' },
      },
      './(tabs)/home.tsx': { default: Home, metadata: { title: 'Inicio' } },
      './(tabs)/profile.tsx': {
        default: () => <Text>Profile screen</Text>,
        metadata: { title: 'Perfil' },
      },
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    expect(screen.getByTestId('tabs-shell')).toBeTruthy();
    expect(screen.getByText('Inicio')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-profile'));
    expect(mounts).toHaveBeenCalledTimes(1);
  });

  it('keeps the manual mode: a layout mounting its own navigator, no warning', async () => {
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.tsx': { default: () => <Stack /> },
      './sec/index.tsx': { default: SecHome },
      './sec/details.tsx': { default: SecDetails },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    await act(async () => {
      router.push('/sec/details');
    });
    expect(screen.getAllByTestId('screen')).toHaveLength(4);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns in dev when a layout renders both its own navigator and children', async () => {
    const Doubled = ({ children }: { children?: ReactNode }) => (
      <View>
        <Stack />
        {children}
      </View>
    );
    const ctx = fakeContext({
      './layout.tsx': { default: () => <Stack /> },
      './index.tsx': { default: Home },
      './sec/layout.tsx': { default: Doubled, navigator: { type: 'stack' } },
      './sec/index.tsx': { default: SecHome },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('navigator'),
    );
  });
});
