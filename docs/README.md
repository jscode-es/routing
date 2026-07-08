# react-native-routing — Documentación

> Módulo **para React Native** (iOS/Android). No es un router de React DOM
> ni de propósito general para web.

Router basado en archivos para **React Native puro** (sin dependencia de
Expo), que trae la notación de rutas por sistema de archivos popularizada
por [Expo Router](https://docs.expo.dev/router/basics/notation/) y las
[rutas dinámicas de Next.js](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)
a proyectos de React Native CLI puro.

## Por qué

Expo Router resuelve el enrutado por archivos, pero solo está disponible
dentro del ecosistema Expo. React Navigation lo resuelve para React Native
puro, pero exige escribir a mano el árbol de navegadores.

**Este paquete no depende de ninguno de los dos**, pero tampoco reinventa
todo desde cero: el árbol de rutas y la orquestación de navegación
(`_layout.tsx`, `useRouter`, deep linking) son código propio, mientras que
la gestión nativa de pantallas/memoria, los gestos y las animaciones — las
tres piezas donde reescribir desde cero cuesta rendimiento — se apoyan en
tres librerías nativas estándar y preparadas para la Nueva Arquitectura:
`react-native-screens`, `react-native-gesture-handler` y
`react-native-reanimated`. Sin Expo, sin React Navigation, sin
`react-native-safe-area-context`.

Con esto, una app RN obtiene:

- Un directorio `app/` donde el árbol de archivos *es* el árbol de rutas.
- Segmentos dinámicos (`[id].tsx`), segmentos catch-all (`[...slug].tsx`),
  grupos de rutas (`(group)/`) y layouts (`_layout.tsx`) — el mismo modelo
  mental que Expo Router / Next.js.
- Un navegador de pilas (stack) y de pestañas (tabs) propios, con
  transiciones y gestos ejecutados en el hilo nativo de UI (no en JS), con
  el mismo rendimiento en desarrollo y en build de producción.
- Deep linking generado automáticamente a partir del mismo árbol de
  archivos, usando el módulo `Linking` que ya trae React Native.

## Objetivos

- Notación familiar para quien ya haya usado Expo Router o Next.js.
- **Dependencias mínimas y deliberadas**: `react-native-screens`,
  `react-native-gesture-handler` y `react-native-reanimated` como peer
  dependencies (primitivas nativas de rendimiento, Fabric-ready). Nada de
  Expo, React Navigation ni `react-native-safe-area-context`.
- Buen rendimiento **tanto en desarrollo como en build de producción**:
  gestos y animaciones corren en el hilo de UI vía JSI, no dependen de que
  el hilo de JS esté libre.
- Deep linking sin configuración manual (config derivada del árbol de
  archivos).
- Compatible con proyectos `@react-native-community/cli` puros y Metro.
- Runtime pequeño: parseo del árbol de rutas + orquestación de
  navegación propia sobre esas tres librerías, más un puñado de hooks
  (`useRouter`, `useLocalSearchParams`, …).

## No-objetivos (v1)

- Server-side rendering / export a web (no hay target web).
- Codegen completo de rutas tipadas (autocompletado de `href`) — se deja
  como mejora futura, ver [architecture.md](./architecture.md#trabajo-futuro).
- Adoptar React Navigation o Expo Router como dependencia — el árbol de
  rutas y la orquestación siguen siendo propios; ver
  [architecture.md](./architecture.md#3-motor-de-navegación-propio-sobre-primitivas-nativas).

## Documentos

- [file-conventions.md](./file-conventions.md) — la notación de rutas: qué
  significa cada nombre de archivo/carpeta y qué genera.
- [architecture.md](./architecture.md) — cómo se implementará: integración
  con Metro, generación del árbol de rutas, y el motor de navegación propio
  apoyado en `react-native-screens`/`react-native-gesture-handler`/`react-native-reanimated`.
- [api-reference.md](./api-reference.md) — componentes y hooks públicos.
- [getting-started.md](./getting-started.md) — instalación e integración
  del paquete en una app React Native.
