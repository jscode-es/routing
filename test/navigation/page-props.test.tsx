import React from 'react';
import { Text, View } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { RootRouter } from '../../src/navigation/RootRouter';
import { router } from '../../src/navigation/router';
import type { RequireContext } from '../../src/route-tree/context';
import type { LayoutProps, PageProps } from '../../src/navigation/page-props';

type RouteModule = Record<string, unknown>;

function fakeContext(modules: Record<string, RouteModule>): RequireContext {
  const ctx = ((key: string) => modules[key]!) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = ({ params, pathname }: PageProps) => (
  <Text>{`home:${Object.keys(params).length}:${pathname}`}</Text>
);

describe('page props', () => {
  it('passes params and pathname to a dynamic page', async () => {
    const User = ({ params, pathname }: PageProps<{ id: string }>) => (
      <Text>{`${params.id}|${pathname}`}</Text>
    );
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './users/[id].tsx': { default: User },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/users/42');
    });
    expect(screen.getByText('42|/users/42')).toBeTruthy();
  });

  it('passes empty params and the root pathname to an index page', async () => {
    const ctx = fakeContext({ './index.tsx': { default: Home } });
    await render(<RootRouter context={ctx} />);
    expect(screen.getByText('home:0:/')).toBeTruthy();
  });

  it('passes catch-all params as an array', async () => {
    const Blog = ({ params }: PageProps<{ slug: string[] }>) => (
      <Text>{params.slug.join('-')}</Text>
    );
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './blog/[...slug].tsx': { default: Blog },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/blog/a/b');
    });
    expect(screen.getByText('a-b')).toBeTruthy();
  });

  it('background screens keep their own params prop', async () => {
    const User = ({ params }: PageProps<{ id: string }>) => (
      <Text>{`User ${params.id}`}</Text>
    );
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './users/[id].tsx': { default: User },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/users/42');
    });
    await act(async () => {
      router.push('/users/7');
    });
    expect(screen.getByText('User 42')).toBeTruthy();
    expect(screen.getByText('User 7')).toBeTruthy();
  });

  it('passes params, pathname and children to a layout component', async () => {
    const Shell = ({ children, pathname, params }: LayoutProps) => (
      <View>
        <Text>{`shell:${pathname}:${String(params.id ?? '-')}`}</Text>
        {children}
      </View>
    );
    const SecDetails = () => <Text>Details</Text>;
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './sec/layout.tsx': { default: Shell },
      './sec/index.tsx': { default: () => <Text>Sec home</Text> },
      './sec/[id].tsx': { default: SecDetails },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/sec');
    });
    expect(screen.getByText('shell:/sec:-')).toBeTruthy();

    await act(async () => {
      router.push('/sec/9');
    });
    // El layout ve la entrada superior de su grupo: pathname y params al día.
    expect(screen.getByText('shell:/sec/9:9')).toBeTruthy();
    expect(screen.getByText('Details')).toBeTruthy();
  });
});
