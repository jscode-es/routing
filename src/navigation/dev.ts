declare const __DEV__: boolean;

export function warnDev(message: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(message);
  }
}
