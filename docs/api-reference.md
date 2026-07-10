# Referencia de la API

> Módulo **para React Native** (iOS/Android). Todos los componentes de
> abajo (`Stack`, `Tabs`, `Slot`, `Link`) son componentes React Native, no
> HTML/DOM.

## Componentes

### `<Stack>` / `<Stack.Screen>`

Navegador de pila propio (no es `@react-navigation/native-stack`), pero
construido sobre `react-native-screens` (`ScreenStack`/`Screen`) para la
gestión nativa de pantallas/memoria y sobre `react-native-reanimated` para
las transiciones. Se usa en un `layout.tsx` para renderizar una pila sobre
los hijos de la carpeta.

```tsx
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
    </Stack>
  );
}
```

El `name` de cada pantalla es el primer segmento de ruta por debajo del
layout (`users` para `users/[id].tsx`, `index` para el `index.tsx` de la
propia carpeta, `(tabs)` para un grupo, `not-found` para el fallback).
Las rutas se registran automáticamente: `<Stack.Screen>` explícito solo
hace falta para sobreescribir opciones por pantalla. Opciones soportadas:

| Opción | Descripción |
| --- | --- |
| `title` | Título del header nativo (por defecto, el `name`). |
| `headerShown` | `false` oculta el header nativo (por defecto `true`). |
| `safeArea` | Solo con `headerShown: false`: `true` (default) aplica el inset superior; `false` deja el contenido a sangre bajo la barra de estado (full-bleed, estilo OTT). Con header visible el inset lo gestiona el propio header. |
| `presentation` | `'push' \| 'modal' \| 'transparentModal' \| 'formSheet'`. |
| `animation` | Transición nativa de la pantalla: `'default' \| 'fade' \| 'fade_from_bottom' \| 'flip' \| 'none' \| 'simple_push' \| 'slide_from_bottom' \| 'slide_from_right' \| 'slide_from_left'`. `'none'` la desactiva. |
| `contentStyle` | Estilo del contenedor de la pantalla; por defecto lleva un fondo opaco `#f2f2f2` para que las transiciones push/pop no se mezclen con la pantalla inferior (`transparentModal` no lo aplica). |

```tsx
<Stack.Screen
  name="player"
  options={{ headerShown: false, safeArea: false, contentStyle: { backgroundColor: '#000' } }}
/>
```

Incluye gesto de swipe-to-go-back en iOS (nativo, vía `react-native-screens`)
y manejo del botón físico "atrás" en Android (ver
[architecture.md](./architecture.md#3-motor-de-navegación-propio-sobre-primitivas-nativas)).
Un navegador anidado (por ejemplo, un sub-`<Stack>`) debe declararse en el
`layout.tsx` de un hijo directo del navegador padre: las entradas que
comparten ese hijo se agrupan en una sola pantalla del stack exterior y el
push entra al navegador interior.

### `<Tabs>` / `<Tabs.Screen>`

Navegador de pestañas propio (no es `@react-navigation/bottom-tabs`),
construido con `View`/`Pressable`/`Text` para la barra (indicador animado
con reanimated) y `react-native-screens` para congelar nativamente las
pestañas inactivas, que conservan su estado local al cambiar de tab.
Mismo comportamiento de auto-registro que `<Stack>`: sin `<Tabs.Screen>`
explícitos, las rutas hermanas de la carpeta se convierten en pestañas.
Opciones soportadas: `title` (etiqueta de la pestaña; por defecto, el
`name`). `<Tabs>` acepta la prop `animation` (`'none'` por defecto,
`'fade'` funde el contenido al cambiar de pestaña con reanimated).

### `<Slot>`

Renderiza la ruta hija actualmente resuelta sin añadir un navegador extra —
se usa cuando una carpeta necesita un `layout.tsx` (por ejemplo, para
inyectar un provider/header compartido) sin introducir un nuevo nivel de
Stack/Tabs.

### `<Link>`

```tsx
<Link href="/users/42">Ir al usuario 42</Link>
```

Renderiza un `Pressable`/`Text` (componentes core de React Native) que
llama a `router.push(href)` al pulsarlo. Acepta las props `replace`
(usa `router.replace` en lugar de `push`) y `style` (estilo del `Text`).
Un `href` sin ruta coincidente navega a `app/not-found.tsx` (o a la
pantalla 404 por defecto del paquete si la app no lo define).

### `<Redirect>`

Guard declarativo para contenido protegido: renderízalo en lugar del
contenido y hace `router.replace(href)` al montarse (sin apilar
historial). El patrón para rutas con auth es comprobar la sesión en el
`layout.tsx` (o en la pantalla) y devolver el redirect:

```tsx
// app/(tabs)/layout.tsx
export default function TabsLayout() {
  const session = useSession(); // tu estado de auth
  if (!session) return <Redirect href="/login" />;
  return <Tabs>...</Tabs>;
}
```

Como el guard es una condición de render, reacciona solo a los cambios de
sesión: al hacer logout, la pantalla protegida expulsa al usuario a
`/login` automáticamente.

## Hooks

### `useRouter()`

```ts
const router = useRouter();
router.push('/users/42');
router.replace('/login');
router.back();
router.setParams({ tab: 'settings' });
```

### `useLocalSearchParams<T>()`

Devuelve los valores de los segmentos dinámicos de la pantalla *actualmente
renderizada*, por ejemplo `{ id: '42' }` para `app/users/[id].tsx`.

### `useGlobalSearchParams<T>()`

Igual que el anterior, pero incluye los parámetros de todos los segmentos
resueltos a lo largo del árbol, no solo los de la pantalla final — útil
dentro de un `layout.tsx` compartido.

### `usePathname()`

Devuelve el string de la ruta resuelta actual, por ejemplo `/users/42`.

### `useSegments()`

Devuelve la ruta resuelta como un array de segmentos del árbol de rutas
(incluyendo nombres de grupo), útil para renderizar condicionalmente un
layout según qué grupo esté activo (por ejemplo, `(auth)` frente a
`(tabs)`).

## API imperativa

`router` (importado directamente, para usar fuera de componentes/hooks, por
ejemplo en un handler de push notifications):

```ts
import { router } from '@jscode/react-native-routing';
router.push('/messages/123');
```

Replica `useRouter()` pero no requiere estar dentro del árbol de
componentes.
