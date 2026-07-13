import React from 'react';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { RootRouter } from '../../src/navigation/RootRouter';
import { router } from '../../src/navigation/router';
import type { RequireContext } from '../../src/route-tree/context';

type RouteModule = Record<string, unknown>;

function fakeContext(modules: Record<string, RouteModule>): RequireContext {
  const ctx = ((key: string) => modules[key]!) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const Home = () => <Text>Home</Text>;
const Details = () => <Text>Details</Text>;
const SecHome = () => <Text>Sec home</Text>;
const SecDetails = () => <Text>Sec details</Text>;

describe('implicit stack', () => {
  it('mounts a root stack without any layout file', async () => {
    const ctx = fakeContext({
      './index.tsx': { default: Home, metadata: { title: 'Inicio' } },
      './details.tsx': { default: Details, metadata: { title: 'Detalle' } },
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

  it('gives a folder with several routes its own implicit stack', async () => {
    const ctx = fakeContext({
      './index.tsx': { default: Home },
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
    // El push entra al stack implícito de la carpeta, no al raíz.
    expect(screen.getAllByTestId('screen')).toHaveLength(4);
    expect(screen.getByText('Sec details')).toBeTruthy();
  });

  it('keeps a single-leaf folder as a screen of the ancestor stack', async () => {
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './users/[id].tsx': {
        default: () => <Text>User</Text>,
        generateMetadata: ({ params }: { params: { id: string } }) => ({
          title: `Usuario ${params.id}`,
        }),
      },
    });
    await render(<RootRouter context={ctx} />);
    await act(async () => {
      router.push('/users/42');
    });
    // Sin stack propio para users/: la pantalla vive en el stack raíz.
    expect(screen.getAllByTestId('screen')).toHaveLength(2);
    expect(screen.getAllByTestId('header-config')[1]?.props.title).toBe(
      'Usuario 42',
    );
  });

  it('hides the outer header of a group with its own navigator by default', async () => {
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './(tabs)/layout.ts': { navigator: { type: 'tabs' } },
      './(tabs)/home.tsx': { default: () => <Text>Tab home</Text> },
      './(tabs)/profile.tsx': { default: () => <Text>Tab profile</Text> },
    });
    await render(<RootRouter context={ctx} initialPath="/home" />);
    // La pantalla exterior del grupo (tabs) no muestra header: el navegador
    // interior gestiona los suyos.
    const headers = screen.getAllByTestId('header-config');
    expect(headers[0]?.props.hidden).toBe(true);
  });

  it('passes the implicit stack as children of a config-less shell layout', async () => {
    const Shell = ({ children }: { children?: ReactNode }) => (
      <View testID="shell">{children}</View>
    );
    const ctx = fakeContext({
      './index.tsx': { default: Home },
      './sec/layout.tsx': { default: Shell },
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
    // children es el stack implícito de la carpeta: el push agrupa dentro.
    expect(screen.getAllByTestId('screen')).toHaveLength(4);
    expect(screen.getByText('Sec details')).toBeTruthy();
  });
});
