import { router } from '../../src/navigation/router';

describe('imperative router (unmounted)', () => {
  it('throws a clear error when used before RootRouter mounts', () => {
    expect(() => router.push('/anywhere')).toThrow(/RootRouter/);
    expect(() => router.back()).toThrow(/RootRouter/);
    expect(() => router.replace('/x')).toThrow(/RootRouter/);
    expect(() => router.setParams({ a: '1' })).toThrow(/RootRouter/);
  });
});
