'use strict';

// JS plano (no TS): babel.config.js de la app consumidora lo carga con Node
// directamente, sin paso de build previo.

const path = require('path');

// Coincide tanto con src/route-tree/app-context.ts (condición react-native)
// como con dist/route-tree/app-context.js (build CJS).
const APP_CONTEXT_FILE = /[\\/]route-tree[\\/]app-context\.[jt]s$/;

module.exports = function routingBabelPlugin({ types: t }, options = {}) {
  const root = options.root || './app';

  return {
    name: '@jscode/react-native-routing/babel',
    visitor: {
      FunctionDeclaration(fnPath, state) {
        if (!fnPath.node.id || fnPath.node.id.name !== 'getAppContext') return;
        if (!state.filename || !APP_CONTEXT_FILE.test(state.filename)) return;

        // Metro exige que el path de require.context sea un literal relativo
        // al módulo que lo contiene: se calcula desde app-context hasta el
        // directorio de rutas del proyecto (cwd de babel = projectRoot).
        const appRoot = path.resolve(state.cwd, root);
        let relative = path
          .relative(path.dirname(state.filename), appRoot)
          .replace(/\\/g, '/');
        if (!relative.startsWith('.')) relative = `./${relative}`;

        fnPath.traverse({
          ReturnStatement(returnPath) {
            returnPath.get('argument').replaceWith(
              t.callExpression(
                t.memberExpression(
                  t.identifier('require'),
                  t.identifier('context'),
                ),
                [
                  t.stringLiteral(relative),
                  t.booleanLiteral(true),
                  t.regExpLiteral('\\.[jt]sx?$', ''),
                ],
              ),
            );
            returnPath.stop();
          },
        });
      },
    },
  };
};
