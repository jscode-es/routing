import React from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Slot } from './Slot';
import type { RequireContext } from '../route-tree/context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => <Text>Home</Text>;
const Settings = () => <Text>Settings</Text>;

describe('RootRouter + Slot', () => {
  it('renders the index route at /', async () => {
    const ctx = fakeContext({ './index.tsx': Home });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('renders the route matching initialPath', async () => {
    const ctx = fakeContext({
      './index.tsx': Home,
      './settings.tsx': Settings,
    });
    await render(<RootRouter context={ctx} initialPath="/settings" />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.queryByText('Home')).toBeNull();
  });

  it('renders a root layout around the matched child via Slot', async () => {
    const Layout = () => (
      <View testID="layout">
        <Text>Shell</Text>
        <Slot />
      </View>
    );
    const ctx = fakeContext({
      './layout.tsx': Layout,
      './index.tsx': Home,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByTestId('layout')).toBeTruthy();
    expect(screen.getByText('Shell')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('renders nested layouts in order', async () => {
    const RootLayout = () => (
      <View>
        <Text>Root shell</Text>
        <Slot />
      </View>
    );
    const TabsLayout = () => (
      <View>
        <Text>Tabs shell</Text>
        <Slot />
      </View>
    );
    const ctx = fakeContext({
      './layout.tsx': RootLayout,
      './(tabs)/layout.tsx': TabsLayout,
      './(tabs)/home.tsx': Home,
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    expect(screen.getByText('Root shell')).toBeTruthy();
    expect(screen.getByText('Tabs shell')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('renders nothing when no route matches', async () => {
    const ctx = fakeContext({ './index.tsx': Home });
    await render(<RootRouter context={ctx} initialPath="/nope" />);
    expect(screen.queryByText('Home')).toBeNull();
  });
});
