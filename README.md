# @jscode/react-native-routing

File-based router para **React Native** (iOS/Android), sin Expo ni React
Navigation. Las rutas se definen con archivos bajo `app/`, al estilo de
Expo Router/Next.js, sobre un motor de navegación propio construido
directamente sobre `react-native-screens`, `react-native-gesture-handler`
y `react-native-reanimated`.

```
app/
  index.tsx          → /            (stack raíz implícito, sin layouts)
  users/[id].tsx     → /users/:id
  (tabs)/layout.ts   → export const navigator = { type: 'tabs' }
  not-found.tsx      → fallback 404 (opcional)
```

## Características

- Rutas por archivos: estáticas, dinámicas (`[id]`), catch-all
  (`[...slug]`), grupos (`(group)`), layouts anidados y `not-found` (con
  pantalla 404 por defecto si la app no la define).
- Cero layouts obligatorios: stack nativo implícito por carpeta, tabs con
  un `layout.ts` declarativo de una línea, y opciones de pantalla
  colocalizadas en cada página (`export const metadata` /
  `generateMetadata`), al estilo Next.js. Los layouts con componente
  reciben el navegador como `children` y persisten entre pantallas.
- Árbol de rutas visual en desarrollo: al arrancar se imprime el árbol
  descubierto con navegadores, URLs y títulos (`logRoutes={false}` lo
  desactiva).
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

## Quick start

Requiere un proyecto React Native CLI existente
(`npx @react-native-community/cli init`); no aplica a web ni a Expo Go.

**1. Instala** el paquete y sus peer dependencies (no hace falta React
Navigation ni `react-native-safe-area-context`):

```sh
npm install @jscode/react-native-routing \
  react-native-screens react-native-gesture-handler \
  react-native-reanimated react-native-worklets
cd ios && pod install && cd ..   # solo iOS
```

**2. Configura Babel y Metro** (una sola vez):

```js
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@jscode/react-native-routing/babel', // acepta { root: './otro-dir' }
    'react-native-worklets/plugin',       // siempre el último
  ],
};

// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withRouting } = require('@jscode/react-native-routing/metro');
module.exports = withRouting(getDefaultConfig(__dirname));
```

**3. Monta el router** — sin props; el plugin de Babel localiza `app/` en
build-time:

```tsx
// App.tsx
import { RootRouter } from '@jscode/react-native-routing';

export default function App() {
  return <RootRouter />;
}
```

**4. Crea rutas.** No hace falta ningún layout: la raíz monta un stack
nativo implícito y cada página declara sus opciones junto al componente:

```tsx
// app/index.tsx  →  /
import { Link } from '@jscode/react-native-routing';
import type { ScreenMetadata } from '@jscode/react-native-routing';

export const metadata: ScreenMetadata = { title: 'Home' };

export default function Home() {
  return <Link href="/users/42">Ir al usuario 42</Link>;
}
```

```tsx
// app/users/[id].tsx  →  /users/:id, con título dinámico
import { Text } from 'react-native';
import type { GenerateMetadata, PageProps } from '@jscode/react-native-routing';

export const generateMetadata: GenerateMetadata = ({ params }) => ({
  title: `Usuario ${String(params.id)}`,
});

export default function User({ params }: PageProps<{ id: string }>) {
  return <Text>User {params.id}</Text>;
}
```

Toda página recibe `params` y `pathname` como props (estilo Next.js); los
layouts también, además de `children`. Para componentes anidados que no
reciben las props de la página están los hooks (`useLocalSearchParams`,
`usePathname`).

El nombre entre corchetes es libre y los segmentos dinámicos se anidan:

```
app/posts/[slug].tsx       → /posts/:slug     → params.slug
app/[category]/[item].tsx  → /:category/:item → params.category, params.item
app/blog/[...slug].tsx     → /blog/*          → params.slug (string[])
```

Prioridad de match: estático > dinámico > catch-all (`posts/destacado.tsx`
gana a `posts/[slug].tsx` para `/posts/destacado`).

**5. ¿Tabs?** Una carpeta con un `layout.ts` de una línea; título e icono
salen del `metadata` de cada pestaña:

```ts
// app/(tabs)/layout.ts
import type { NavigatorConfig } from '@jscode/react-native-routing';

export const navigator: NavigatorConfig = { type: 'tabs', animation: 'fade' };
```

```tsx
// app/(tabs)/profile.tsx  →  /profile
export const metadata: ScreenMetadata = {
  title: 'Perfil',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>👤</Text>
    ),
  },
};
```

Al arrancar en desarrollo, el paquete imprime el árbol descubierto (en
logcat / React Native DevTools):

```
@jscode/react-native-routing · 5 rutas

app/                 Stack (implícito)
├── (tabs)/          Tabs
│   ├── index        /            "Home"
│   └── profile      /profile     "Perfil"
├── users/
│   └── [id]         /users/:id   (dinámica)
└── not-found        404 (default del paquete)
```

### UI compartida y guards

Un layout con componente recibe el navegador de su carpeta como
`children` (estilo Next.js) y **persiste** al navegar entre sus hijos —
ideal para providers y guards de auth:

```tsx
// app/(tabs)/layout.tsx — convive con export const navigator
export default function TabsGuard({ children }: { children?: ReactNode }) {
  const session = useSession();
  if (!session) return <Redirect href="/login" />;
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

### Navegar

```tsx
<Link href="/users/42">Perfil del 42</Link>;

const router = useRouter();
router.push('/users/42');
router.replace('/login');
router.back();

// Fuera de componentes (p. ej. un handler de push notifications):
import { router } from '@jscode/react-native-routing';
router.push('/messages/123');
```

## Documentación

- [docs/getting-started.md](./docs/getting-started.md) — guía paso a paso
- [docs/file-conventions.md](./docs/file-conventions.md) — convenciones de
  archivos: rutas, grupos, layouts, stack implícito
- [docs/api-reference.md](./docs/api-reference.md) — componentes, hooks,
  `metadata`, `NavigatorConfig`
- [docs/architecture.md](./docs/architecture.md) — diseño interno

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
