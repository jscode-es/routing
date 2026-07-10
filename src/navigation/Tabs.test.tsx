import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Stack } from './Stack';
import { Tabs } from './Tabs';
import type { RequireContext } from '../route-tree/context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => {
  const [count, setCount] = useState(0);
  return (
    <Pressable testID="inc" onPress={() => setCount((c) => c + 1)}>
      <Text>{`Count ${count}`}</Text>
    </Pressable>
  );
};

const Profile = () => <Text>Profile screen</Text>;

const TabsLayout = () => (
  <Tabs>
    <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
  </Tabs>
);

function makeContext(layout: unknown = TabsLayout) {
  return fakeContext({
    './(tabs)/layout.tsx': layout,
    './(tabs)/home.tsx': Home,
    './(tabs)/profile.tsx': Profile,
  });
}

describe('Tabs', () => {
  it('mounts every tab in its own Screen, active one in foreground', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    const screens = screen.getAllByTestId('screen');
    expect(screens).toHaveLength(2);
    expect(screens.map((s) => s.props.activityState)).toEqual([2, 0]);
    expect(screen.getByText('Count 0')).toBeTruthy();
    expect(screen.getByText('Profile screen')).toBeTruthy();
  });

  it('shows tab bar labels from <Tabs.Screen> options', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
  });

  it('falls back to route names as labels without explicit children', async () => {
    const PlainLayout = () => <Tabs />;
    await render(
      <RootRouter context={makeContext(PlainLayout)} initialPath="/home" />,
    );
    expect(screen.getByText('home')).toBeTruthy();
    expect(screen.getByText('profile')).toBeTruthy();
  });

  it('switches the foreground tab when pressing a tab button', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    await fireEvent.press(screen.getByTestId('tab-profile'));
    const screens = screen.getAllByTestId('screen');
    expect(screens.map((s) => s.props.activityState)).toEqual([0, 2]);
  });

  it('keeps local tab state when switching back and forth', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    await fireEvent.press(screen.getByTestId('inc'));
    await fireEvent.press(screen.getByTestId('inc'));
    expect(screen.getByText('Count 2')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-profile'));
    await fireEvent.press(screen.getByTestId('tab-home'));
    expect(screen.getByText('Count 2')).toBeTruthy();
  });

  it('renders the animated indicator', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    expect(screen.getByTestId('tab-indicator')).toBeTruthy();
  });

  it('wraps the tab bar in a bottom safe area', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    const safeArea = screen.getByTestId('safe-area');
    expect(safeArea.props.edges).toEqual({ bottom: true });
    expect(screen.getByTestId('tab-home')).toBeTruthy();
  });

  it('keeps tab state when nested inside a root Stack', async () => {
    const RootStackLayout = () => <Stack />;
    const ctx = fakeContext({
      './layout.tsx': RootStackLayout,
      './(tabs)/layout.tsx': TabsLayout,
      './(tabs)/home.tsx': Home,
      './(tabs)/profile.tsx': Profile,
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    await fireEvent.press(screen.getByTestId('inc'));
    expect(screen.getByText('Count 1')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-profile'));
    await fireEvent.press(screen.getByTestId('tab-home'));
    expect(screen.getByText('Count 1')).toBeTruthy();
  });
});
