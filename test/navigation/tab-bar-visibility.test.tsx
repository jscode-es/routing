import React from 'react';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { withTiming } from 'react-native-reanimated';
import {
  TabBarVisibilityContext,
  useHideTabBarOnScroll,
} from '../../src/navigation/tab-bar-visibility';

function scrollEvent(y: number): NativeSyntheticEvent<NativeScrollEvent> {
  return { nativeEvent: { contentOffset: { y } } } as NativeSyntheticEvent<NativeScrollEvent>;
}

function withProgress(progress: { value: number }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TabBarVisibilityContext.Provider value={progress as never}>
        {children}
      </TabBarVisibilityContext.Provider>
    );
  };
}

describe('useHideTabBarOnScroll', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses a zero animation duration when reduce motion is enabled', async () => {
    (
      AccessibilityInfo.isReduceMotionEnabled as jest.Mock
    ).mockResolvedValueOnce(true);
    const progress = { value: 0 };
    const { result } = await renderHook(() => useHideTabBarOnScroll(), {
      wrapper: withProgress(progress),
    });
    result.current.onScroll(scrollEvent(10));
    result.current.onScroll(scrollEvent(40));

    expect(withTiming).toHaveBeenCalledWith(1, { duration: 0 });
  });

  it('uses the default duration without reduce motion', async () => {
    const progress = { value: 0 };
    const { result } = await renderHook(() => useHideTabBarOnScroll(), {
      wrapper: withProgress(progress),
    });
    result.current.onScroll(scrollEvent(10));
    result.current.onScroll(scrollEvent(40));

    expect(withTiming).toHaveBeenCalledWith(1, { duration: 200 });
  });

  it('is a no-op outside a Tabs tree (no provider)', async () => {
    const { result } = await renderHook(() => useHideTabBarOnScroll());
    expect(() => result.current.onScroll(scrollEvent(100))).not.toThrow();
  });

  it('keeps the bar visible for small downward scrolls', async () => {
    const progress = { value: 0 };
    const { result } = await renderHook(() => useHideTabBarOnScroll(), {
      wrapper: withProgress(progress),
    });
    result.current.onScroll(scrollEvent(10));
    expect(progress.value).toBe(0);
  });

  it('hides the bar after a sustained downward scroll', async () => {
    const progress = { value: 0 };
    const { result } = await renderHook(() => useHideTabBarOnScroll(), {
      wrapper: withProgress(progress),
    });
    result.current.onScroll(scrollEvent(10));
    result.current.onScroll(scrollEvent(40));
    expect(progress.value).toBe(1);
  });

  it('shows the bar immediately on upward scroll', async () => {
    const progress = { value: 0 };
    const { result } = await renderHook(() => useHideTabBarOnScroll(), {
      wrapper: withProgress(progress),
    });
    result.current.onScroll(scrollEvent(10));
    result.current.onScroll(scrollEvent(40));
    expect(progress.value).toBe(1);

    result.current.onScroll(scrollEvent(30));
    expect(progress.value).toBe(0);
  });

  it('shows the bar when the scroll returns to the top', async () => {
    const progress = { value: 0 };
    const { result } = await renderHook(() => useHideTabBarOnScroll(), {
      wrapper: withProgress(progress),
    });
    result.current.onScroll(scrollEvent(10));
    result.current.onScroll(scrollEvent(40));
    expect(progress.value).toBe(1);

    result.current.onScroll(scrollEvent(0));
    expect(progress.value).toBe(0);
  });
});
