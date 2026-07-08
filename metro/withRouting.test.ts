import { describe, it, expect } from 'vitest';
import { withRouting } from './withRouting';

describe('withRouting', () => {
  it('enables unstable_allowRequireContext', () => {
    const config = withRouting({});
    expect(config.transformer?.unstable_allowRequireContext).toBe(true);
  });

  it('preserves existing transformer options', () => {
    const config = withRouting({
      transformer: { minifierPath: 'custom-minifier' },
    });
    expect(config.transformer?.minifierPath).toBe('custom-minifier');
    expect(config.transformer?.unstable_allowRequireContext).toBe(true);
  });

  it('preserves unrelated top-level config', () => {
    const resolver = { sourceExts: ['ts', 'tsx'] };
    const config = withRouting({ resolver, watchFolders: ['/x'] });
    expect(config.resolver).toBe(resolver);
    expect(config.watchFolders).toEqual(['/x']);
  });

  it('does not mutate the input config', () => {
    const input = { transformer: { minifierPath: 'custom-minifier' } };
    withRouting(input);
    expect(input.transformer).toEqual({ minifierPath: 'custom-minifier' });
  });
});
