# @jscode/react-native-routing

File-based router para **React Native** (iOS/Android), sin Expo ni React
Navigation. Las rutas se definen con archivos bajo `app/`, al estilo de
Expo Router/Next.js, sobre un motor de navegación propio construido
directamente sobre `react-native-screens`, `react-native-gesture-handler`
y `react-native-reanimated`.

```
app/
  layout.tsx         → <Stack> raíz
  index.tsx          → /
  users/[id].tsx     → /users/:id
  (tabs)/layout.tsx  → <Tabs>
  not-found.tsx      → fallback 404 (opcional)
```

## Características

- Rutas por archivos: estáticas, dinámicas (`[id]`), catch-all
  (`[...slug]`), grupos (`(group)`), layouts anidados (`layout.tsx`) y
  `not-found` (con pantalla 404 por defecto si la app no la define).
- `<Stack>` nativo (`ScreenStack`): transiciones push/pop nativas, header
  nativo, `presentation: 'modal'`, botón físico atrás en Android,
  swipe-to-go-back en iOS.
- `<Tabs>` con pestañas congeladas nativamente (conservan estado) e
  indicador animado con reanimated.
- Navegadores anidados (sub-stacks) independientes del stack raíz.
- `useRouter`, `useLocalSearchParams`, `useGlobalSearchParams`,
  `usePathname`, `useSegments`, `<Link>`, `<Slot>`, `<Redirect>` (guards
  de auth declarativos) y router imperativo.
- Deep linking con el módulo `Linking` del core (frío y caliente), sin
  configuración de linking aparte: se deriva del árbol de rutas.
- Nueva Arquitectura (Fabric) y Fast Refresh: los archivos nuevos bajo
  `app/` se detectan sin codegen.

## Instalación y uso

Ver [docs/getting-started.md](./docs/getting-started.md). Referencia
completa en [docs/api-reference.md](./docs/api-reference.md), convenciones
de archivos en [docs/file-conventions.md](./docs/file-conventions.md) y
diseño interno en [docs/architecture.md](./docs/architecture.md).

```tsx
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withRouting } = require('@jscode/react-native-routing/metro');
module.exports = withRouting(getDefaultConfig(__dirname));

// App.tsx
import { RootRouter } from '@jscode/react-native-routing';
export default function App() {
  return <RootRouter context={require.context('./app', true, /\.[jt]sx?$/)} />;
}
```

## Desarrollo

```sh
npm run test:unit        # vitest (motor de rutas puro)
npm run test:rn          # jest + RNTL (navegación)
npm run typecheck && npm run lint
npm run smoke            # npm pack + instalación del tarball
npm run example:android  # app de ejemplo en emulador
```

Estado del proyecto por fases en [docs/roadmap.md](./docs/roadmap.md).
La verificación en iOS está pendiente de hardware (ver roadmap).

## Licencia

[MIT](./LICENSE)
