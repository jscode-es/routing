import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import {
  useReduceMotionEnabled,
  useScreenReaderEnabled,
} from '../../src/navigation/accessibility';

function eventHandler(eventName: string): (value: boolean) => void {
  const call = (
    AccessibilityInfo.addEventListener as jest.Mock
  ).mock.calls.find(([name]: [string]) => name === eventName);
  if (!call) throw new Error(`No listener registered for ${eventName}`);
  return call[1] as (value: boolean) => void;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('useReduceMotionEnabled', () => {
  it('defaults to false', async () => {
    const { result } = await renderHook(() => useReduceMotionEnabled());
    expect(result.current).toBe(false);
  });

  it('resolves the initial system value', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(
      true,
    );
    const { result } = await renderHook(() => useReduceMotionEnabled());
    expect(result.current).toBe(true);
  });

  it('updates when the reduceMotionChanged event fires', async () => {
    const { result } = await renderHook(() => useReduceMotionEnabled());
    expect(result.current).toBe(false);
    await act(() => {
      eventHandler('reduceMotionChanged')(true);
    });
    expect(result.current).toBe(true);
  });
});

describe('useScreenReaderEnabled', () => {
  it('defaults to false', async () => {
    const { result } = await renderHook(() => useScreenReaderEnabled());
    expect(result.current).toBe(false);
  });

  it('resolves the initial system value', async () => {
    (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValueOnce(
      true,
    );
    const { result } = await renderHook(() => useScreenReaderEnabled());
    expect(result.current).toBe(true);
  });

  it('updates when the screenReaderChanged event fires', async () => {
    const { result } = await renderHook(() => useScreenReaderEnabled());
    expect(result.current).toBe(false);
    await act(() => {
      eventHandler('screenReaderChanged')(true);
    });
    expect(result.current).toBe(true);
  });
});
