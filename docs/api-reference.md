# Referencia de la API

> Módulo **para React Native** (iOS/Android). Todos los componentes de
> abajo (`Stack`, `Tabs`, `Slot`, `Link`) son componentes React Native, no
> HTML/DOM.

## Componentes

### `<Stack>` / `<Stack.Screen>`

Navegador de pila propio (no es `@react-navigation/native-stack`), pero
construido sobre `react-native-screens` (`ScreenStack`/`Screen`) para la
gestión nativa de pantallas/memoria y sobre `react-native-reanimated` para
las transiciones. Se usa en un `_layout.tsx` para renderizar una pila sobre
los hijos de la carpeta.

```tsx
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

Si `<Stack>` no tiene `<Stack.Screen>` hijos explícitos, todas las rutas
hermanas de la carpeta se registran automáticamente con opciones por
defecto — `<Stack.Screen>` explícito solo hace falta para sobreescribir
opciones por pantalla (título, transición, `presentation: 'modal'`, etc.).
Incluye gesto de swipe-to-go-back en iOS (nativo, vía `react-native-screens`)
y manejo del botón físico "atrás" en Android (ver
[architecture.md](./architecture.md#3-motor-de-navegación-propio-sobre-primitivas-nativas)).

### `<Tabs>` / `<Tabs.Screen>`

Navegador de pestañas propio (no es `@react-navigation/bottom-tabs`),
construido con `View`/`Pressable`/`Text` para la barra y
`react-native-screens` para congelar nativamente las pestañas inactivas.
Mismo comportamiento de auto-registro que `<Stack>`.

### `<Slot>`

Renderiza la ruta hija actualmente resuelta sin añadir un navegador extra —
se usa cuando una carpeta necesita un `_layout.tsx` (por ejemplo, para
inyectar un provider/header compartido) sin introducir un nuevo nivel de
Stack/Tabs.

### `<Link>`

```tsx
<Link href="/users/42">Ir al usuario 42</Link>
```

Renderiza un `Pressable`/`Text` (componentes core de React Native) que
llama a `router.push(href)` al pulsarlo. Acepta las props `replace` y
`asChild`.

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
dentro de un `_layout.tsx` compartido.

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
