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
    // La primera pantalla es la del grupo (tabs) en el stack raíz implícito.
    expect(screens).toHaveLength(3);
    expect(screens.map((s) => s.props.activityState)).toEqual([2, 2, 0]);
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
    expect(screens.map((s) => s.props.activityState)).toEqual([2, 0, 2]);
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

  it('toggles tab visibility dynamically with the hidden prop', async () => {
    const Layout = () => {
      const [premium, setPremium] = useState(false);
      return (
        <>
          <Pressable testID="toggle" onPress={() => setPremium((p) => !p)}>
            <Text>toggle</Text>
          </Pressable>
          <Tabs hidden={premium ? ['upgrade'] : ['premium']} />
        </>
      );
    };
    const ctx = fakeContext({
      './(tabs)/layout.tsx': Layout,
      './(tabs)/home.tsx': Home,
      './(tabs)/premium.tsx': () => <Text>Premium screen</Text>,
      './(tabs)/upgrade.tsx': () => <Text>Upgrade screen</Text>,
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    expect(screen.getByTestId('tab-upgrade')).toBeTruthy();
    expect(screen.queryByTestId('tab-premium')).toBeNull();

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(screen.getByTestId('tab-premium')).toBeTruthy();
    expect(screen.queryByTestId('tab-upgrade')).toBeNull();
  });

  it('renders the animated indicator', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    expect(screen.getByTestId('tab-indicator')).toBeTruthy();
  });

  it('wraps the tab bar in a bottom safe area', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    const safeAreas = screen.getAllByTestId('safe-area');
    // La superior la aplica la pantalla sin header del stack raíz implícito.
    expect(safeAreas.map((s) => s.props.edges)).toEqual([
      { top: true },
      { bottom: true },
    ]);
    expect(screen.getByTestId('tab-home')).toBeTruthy();
  });

  it('fades tab content when animation="fade"', async () => {
    const FadeLayout = () => (
      <Tabs animation="fade">
        <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      </Tabs>
    );
    await render(
      <RootRouter context={makeContext(FadeLayout)} initialPath="/home" />,
    );
    expect(screen.getAllByTestId('tab-fade')).toHaveLength(2);

    await fireEvent.press(screen.getByTestId('tab-profile'));
    expect(screen.getByText('Profile screen')).toBeTruthy();
  });

  it('renders without fade wrappers by default', async () => {
    await render(<RootRouter context={makeContext()} initialPath="/home" />);
    expect(screen.queryAllByTestId('tab-fade')).toHaveLength(0);
  });

  it('renders tab icons with focused state and colors', async () => {
    const IconLayout = () => (
      <Tabs>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
            icon: ({ focused, color, size }) => (
              <Text testID="icon-home" style={{ color, fontSize: size }}>
                {focused ? '★' : '☆'}
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            icon: ({ focused }) => (
              <Text testID="icon-profile">{focused ? '●' : '○'}</Text>
            ),
          }}
        />
      </Tabs>
    );
    await render(
      <RootRouter context={makeContext(IconLayout)} initialPath="/home" />,
    );
    expect(screen.getByTestId('icon-home').props.children).toBe('★');
    expect(screen.getByTestId('icon-profile').props.children).toBe('○');

    await fireEvent.press(screen.getByTestId('tab-profile'));
    expect(screen.getByTestId('icon-home').props.children).toBe('☆');
    expect(screen.getByTestId('icon-profile').props.children).toBe('●');
  });

  it('hides labels in icon-only mode with showLabel={false}', async () => {
    const IconOnlyLayout = () => (
      <Tabs showLabel={false}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
            icon: () => <Text testID="icon-home">☆</Text>,
          }}
        />
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      </Tabs>
    );
    await render(
      <RootRouter context={makeContext(IconOnlyLayout)} initialPath="/home" />,
    );
    expect(screen.getByTestId('icon-home')).toBeTruthy();
    expect(screen.queryByText('Inicio')).toBeNull();
    expect(screen.queryByText('Perfil')).toBeNull();
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
