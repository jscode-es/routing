export function withRouting<T extends Record<string, unknown>>(
  config: T,
): T & {
  transformer: Record<string, unknown> & {
    unstable_allowRequireContext: true;
  };
};
