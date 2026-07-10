# Plan de desarrollo (TDD por fases)

> Módulo **para React Native** (iOS/Android). Cada fase se desarrolla con
> TDD (tests primero) y termina con algo verificable en la app `example/`
> sobre un dispositivo/emulador real.

Metodología: el motor puro (`src/route-tree/`) se testea con **vitest**;
todo lo que toca React Native (`src/navigation/`) con **Jest +
@testing-library/react-native**. Verificación por fase:

```sh
npm run test:unit        # vitest (route-tree, metro)
npm run test:rn          # jest + RNTL (navigation)
npm run typecheck
npm run lint
npm run example:android  # demo en emulador/dispositivo Android
```

La verificación en **iOS** queda pendiente hasta disponer de un Mac (el
desarrollo se hace en Windows). El código y la configuración se escriben
para ambas plataformas desde el principio; el checklist iOS de cada fase
está anotado abajo como pendiente.

---

## Fase 0 — Esqueleto y tooling ✅

- [x] `git init`, `.gitignore`, `package.json` con npm workspaces (`example/`)
- [x] TypeScript strict, ESLint 9 flat config, split vitest/jest
- [x] Peer deps: `react-native-screens`, `react-native-gesture-handler`,
      `react-native-reanimated`, `react-native-worklets`
- [x] App `example/` generada con `@react-native-community/cli` (RN 0.86,
      Nueva Arquitectura), enlazada vía `file:..`
- [x] Docs corregidos: `RootRouter context={...}` como prop, reanimated v4
      + worklets como peer
- [x] **Demo**: app del template arrancando en emulador Android

Notas de entorno (Windows) que quedaron resueltas aquí:

- ESLint 10 y TypeScript 7 aún no son compatibles con los plugins
  (`eslint-plugin-react`, `typescript-eslint`) → fijados a 9.x / 5.9.x.
- El límite de 260 caracteres de ninja rompe la build C++ del codegen →
  se compila desde una unidad corta (`subst V: F:\packages\modules\routing`)
  y con `reactNativeArchitectures=arm64-v8a,x86_64`.
- Metro no funciona bien desde la unidad `subst` (mezcla `V:`/`F:` en el
  Haste map) → **Gradle desde `V:`, Metro desde `F:`**.
- npm workspaces no enlaza el paquete raíz como dependencia de `example/`
  → se usa `"@jscode/react-native-routing": "file:.."`.
- Los paths de Gradle del template asumen `example/node_modules` → se
  apuntan al `node_modules` raíz (hoisting): `settings.gradle` y el bloque
  `react {}` de `app/build.gradle`.

## Fase 1 — Motor de rutas puro: parser + matcher ✅

- [x] `parse.test.ts` + `parse.ts`: estáticas, `index`, `[id]`,
      `[...slug]`, grupos `(group)`, `_layout`, `+not-found`, error por
      conflicto `foo.tsx` + `foo/index.tsx`
- [x] `match.test.ts` + `match.ts`: extracción de params, prioridad
      estático > dinámico, catch-all multi-segmento, grupos transparentes,
      normalización de barra final, cadena de nodos root→hoja
- [x] Regla ESLint `no-restricted-imports`: `src/route-tree/` no puede
      importar `react`/`react-native`
- [x] Sin demo visual (fase de lógica pura, asumido en el plan)

## Fase 2 — Metro wiring + RootRouter + Slot ✅

- [x] `withRouting` (activa `unstable_allowRequireContext` sin pisar
      config existente) — en JS plano porque `metro.config.js` lo ejecuta
      Node sin build previo
- [x] `buildRouteTree(ctx)` con error claro si falta el default export
- [x] `RootRouter` (recibe `context`, envuelve `GestureHandlerRootView`),
      `Slot`, layouts anidados
- [x] Export map dual: Metro resuelve `src/` (condición `react-native`,
      Fast Refresh directo sobre el código del paquete), npm consume `dist/`
- [x] **Demo**: "Home" desde `example/app/index.tsx` + Fast Refresh
      verificado en emulador

## Fase 3 — Estado de navegación, hooks, router imperativo, Link ✅

- [x] `reducer.ts`: PUSH/POP (guarda en raíz)/REPLACE/SET_PARAMS, keys únicas
- [x] `NavigationProvider`: resuelve `href` contra el árbol (error claro si
      no hay match), registra el router imperativo
- [x] Hooks: `useRouter`, `useLocalSearchParams` (consciente de la
      profundidad: un layout no ve los params de la hoja),
      `useGlobalSearchParams`, `usePathname`, `useSegments`
- [x] `router` imperativo (error claro si `RootRouter` no está montado)
- [x] `<Link href replace>`
- [x] **Demo**: Home → Link → "User 42" → botón Volver → Home, en emulador

## Fase 4 — Stack nativo (react-native-screens) ✅ (iOS pendiente)

- [x] Mock manual de `react-native-screens` en `jest.setup.js`
- [x] `stack-options.test.ts`: nombre de pantalla por entrada,
      `collectScreenConfigs` de `<Stack.Screen>`, handler del botón atrás
- [x] `Stack.test.tsx`: un `Screen` por entrada, `activityState`
      activo/congelado, header nativo con título, `onDismissed` → POP,
      params propios por pantalla en background
- [x] Implementar `stack-options.ts` y `Stack.tsx` (`ScreenStack` +
      `Screen` + `ScreenStackHeaderConfig`, `EntryContext` por pantalla,
      `BackHandler` de Android)
- [x] Tests en verde + typecheck + lint
- [x] `example/`: `_layout.tsx` con `<Stack>` y títulos; quitar el botón
      "Volver" temporal
- [x] **Checklist manual Android**: transición push/pop fluida, botón
      físico atrás (no cierra la app salvo en raíz), header nativo con
      título correcto, `presentation: 'modal'`
- [ ] **Checklist iOS (pendiente de Mac)**: swipe-to-go-back real y su
      cancelación a mitad de gesto, modal estilo iOS

## Fase 5 — Tabs nativo ✅ (iOS pendiente)

- [x] TDD: `tabs-options.test.ts`, acción `SET_ACTIVE_TAB` en el reducer,
      `Tabs.test.tsx` (pestaña activa en foreground, resto congeladas)
- [x] Implementar `Tabs.tsx`: barra con `View`/`Pressable`/`Text` del core,
      contenido de cada pestaña en `Screen` (congelado nativo), indicador
      animado con reanimated
- [x] `example/`: reestructurar con `(auth)/login.tsx` y
      `(tabs)/_layout.tsx` (Home/Profile)
- [x] **Checklist manual Android**: cambiar de tab conserva el estado
      (un `TextInput` no se resetea), indicador fluido
- [ ] **Checklist iOS (pendiente de Mac)**

Notas técnicas que quedaron resueltas aquí:

- `SET_ACTIVE_TAB` conserva la `key` de la entrada superior: un `Stack`
  contenedor no remonta su `Screen` al cambiar de pestaña (no se pierde el
  estado de las tabs).
- Dentro de un `ScreenStack` nativo el `activityState` no puede decrecer
  (2 → 0 lanza en nativo): las pantallas van siempre a 2 y el congelado se
  expresa con `freezeOnBlur`/`shouldFreeze`.
- El contenido de un `Screen` con header nativo debe ir en un
  `ScreenContentWrapper` (nunca con el header config como primer hijo) y el
  `Screen` debe usar `absoluteFill`, no `flex: 1`: el nativo fija la altura
  real (viewport menos header) vía state update de Fabric y `flexGrow` la
  pisaría, recortando el borde inferior (la barra de tabs quedaba fuera de
  pantalla).

## Fase 6 — Layouts anidados, grupos, not-found ✅

- [x] TDD: integración en `RootRouter.test.tsx` (path inexistente →
      `+not-found`, pass-through implícito sin `_layout`), `parse.test.ts`
      con 3 niveles de anidamiento
- [x] `example/`: mini-`<Stack>` dentro de `(tabs)/settings/_layout.tsx`,
      `app/+not-found.tsx`, un `<Link>` roto visible
- [x] **Checklist manual Android**: link roto → not-found; sub-stack de
      settings independiente del stack raíz

Notas técnicas que quedaron resueltas aquí:

- `matchNotFound` fabrica una hoja virtual para `+not-found` (parse la
  guarda en `root.notFound`, no como nodo); push/replace e initialPath
  caen a ella cuando no hay match (y siguen lanzando si tampoco hay
  `+not-found`).
- `Stack` acota sus entradas al subárbol de su layout (vía `EntryContext`)
  y agrupa las entradas consecutivas cuyo hijo directo tiene `_layout`
  propio en una sola `Screen`: el push entra al navegador anidado sin
  apilar en el exterior. Limitación deliberada: un navegador anidado debe
  colgar de un hijo directo con `_layout`.

## Fase 7 — Deep linking ✅ (iOS pendiente)

- [x] TDD: `linking.test.ts` mockeando `Linking` de RN (`getInitialURL`,
      `addEventListener('url')`, resolución reutilizando `match.ts`)
- [x] `example/`: intent-filter `routingexample://` en `AndroidManifest.xml`
      (+ `Info.plist` preparado para iOS), pantalla `app/share/[id].tsx`
- [x] **Checklist manual Android** (frío y caliente):
      `adb shell am start -W -a android.intent.action.VIEW -d "routingexample://share/42" es.jscode.routingexample`
- [ ] **Checklist iOS (pendiente de Mac)**: `xcrun simctl openurl booted routingexample://share/42`

Notas: `urlToPath` trata el "host" del esquema propio como primer segmento
(`routingexample://share/42` → `/share/42`); `getInitialURL` hace `replace`
(sin historial en frío) y los eventos `url` hacen `push`; una URL sin match
cae en `+not-found`.

## Fase 8 — Pulido y empaquetado npm ⏳

- [ ] `npm run build` → `dist/` (CJS + `.d.ts`) correcto
- [ ] Script de humo: `npm pack` + instalar el tarball en un directorio
      aparte y hacer `require()` de los entry points
- [ ] `package.json` final (`exports`, `files`, `sideEffects`)
- [ ] Actualizar docs con los valores reales fijados durante el desarrollo
- [ ] LICENSE + README raíz del paquete
- [ ] Regresión final en Android contra el tarball empaquetado
- [ ] **Antes del release 1.0**: completar todos los checklist iOS en un Mac
      (`pod install`, swipe back, modales, deep links)

---

## Lo que no cubre el TDD automatizado (verificación manual)

| Aspecto | Cómo se verifica | Estado |
|---|---|---|
| Fluidez de transiciones push/pop | A mano en emulador/dispositivo | ✅ Fase 4 |
| Botón físico "atrás" Android | A mano | ✅ Fase 4 |
| Swipe-to-go-back iOS y su cancelación | A mano en iOS | Pendiente de Mac |
| Congelado real de pantallas tapadas | Contador de renders + profiler nativo | Fase 4/5 |
| Estado de pestañas al cambiar de tab | `TextInput` sin resetear | ✅ Fase 5 |
| Deep link desde fuera de la app (frío/caliente) | `adb` / `xcrun simctl` | ✅ Fase 7 (Android) |
| Fast Refresh reevaluando `require.context` | Editar con la app corriendo | ✅ Fase 2 |
