# Referencia de la API

> Módulo **para React Native** (iOS/Android). Todos los componentes de
> abajo (`Stack`, `Tabs`, `Slot`, `Link`) son componentes React Native, no
> HTML/DOM.

## Componentes

### `<RootRouter>`

Componente de entrada: monta el árbol de rutas y el
`GestureHandlerRootView`. Sin props, usa el `require.context` que inyecta
el plugin de Babel del paquete (ver
[getting-started.md](./getting-started.md#2-configurar-babel)):

```tsx
export default function App() {
  return <RootRouter />;
}
```

| Prop | Descripción |
| --- | --- |
| `context` | Opcional: un `require.context` propio, como alternativa al plugin de Babel. Sin plugin y sin `context`, lanza un error explicando ambas opciones. |
| `initialPath` | Ruta inicial (por defecto `/`). |
| `logRoutes` | Solo desarrollo: imprime el árbol de rutas descubierto (navegador por carpeta, URLs, títulos) al montar y al reevaluarse con Fast Refresh. `false` lo desactiva. Los logs del cliente se ven en logcat/Console y en React Native DevTools. |

## Props de página y layout

### `PageProps` / `LayoutProps`

Toda página recibe `params` (segmentos dinámicos resueltos de su entrada)
y `pathname` como props, al estilo de Next.js:

```tsx
// app/users/[id].tsx
import type { PageProps } from '@authuser/react-native-routing';

export default function User({ params, pathname }: PageProps<{ id: string }>) {
  return <Text>{`User ${params.id} (${pathname})`}</Text>;
}
```

Los layouts reciben lo mismo más `children` (`LayoutProps`); su
`params`/`pathname` siguen a la entrada superior de su grupo, así que se
actualizan al navegar dentro del navegador que envuelven. Las pantallas
en background conservan sus propias props aunque la entrada activa viva
en otro subárbol. Los catch-all llegan como `string[]`.

Los hooks (`useLocalSearchParams`, `usePathname`, …) siguen disponibles
para componentes anidados que no reciben las props de la página.

## Metadata por página

### `metadata` / `generateMetadata`

Cada archivo de ruta puede exportar sus opciones de pantalla junto al
componente — la fuente primaria de configuración (los `<Stack.Screen>`/
`<Tabs.Screen>` explícitos quedan para sobreescrituras puntuales):

```tsx
// app/(tabs)/profile.tsx
import type { ScreenMetadata } from '@authuser/react-native-routing';

export const metadata: ScreenMetadata = {
  title: 'Perfil',
  tab: {
    icon: ({ focused, color, size }) => <ProfileIcon color={color} size={size} />,
  },
};

export default function ProfileScreen() { /* … */ }
```

`ScreenMetadata` admite todas las opciones de `Stack.Screen` en plano
(`title`, `headerShown`, `safeArea`, `presentation`, `animation`,
`orientation`, `contentStyle`) y las de pestaña agrupadas bajo `tab`
(`icon`) — así queda inequívoco a qué navegador aplica cada campo cuando
una pantalla vive a la vez en unas Tabs y en un stack anidado.

Para metadata dependiente de los params, `generateMetadata` (síncrona) se
evalúa al resolver la entrada de navegación y se mezcla sobre la
estática:

```tsx
// app/users/[id].tsx
import type { GenerateMetadata } from '@authuser/react-native-routing';

export const generateMetadata: GenerateMetadata = ({ params, pathname, segments }) => ({
  title: `Usuario ${String(params.id)}`,
});
```

Ambas exports son opcionales: una página sin ellas navega igual y recibe
los defaults del paquete (`title = name`, `headerShown = true`, …). Una
export malformada no rompe la navegación: warning en desarrollo y caída a
defaults. `not-found.tsx` también acepta `metadata`.

Precedencia, de menor a mayor: defaults del paquete < `metadata` <
`generateMetadata` < `options` explícitas de `<Stack.Screen>` /
`<Tabs.Screen>` (por campo).

## Layouts

### `layout.ts` declarativo (`NavigatorConfig`)

Una carpeta cambia su navegador exportando `navigator` desde su archivo
`layout.ts(x)`, sin componente:

```ts
// app/(tabs)/layout.ts
import type { NavigatorConfig } from '@authuser/react-native-routing';

export const navigator: NavigatorConfig = {
  type: 'tabs',      // 'stack' | 'tabs' | 'slot'
  animation: 'fade', // solo tabs
  showLabel: true,   // solo tabs
  order: ['home', 'search', 'profile'], // solo tabs, opcional
  hidden: ['secret'],                   // solo tabs, opcional
};
```

Sin `order`, las pestañas salen con `index` primero y el resto en el
orden de descubrimiento de archivos (alfabético). Con `order`, los
nombres listados van primero en ese orden y los no listados detrás, en su
orden natural.

`hidden` saca pestañas de la barra sin quitar sus rutas: siguen siendo
navegables (push, deep link) y, si una está activa, su pantalla se
renderiza igual — la expulsión, si procede, es cosa de un guard
`<Redirect>` en la página. Para visibilidad **dinámica** (p. ej. una
pestaña solo para usuarios premium), usa la prop `hidden` de `<Tabs>`
desde un layout con componente, que re-renderiza con tu estado:

```tsx
// app/(tabs)/layout.tsx
export default function TabsLayout() {
  const { isPremium } = useSession();
  return <Tabs hidden={isPremium ? ['upgrade'] : ['premium']} />;
}
```

Sin archivo de layout, la raíz monta un `<Stack>` implícito siempre, y
cualquier carpeta con más de una entrada navegable también; `'slot'`
recupera el paso directo. Ver
[file-conventions.md](./file-conventions.md#navegadores-por-carpeta-el-stack-implícito).

### Componente de layout con `children`

El componente default de un layout recibe como `children` el navegador
resuelto de su carpeta (declarado o implícito) y lo envuelve con UI
compartida, que **persiste** al navegar entre sus hijos (no se remonta
con push/cambio de pestaña):

```tsx
// app/(tabs)/layout.tsx — puede convivir con export const navigator
export default function Shell({ children }: { children?: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

Un componente que ignora `children` y monta su propio `<Stack>`/`<Tabs>`
es el modo manual clásico (manda sobre todo); renderizar ambos a la vez
avisa en desarrollo.

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
Las rutas se registran automáticamente y sus opciones vienen del
`export const metadata` de cada página (ver
[Metadata por página](#metadata-por-página)); `<Stack.Screen>` explícito
solo hace falta para sobreescribir por encima de la metadata. Opciones
soportadas:

| Opción | Descripción |
| --- | --- |
| `title` | Título del header nativo (por defecto, el `name`). |
| `headerShown` | `false` oculta el header nativo (por defecto `true`). |
| `safeArea` | Solo con `headerShown: false`: `true` (default) aplica el inset superior; `false` deja el contenido a sangre bajo la barra de estado (full-bleed, estilo OTT). Con header visible el inset lo gestiona el propio header. |
| `presentation` | `'push' \| 'modal' \| 'transparentModal' \| 'formSheet'`. |
| `animation` | Transición nativa de la pantalla: `'default' \| 'fade' \| 'fade_from_bottom' \| 'flip' \| 'none' \| 'simple_push' \| 'slide_from_bottom' \| 'slide_from_right' \| 'slide_from_left'`. `'none'` la desactiva. |
| `orientation` | Orientación forzada mientras la pantalla está en primer plano: `'default' \| 'all' \| 'portrait' \| 'portrait_up' \| 'portrait_down' \| 'landscape' \| 'landscape_left' \| 'landscape_right'`. Al hacer pop se restaura la de la pantalla anterior — ideal para un player en `'landscape'` con el resto de la app en portrait. En iOS la app debe declarar las orientaciones permitidas en `Info.plist` (`UISupportedInterfaceOrientations`). |
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
explícitos, las rutas hermanas de la carpeta se convierten en pestañas,
con título e icono desde el `metadata` de cada página (`title` plano,
icono bajo `tab.icon`; el de una carpeta como `settings/` sale del
`metadata` de su `index`).

Opciones de `<Tabs.Screen>`: `title` (etiqueta; por defecto, el `name`) e
`icon`, una render prop `({ focused, color, size }) => ReactNode` — el
paquete no bundlea ningún set de iconos, pasa el tuyo (un `Image`, un SVG,
`react-native-vector-icons`, un emoji en un `Text`...):

```tsx
<Tabs showLabel={false}>
  <Tabs.Screen
    name="home"
    options={{
      title: 'Home',
      icon: ({ focused, color, size }) => (
        <HomeIcon color={color} width={size} opacity={focused ? 1 : 0.5} />
      ),
    }}
  />
</Tabs>
```

Props de `<Tabs>`: `animation` (`'none'` por defecto, `'fade'` funde el
contenido al cambiar de pestaña con reanimated), `showLabel` (`false`
para modo solo-iconos), `order` (orden de las pestañas por nombre de
ruta; las no listadas van detrás en su orden natural) y `hidden`
(pestañas fuera de la barra con rutas aún navegables; ideal para
visibilidad dinámica calculada en el layout) — `order` y `hidden` tienen
el mismo comportamiento que sus equivalentes de `NavigatorConfig`.

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
export const navigator: NavigatorConfig = { type: 'tabs' };

export default function TabsGuard({ children }: { children?: ReactNode }) {
  const session = useSession(); // tu estado de auth
  if (!session) return <Redirect href="/login" />;
  return <>{children}</>;
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
import { router } from '@authuser/react-native-routing';
router.push('/messages/123');
```

Replica `useRouter()` pero no requiere estar dentro del árbol de
componentes.
