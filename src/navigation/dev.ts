declare const __DEV__: boolean;

export function warnDev(message: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(message);
  }
}

export function logDev(message: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(message);
  }
}
