import path from 'node:path';
import { transformSync } from '@babel/core';
import { describe, expect, it } from 'vitest';
import plugin from './plugin';

const PROJECT_ROOT = path.resolve('/project/example');
const APP_CONTEXT_FILENAME = path.join(
  PROJECT_ROOT,
  'node_modules',
  '@jscode',
  'react-native-routing',
  'src',
  'route-tree',
  'app-context.ts',
);

const SOURCE = `export function getAppContext() {
  return null;
}`;

function transform(
  source: string,
  { filename = APP_CONTEXT_FILENAME, options = {} } = {},
): string {
  const result = transformSync(source, {
    filename,
    cwd: PROJECT_ROOT,
    plugins: [[plugin, options]],
    babelrc: false,
    configFile: false,
  });
  if (!result?.code) throw new Error('babel returned no code');
  return result.code;
}

describe('babel plugin', () => {
  it('injects require.context pointing to ./app by default', () => {
    const code = transform(SOURCE);
    expect(code).toContain(
      'require.context("../../../../../app", true, /\\.[jt]sx?$/)',
    );
    expect(code).not.toContain('return null');
  });

  it('honors the root option', () => {
    const code = transform(SOURCE, { options: { root: './src/routes' } });
    expect(code).toContain(
      'require.context("../../../../../src/routes", true, /\\.[jt]sx?$/)',
    );
  });

  it('matches the compiled dist variant of app-context', () => {
    const code = transform(SOURCE, {
      filename: APP_CONTEXT_FILENAME.replace(
        path.join('src', 'route-tree', 'app-context.ts'),
        path.join('dist', 'route-tree', 'app-context.js'),
      ),
    });
    expect(code).toContain('require.context(');
  });

  it('leaves other files untouched', () => {
    const code = transform(SOURCE, {
      filename: path.join(PROJECT_ROOT, 'src', 'app-context.ts'),
    });
    expect(code).toContain('return null');
    expect(code).not.toContain('require.context');
  });

  it('leaves other functions in the app-context module untouched', () => {
    const code = transform(
      `export function somethingElse() {
  return null;
}`,
    );
    expect(code).toContain('return null');
    expect(code).not.toContain('require.context');
  });
});
