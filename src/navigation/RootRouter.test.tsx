import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RootRouter } from './RootRouter';
import { Link } from './Link';
import type { RequireContext } from '../route-tree/context';

const mockGetAppContext = jest.fn<RequireContext | null, []>(() => null);
jest.mock('../route-tree/app-context', () => ({
  getAppContext: () => mockGetAppContext(),
}));

function fakeContext(modules: Record<string, unknown>): RequireContext {
  const ctx = ((key: string) => ({ default: modules[key] })) as RequireContext;
  ctx.keys = () => Object.keys(modules);
  return ctx;
}

const NotFound = () => <Text>Not found</Text>;
const Home = () => <Link href="/nope">broken link</Link>;
const DeepPage = () => <Text>Deep page</Text>;

describe('RootRouter integration', () => {
  it('renders the app not-found route for an unmatched initial path', async () => {
    const ctx = fakeContext({
      './index.tsx': Home,
      './not-found.tsx': NotFound,
    });
    await render(<RootRouter context={ctx} initialPath="/missing/route" />);
    expect(screen.getByText('Not found')).toBeTruthy();
  });

  it('navigates to the app not-found route when a Link points to a missing route', async () => {
    const ctx = fakeContext({
      './index.tsx': Home,
      './not-found.tsx': NotFound,
    });
    await render(<RootRouter context={ctx} />);
    await fireEvent.press(screen.getByText('broken link'));
    expect(screen.getByText('Not found')).toBeTruthy();
  });

  it('falls back to the built-in 404 screen without a not-found route', async () => {
    const ctx = fakeContext({
      './index.tsx': Home,
    });
    await render(<RootRouter context={ctx} />);
    await fireEvent.press(screen.getByText('broken link'));
    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByText('/nope')).toBeTruthy();
    // Con historial, ofrece volver.
    await fireEvent.press(screen.getByText('Go back'));
    expect(screen.getByText('broken link')).toBeTruthy();
  });

  it('passes through nested folders without a layout', async () => {
    const ctx = fakeContext({
      './index.tsx': Home,
      './deep/nested/page.tsx': DeepPage,
    });
    await render(<RootRouter context={ctx} initialPath="/deep/nested/page" />);
    expect(screen.getByText('Deep page')).toBeTruthy();
  });
});

describe('RootRouter without context prop', () => {
  it('falls back to the babel-injected app context', async () => {
    mockGetAppContext.mockReturnValueOnce(
      fakeContext({ './index.tsx': DeepPage }),
    );
    await render(<RootRouter />);
    expect(screen.getByText('Deep page')).toBeTruthy();
  });

  it('throws a clear error when the babel plugin is not configured', async () => {
    mockGetAppContext.mockReturnValueOnce(null);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    let error: unknown;
    try {
      await render(<RootRouter />);
    } catch (e) {
      error = e;
    } finally {
      consoleError.mockRestore();
    }
    expect(String(error)).toContain('@authuser/react-native-routing/babel');
  });
});
