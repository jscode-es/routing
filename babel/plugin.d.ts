declare namespace routingBabelPlugin {
  interface Options {
    /** Directorio de rutas relativo a la raíz del proyecto. Default: './app'. */
    root?: string;
  }
}

declare function routingBabelPlugin(
  api: { types: unknown },
  options?: routingBabelPlugin.Options,
): { name: string; visitor: object };

export = routingBabelPlugin;
