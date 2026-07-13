import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from '../../src/navigation/RootRouter';
import { Redirect } from '../../src/navigation/Redirect';
import { Stack } from '../../src/navigation/Stack';
import type { RequireContext } from '../../src/route-tree/context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Login = () => <Text>Login screen</Text>;

describe('Redirect', () => {
  it('replaces the current entry instead of pushing', async () => {
    const Layout = () => <Stack />;
    const Guarded = () => <Redirect href="/login" />;
    const ctx = fakeContext({
      './layout.tsx': Layout,
      './index.tsx': Guarded,
      './login.tsx': Login,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByText('Login screen')).toBeTruthy();
    // replace: sin historial extra, una sola pantalla en el stack.
    expect(screen.getAllByTestId('screen')).toHaveLength(1);
  });

  it('guards reactively: kicks out as soon as the session drops', async () => {
    const Profile = ({ session }: { session: boolean }) =>
      session ? <Text>Profile content</Text> : <Redirect href="/login" />;
    const Harness = () => {
      const [session, setSession] = useState(true);
      return (
        <>
          <Profile session={session} />
          <Pressable testID="logout" onPress={() => setSession(false)}>
            <Text>logout</Text>
          </Pressable>
        </>
      );
    };
    const ctx = fakeContext({
      './index.tsx': Harness,
      './login.tsx': Login,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByText('Profile content')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('logout'));
    expect(screen.getByText('Login screen')).toBeTruthy();
    expect(screen.queryByText('Profile content')).toBeNull();
  });

  it('lands on not-found when the target href does not match', async () => {
    const Guarded = () => <Redirect href="/nowhere" />;
    const ctx = fakeContext({
      './index.tsx': Guarded,
    });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByText('404')).toBeTruthy();
  });
});
