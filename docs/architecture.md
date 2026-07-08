# Arquitectura

> Módulo **para React Native** (iOS/Android) — no para React DOM/web.

**Principio rector: no reinventar las primitivas nativas de bajo nivel,
pero sí el motor de rutas.** Este paquete **no** depende de Expo ni de
React Navigation — el árbol de rutas, la orquestación de navegación
(qué pantalla se monta, `useRouter`, `_layout.tsx`, deep linking) y toda la
API pública son código propio. Pero para las tres cosas donde reescribir
desde cero significaría peor rendimiento y peor consistencia entre
desarrollo y producción — gestión nativa de pantallas/memoria, gestos, y
animaciones — se apoya en tres librerías nativas de bajo nivel, estándar
del ecosistema y preparadas para la Nueva Arquitectura (Fabric/TurboModules):

- **`react-native-screens`** — contenedor de pila nativo (`ScreenStack`/
  `Screen`): las transiciones push/pop y el descongelado/congelado de
  pantallas fuera de pantalla ocurren en la capa nativa, no en JS.
- **`react-native-gesture-handler`** — reconocimiento de gestos (swipe to
  go back, apertura de drawer) en el hilo nativo de UI, no en el hilo de JS.
- **`react-native-reanimated`** — animaciones de transición ejecutadas
  como *worklets* en el hilo de UI vía JSI, con el mismo comportamiento
  tanto si el hilo de JS está ocupado (típico en desarrollo, con Fast
  Refresh/Dev Menu activos) como en una build de producción con Hermes.

Estas tres son exactamente las mismas piezas de bajo nivel sobre las que
React Navigation y Expo Router construyen su propio motor — la diferencia
es que aquí no se adopta el framework completo, solo estas primitivas, y el
árbol de rutas / la orquestación siguen siendo de este paquete.

El paquete tiene tres capas: un **generador del árbol de rutas en
build-time**, un **motor de navegación en runtime** (propio, apoyado en las
tres librerías nativas de arriba), y una capa de **hooks/componentes
públicos**.

## 1. Descubrir archivos: `require.context` de Metro

Metro (el bundler que ya trae `@react-native-community/cli`, no es una
dependencia añadida) no puede leer el sistema de archivos en tiempo de
ejecución, pero desde la versión 0.71+ puede enumerar un directorio de
módulos en tiempo de *bundle* mediante la API (inestable)
`require.context`. Se habilita con un helper de configuración de Metro
propio del paquete:

```js
// metro.config.js
const { withRouting } = require('@jscode/react-native-routing/metro');
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = withRouting(getDefaultConfig(__dirname));
```

`withRouting` activa `transformer.unstable_allowRequireContext = true`.

La llamada a `require.context` la hace la **app consumidora** (no el
paquete): Metro exige que el path sea un string literal resoluble en
build-time relativo al módulo que lo contiene, y el código del paquete vive
en `node_modules`, desde donde no puede apuntar al `app/` del proyecto. Por
eso `RootRouter` recibe el contexto ya evaluado como prop:

```tsx
// App.tsx de la app consumidora
<RootRouter context={require.context('./app', true, /\.[jt]sx?$/)} />
```

`require.context` devuelve cada módulo que coincide junto con sus `key()`
(rutas relativas), que son exactamente las cadenas documentadas en
[file-conventions.md](./file-conventions.md).

## 2. Construir el árbol de rutas

`ctx.keys()` (por ejemplo, `./users/[id].tsx`, `./(tabs)/_layout.tsx`) se
parsea en un árbol anidado:

```ts
interface RouteNode {
  segment: string;            // "users", "[id]", "(tabs)"
  type: 'static' | 'dynamic' | 'catchAll' | 'group';
  paramName?: string;         // para dynamic/catchAll
  component?: ComponentType;  // resuelto vía ctx(key)
  layout?: ComponentType;     // el _layout.tsx de esta carpeta, si existe
  notFound?: ComponentType;
  children: RouteNode[];
}
```

Este paso es puro y testeable de forma aislada (strings de entrada, árbol
de salida) — no depende de React Native, y es la pieza que más conviene
cubrir con tests antes que ninguna otra.

## 3. Motor de navegación (propio, sobre primitivas nativas)

La orquestación (qué pantalla está activa, el árbol de navegadores, los
hooks) es propia de este paquete. El renderizado y la interacción de bajo
nivel se apoyan en `react-native-screens` / `react-native-gesture-handler`
/ `react-native-reanimated`.

### 3.1 Estado de navegación

Un `useReducer` en un `NavigationContext` propio mantiene la pila de
entradas activas por navegador:

```ts
interface NavigationEntry {
  key: string;        // identificador único de la instancia de pantalla
  routeNode: RouteNode;
  params: Record<string, string | string[]>;
}

type NavigationState = {
  stack: NavigationEntry[]; // para un Stack
  index: number;             // para un Tabs
};

type NavigationAction =
  | { type: 'PUSH'; entry: NavigationEntry }
  | { type: 'POP' }
  | { type: 'REPLACE'; entry: NavigationEntry }
  | { type: 'SET_PARAMS'; key: string; params: Record<string, unknown> };
```

`router.push/replace/back` (ver [api-reference.md](./api-reference.md))
son azúcar sintáctico sobre `dispatch` de este reducer, resuelto contra el
árbol de rutas para encontrar el `RouteNode` que coincide con el `href`.

### 3.2 `<Stack>`: pantallas, transiciones y gesto de volver

- Cada pantalla de la pila se renderiza dentro de un `<Screen>` de
  `react-native-screens`, todos ellos dentro de un `<ScreenStack>` — el
  contenedor nativo que ya usan React Navigation/Expo Router internamente.
  Esto delega en la capa nativa (no en JS) tanto las transiciones estándar
  push/pop como el "congelado" de pantallas que quedan tapadas (deja de
  reconciliar/renderizar su árbol de React mientras no son visibles,
  liberando CPU y memoria sin código propio).
- El gesto de "volver deslizando desde el borde" en iOS se activa con el
  prop nativo `gestureEnabled` de `<Screen>` (gesto 100% nativo, sin JS).
  Para gestos propios del paquete que no cubre `react-native-screens`
  (por ejemplo, el drawer de la sección 6/trabajo futuro), se usa
  `react-native-gesture-handler` (`Gesture.Pan()` + `GestureDetector`),
  que reconoce el gesto en el hilo de UI en vez del hilo de JS.
- Las transiciones personalizadas (cuando `_layout.tsx` pide una animación
  distinta a la nativa por defecto, por ejemplo un fade o un slide
  vertical) se implementan con `react-native-reanimated`
  (`useSharedValue` + `useAnimatedStyle` + `withTiming`/`withSpring`),
  ejecutándose como *worklet* en el hilo de UI vía JSI — no en el hilo de
  JS, así que el rendimiento no depende de si el JS thread está ocupado
  (evita el jank típico en desarrollo con Fast Refresh, y se comporta
  igual en una build de producción).
- El botón físico de "atrás" en Android se captura con
  `BackHandler.addEventListener('hardwareBackPress', …)` (core de RN) para
  hacer `router.back()`.
- Áreas seguras (notch, barra de estado) se resuelven con el componente
  `SafeAreaView` que ya trae `react-native` — no se añade
  `react-native-safe-area-context` porque no es una pieza de rendimiento
  crítico, solo cálculo de insets.

### 3.3 `<Tabs>`: barra de pestañas

- Cada contenido de pestaña también se renderiza dentro de un `<Screen>`
  de `react-native-screens`, para que las pestañas no activas queden
  congeladas nativamente en vez de seguir montadas en JS.
- Barra inferior construida con `View`/`Pressable`/`Text`/`Image` (del
  core), sin librería de iconos ni de tabs — el indicador de pestaña
  activa se anima con `react-native-reanimated`.

### 3.4 Por qué estas tres librerías y no otras

- Son las mismas primitivas de bajo nivel que ya usan React Navigation y
  Expo Router — adoptarlas no es "acoplarse a un framework de navegación",
  es no reescribir gestión de memoria nativa, reconocimiento de gestos y
  animación de hilo de UI, que son problemas ya resueltos y muy afinados.
- Las tres tienen soporte explícito para la Nueva Arquitectura
  (Fabric/TurboModules), lo que evita el bridge JSON asíncrono como cuello
  de botella tanto en desarrollo como en producción.
- Al no depender del hilo de JS para gestos/animaciones, el
  comportamiento visual es consistente entre Metro en modo desarrollo
  (JS sin minificar, con overhead de dev tools) y una build de producción
  con Hermes — que es precisamente el problema que tenía la versión
  100% `Animated`/`PanResponder` del core.

## 4. Deep linking

Se usa el módulo `Linking` que ya trae `react-native` en su core (no
`expo-linking`):

- `Linking.getInitialURL()` al arrancar, para resolver la pantalla inicial
  si la app se abrió desde un enlace.
- `Linking.addEventListener('url', …)` para enlaces recibidos con la app
  ya abierta.
- La URL recibida se convierte en `path` + `params` con el mismo matcher
  que resuelve `router.push('/users/42')` contra el árbol de rutas — no
  hace falta una config de linking separada, se deriva del árbol.

La configuración de esquemas de URL / Universal Links / App Links sigue
haciéndose donde siempre: `Info.plist` / `AndroidManifest.xml` en el
proyecto de la app (esto no lo puede resolver un paquete de JS).

## 5. Dependencias

```json
{
  "peerDependencies": {
    "react": "*",
    "react-native": "*",
    "react-native-screens": ">=3.29.0",
    "react-native-gesture-handler": ">=2.14.0",
    "react-native-reanimated": ">=4.0.0",
    "react-native-worklets": ">=0.5.0"
  },
  "dependencies": {}
}
```

Sin dependencias runtime propias. Nada de `@react-navigation/*`, nada de
`react-native-safe-area-context`, nada de `expo`. Las peer dependencies
son deliberadas: cubren gestión nativa de pantallas, gestos y animación
(sección 3.4) — `react-native-worklets` es el runtime de worklets que
`react-native-reanimated` v4+ requiere como paquete separado. Todo lo demás
(árbol de rutas, `_layout.tsx`, hooks, deep linking) es código propio del
paquete.

## 6. Estructura del paquete (propuesta)

```
routing/
  package.json
  metro/
    withRouting.ts        # helper de metro.config.js (activa unstable_allowRequireContext)
  src/
    route-tree/
      parse.ts             # ctx.keys() -> árbol RouteNode (puro, con tests unitarios)
      match.ts              # href/URL -> RouteNode + params (usado por router y deep linking)
      types.ts
    navigation/
      NavigationContext.tsx # reducer + contexto de estado de navegación
      RootRouter.tsx         # componente de entrada (envuelve GestureHandlerRootView)
      Stack.tsx              # navegador de pila (react-native-screens + reanimated)
      Tabs.tsx                # navegador de pestañas (react-native-screens)
      Slot.tsx
      Link.tsx
      router.ts               # API imperativa (push/replace/back)
      hooks.ts                # useRouter, useLocalSearchParams, usePathname, useSegments
      linking.ts               # integración con el Linking del core de RN
  docs/
  README.md
```

## Fast refresh / añadir archivos nuevos

Metro reevalúa `require.context` con Fast Refresh cada vez que cambia un
módulo dentro del directorio observado, incluyendo archivos nuevos, así que
no hace falta un proceso de watch separado ni un paso de codegen por CLI
para el flujo habitual de añadir una pantalla.

## Trabajo futuro

- **Catch-all opcional** (`[[...slug]].tsx`), replicando la semántica del
  catch-all opcional de Next.js.
- **Rutas tipadas**: generar un `.d.ts` con la unión de strings `href`
  válidos a partir del mismo árbol de rutas, para autocompletado en
  `router.push()`, como un segundo paso de codegen puramente aditivo (no
  afecta al motor de navegación descrito en la sección 3).
- **`<Drawer>`**, simétrico a `<Stack>`/`<Tabs>`, implementado con
  `react-native-gesture-handler` (gesto de apertura lateral) +
  `react-native-reanimated` (animación del panel), igual que el resto del
  motor de navegación.

**Fuera de alcance, ahora y a futuro:** cualquier target que no sea React
Native (iOS/Android). Este es y seguirá siendo un módulo **para React
Native**, no un router de propósito general ni un router web — no se
contempla soporte para React DOM.
