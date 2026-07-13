import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from '../../src/navigation/RootRouter';
import { Link } from '../../src/navigation/Link';
import { useLocalSearchParams } from '../../src/navigation/hooks';
import type { RequireContext } from '../../src/route-tree/context';

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => <Link href="/users/42">Go to user</Link>;
const HomeReplace = () => (
  <Link href="/users/42" replace>
    Go to user
  </Link>
);
const User = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>{`User ${id}`}</Text>;
};

describe('Link', () => {
  it('renders its children and navigates on press', async () => {
    const ctx = fakeContext({
      './index.tsx': Home,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    await fireEvent.press(screen.getByText('Go to user'));
    expect(screen.getByText('User 42')).toBeTruthy();
  });

  it('supports replace navigation', async () => {
    const ctx = fakeContext({
      './index.tsx': HomeReplace,
      './users/[id].tsx': User,
    });
    await render(<RootRouter context={ctx} />);
    await fireEvent.press(screen.getByText('Go to user'));
    expect(screen.getByText('User 42')).toBeTruthy();
  });
});
