import { useSyncExternalStore } from 'react';

let loggedIn = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession(): boolean {
  return useSyncExternalStore(subscribe, () => loggedIn);
}

export function setSession(value: boolean): void {
  loggedIn = value;
  listeners.forEach((listener) => listener());
}
