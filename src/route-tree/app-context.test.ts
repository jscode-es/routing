import { describe, expect, it } from 'vitest';
import { getAppContext } from './app-context';

describe('getAppContext', () => {
  it('returns null when the babel plugin has not injected a context', () => {
    expect(getAppContext()).toBeNull();
  });
});
