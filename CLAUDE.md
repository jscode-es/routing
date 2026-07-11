# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

`@jscode/react-native-routing`: file-based router para React Native puro (sin Expo ni React Navigation). El árbol de rutas y la orquestación de navegación son código propio; solo se apoya en `react-native-screens`, `react-native-gesture-handler` y `react-native-reanimated` como peer dependencies (cero dependencias runtime). Fuera de alcance: web/React DOM.

Docs en `docs/` (leer antes de implementar una feature): `architecture.md` (diseño interno), `file-conventions.md` (notación de rutas), `api-reference.md` (API pública), `roadmap.md` (fases TDD, estado actual y notas técnicas resueltas), `getting-started.md`.

## Comandos

```sh
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint .
npm run test:unit            # vitest: src/route-tree/ y metro/
npm run test:rn              # jest + RNTL: src/navigation/
npm run test                 # ambos
npm run build                # tsc -p tsconfig.build.json → dist/
npm run smoke                # npm pack + require() del tarball instalado
npm run example:android      # app example/ en emulador (workspace)
```

Un solo test:

```sh
npx vitest run src/route-tree/parse.test.ts
npx jest src/navigation/Stack.test.tsx
npx jest -t "nombre del test"
```

## Split de tests (regla dura)

- `src/route-tree/**` y `metro/**` → **vitest** (entorno node, lógica pura).
- `src/navigation/**` → **jest** con `@react-native/jest-preset` + `@testing-library/react-native`. `jest.setup.js` mockea a mano `react-native-screens` (Views planas conservando props para asertar sobre `activityState`, `title`, `onDismissed`…), `react-native-screens/experimental` y `react-native-reanimated` (el mock oficial de reanimated no sirve: importa el módulo nativo de worklets).

Metodología del proyecto: TDD — tests primero, y cada fase termina con verificación manual en `example/` sobre emulador Android (checklist iOS pendiente de Mac; ver roadmap).

## Arquitectura

Tres capas:

1. **`src/route-tree/`** — motor puro: `parse.ts` convierte los `ctx.keys()` de `require.context` en un árbol `RouteNode` (estáticas, `[id]`, `[...slug]`, grupos `(group)`, `layout`, `not-found`); `match.ts` resuelve href/URL → nodo + params (prioridad estático > dinámico > catch-all, grupos transparentes). **Prohibido importar `react`/`react-native` aquí** (ESLint `no-restricted-imports` lo bloquea).
2. **`src/navigation/`** — motor de runtime: `reducer.ts` (PUSH/POP/REPLACE/SET_ACTIVE_TAB/SET_PARAMS sobre una pila de `NavigationEntry`), `NavigationContext.tsx` (resuelve hrefs contra el árbol y registra el router imperativo), `Stack.tsx` (`ScreenStack`/`Screen` nativos), `Tabs.tsx` (pestañas congeladas con `Screen`, indicador reanimated), `linking.ts` (deep linking con el `Linking` del core, derivado del mismo matcher).
3. **API pública** — todo lo exportado sale por `src/index.ts`: `RootRouter`, `Stack`, `Tabs`, `Slot`, `Link`, `Redirect`, `router`, hooks.

Piezas con restricciones no obvias:

- `metro/withRouting.js` y `babel/plugin.js` son **JS plano, sin build**: los ejecuta Node directamente desde `metro.config.js`/`babel.config.js` de la app consumidora. No convertir a TS.
- `<RootRouter />` sin props funciona porque el plugin de Babel (`@jscode/react-native-routing/babel`) reemplaza el `return null` de `getAppContext()` (`src/route-tree/app-context.ts`) por un `require.context` con path relativo al directorio de rutas (opción `root`, default `./app`). El placeholder devuelve `null` (y no un `require.context` con env var) para que sin plugin no haya error de build de Metro, solo un error de runtime claro; el prop `context` sigue siendo el escape hatch.
- Export map dual: la condición `react-native` resuelve `src/index.ts` (Metro + Fast Refresh directo sobre el código fuente); npm/Node consumen `dist/`. `files` publica `dist`, `metro` y `src`.
- `not-found` no es un nodo del árbol: `parse` lo guarda en `root.notFound` y `matchNotFound` fabrica una hoja virtual; hay `DefaultNotFound` si la app no define el suyo.
- Dentro de un `ScreenStack` el `activityState` no puede decrecer (crashea en nativo): las pantallas van siempre a 2 y el congelado se expresa con `freezeOnBlur`/`shouldFreeze`. El contenido con header nativo va en `ScreenContentWrapper` y el `Screen` usa `absoluteFill` (no `flex: 1`).
- `SET_ACTIVE_TAB` conserva la `key` de la entrada superior para que un `Stack` contenedor no remonte su `Screen` al cambiar de pestaña.
- Safe areas: `SafeAreaView` de `react-native-screens/experimental` — no añadir `react-native-safe-area-context`.

## Entorno de desarrollo (Windows)

- La build nativa de Android se hace desde la unidad `subst` `V:` (`subst V: F:\packages\modules\routing`) por el límite de 260 caracteres de ninja; **Metro se arranca desde `F:`** (desde `V:` corrompe el Haste map).
- `example/` se enlaza vía `"file:.."` (npm workspaces no enlaza el paquete raíz); sus paths de Gradle apuntan al `node_modules` raíz hoisted.
- ESLint fijado a 9.x y TypeScript a 5.9.x por compatibilidad de plugins.
