# Convenciones de archivos

> Módulo **para React Native** (iOS/Android) — las pantallas descritas
> aquí son componentes React Native (`View`, `Text`, etc.), no páginas web.

Todas las rutas viven bajo un directorio `app/` (configurable, por defecto
`app/`). La ruta de un archivo dentro de `app/` se traduce directamente en
una ruta/URL, igual que hacen Expo Router y Next.js.

## Rutas básicas

| Archivo                     | Ruta          |
| ---------------------------- | ------------- |
| `app/index.tsx`             | `/`           |
| `app/settings.tsx`          | `/settings`   |
| `app/profile/index.tsx`     | `/profile`    |
| `app/profile/edit.tsx`      | `/profile/edit` |

`index.tsx` es la ruta que se renderiza cuando su carpeta contenedora se
resuelve sin más segmentos. Una carpeta no puede contener a la vez
`foo.tsx` y `foo/index.tsx` — eso es un error de build por ruta en
conflicto.

## Segmentos dinámicos

Los corchetes marcan un segmento dinámico, igual que en Next.js/Expo Router:

| Archivo                        | Ruta               | Ejemplo de match         |
| -------------------------------- | ------------------- | ------------------------- |
| `app/users/[id].tsx`             | `/users/:id`        | `/users/42` → `id="42"`  |
| `app/[category]/[item].tsx`      | `/:category/:item`  | `/shoes/nike-air`         |

El valor llega a la página como prop `params` (junto a `pathname`, igual
que en Next.js):

```tsx
// app/users/[id].tsx
import type { PageProps } from '@authuser/react-native-routing';

export default function UserScreen({ params }: PageProps<{ id: string }>) {
  return <Text>User {params.id}</Text>;
}
```

Los layouts reciben las mismas props además de `children`
(`LayoutProps`). Para componentes anidados que no reciben las props de la
página existe el hook `useLocalSearchParams()`.

## Segmentos catch-all

| Archivo                        | Ruta          | Coincide con                |
| -------------------------------- | ------------- | ----------------------------- |
| `app/blog/[...slug].tsx`         | `/blog/*`     | `/blog/a`, `/blog/a/b/c`     |

`slug` se entrega como `string[]` (`["a", "b", "c"]`), igual que las rutas
catch-all de Next.js. El catch-all opcional (`[[...slug]].tsx`, que además
coincide con `/blog`) queda pospuesto — ver
[architecture.md](./architecture.md#trabajo-futuro).

## Grupos de rutas

Los paréntesis crean un grupo que organiza archivos **sin añadir un segmento
a la ruta**. Los grupos son el mecanismo para dar layouts distintos a rutas
hermanas (por ejemplo, un stack de auth frente a un tab navigator) sin
cambiar la URL:

```
app/
  (auth)/
    login.tsx        →  /login
    register.tsx     →  /register
  (tabs)/
    layout.ts        →  export const navigator = { type: 'tabs' }
    home.tsx          →  /home
    profile.tsx       →  /profile
```

Tanto `(auth)` como `(tabs)` son invisibles en la ruta resultante; solo
existen para delimitar el alcance de un navegador (aquí `(auth)`, con dos
rutas, monta su propio stack implícito, y `(tabs)` declara unas Tabs).

## Navegadores por carpeta: el Stack implícito

**Una app funciona sin ningún archivo de layout.** La carpeta define el
navegador: la raíz `app/` monta siempre un `<Stack>` nativo implícito, y
cualquier carpeta con más de una entrada navegable monta el suyo propio
(el push entra a la pila de esa carpeta). Una carpeta con una única ruta
hoja (por ejemplo `users/[id].tsx`) no crea pila: su pantalla vive en el
stack ancestro.

Las opciones de cada pantalla (título del header, presentación modal,
icono de pestaña…) se declaran en la propia página con
`export const metadata` — ver
[api-reference.md](./api-reference.md#metadata--generatemetadata).

## Layouts (`layout.ts` / `layout.tsx`)

Un archivo `layout` cambia o envuelve el navegador de su carpeta. Puede
exportar dos cosas, juntas o por separado:

**`export const navigator`** — config declarativa del navegador, sin JSX:

```ts
// app/(tabs)/layout.ts
import type { NavigatorConfig } from '@authuser/react-native-routing';

export const navigator: NavigatorConfig = { type: 'tabs', animation: 'fade' };
```

`type` acepta `'stack'`, `'tabs'` o `'slot'` (paso directo: la carpeta no
introduce nivel de navegación — el comportamiento que antes era el
default sin layout).

**Un componente default con `children`** — UI compartida estilo Next.js:
recibe como `children` el navegador ya resuelto de la carpeta (el
declarado o el implícito) y lo envuelve con providers, guards o shells.
El layout persiste al navegar entre sus hijos — no se remonta al hacer
push ni al cambiar de pestaña:

```tsx
// app/(tabs)/layout.tsx
export const navigator: NavigatorConfig = { type: 'tabs' };

export default function TabsShell({ children }: { children?: ReactNode }) {
  const session = useSession();
  if (!session) return <Redirect href="/login" />;
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

Los layouts se anidan: uno en `app/` envuelve toda la app y uno en un
grupo, solo su subárbol. El modo manual sigue disponible como escape
hatch: un componente que ignora `children` y renderiza su propio
`<Stack>`/`<Tabs>` con `<Stack.Screen>`/`<Tabs.Screen>` explícitos manda
sobre todo (renderizar a la vez `{children}` y un navegador propio avisa
en desarrollo).

Cuando el hijo directo de un stack tiene navegador propio (declarado,
manual o implícito), su pantalla exterior oculta el header nativo por
defecto: el navegador interior gestiona los suyos.

## Ruta not-found

`app/not-found.tsx` se renderiza cuando ninguna ruta coincide (initialPath
desconocido, `Link`/`push` a un href sin match, deep link roto). Es un
nombre reservado: no genera la ruta `/not-found`. Si la app no lo define,
el router muestra una pantalla 404 por defecto del propio paquete — no
hace falta añadir nada.

## Nombres reservados

| Nombre               | Propósito                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `layout.ts(x)`         | Navegador declarativo y/o UI compartida de la carpeta       |
| `not-found.tsx`        | Fallback 404 (con default del paquete); acepta `metadata`   |
| `[name].tsx`           | Segmento dinámico                                           |
| `[...name].tsx`        | Segmento catch-all                                          |
| `(name)/`              | Grupo de rutas (sin segmento en la ruta)                    |

Exports reservadas en cualquier página: `metadata` (opciones de pantalla)
y `generateMetadata` (metadata dependiente de params) — ambas opcionales,
su ausencia es el caso base.

Cualquier otro archivo bajo `app/` que no sea un nombre reservado y no
sea importado por un hermano, se trata como una ruta.
