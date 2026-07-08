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

El valor se lee en tiempo de ejecución con `useLocalSearchParams()`:

```tsx
// app/users/[id].tsx
import { useLocalSearchParams } from '@jscode/react-native-routing';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>User {id}</Text>;
}
```

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
    _layout.tsx       →  define el tab navigator inferior
    home.tsx          →  /home
    profile.tsx       →  /profile
```

Tanto `(auth)` como `(tabs)` son invisibles en la ruta resultante; solo
existen para delimitar el alcance de un `_layout.tsx`.

## Layouts (`_layout.tsx`)

Un archivo `_layout.tsx` define el navegador (Stack, Tabs, Drawer, …) para
todas las rutas hermanas y anidadas de esa carpeta — el mismo rol que el
`_layout.tsx` de Expo Router y análogo al `layout.tsx` de Next.js. Exporta un
componente por defecto que renderiza una de las primitivas de navegador del
paquete:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from '@jscode/react-native-routing';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

Los layouts se anidan: un `_layout.tsx` en `app/` envuelve toda la app (por
ejemplo, un Stack raíz), y un `_layout.tsx` dentro de `app/(tabs)/` envuelve
solo ese grupo. Si una carpeta no tiene `_layout.tsx`, las rutas se
renderizan directamente bajo el layout padre más cercano (paso directo
implícito, el mismo comportamiento por defecto que el `<Slot>` de Expo
Router).

## Ruta not-found

`app/+not-found.tsx` se renderiza cuando ninguna ruta coincide — se usa
como pantalla de fallback `NotFound` en la config de navegador/linking
generada.

## Nombres reservados

| Nombre            | Propósito                                    |
| ------------------- | ---------------------------------------------- |
| `_layout.tsx`        | Navegador/layout de la carpeta                |
| `+not-found.tsx`     | Fallback 404                                  |
| `[name].tsx`         | Segmento dinámico                             |
| `[...name].tsx`      | Segmento catch-all                            |
| `(name)/`            | Grupo de rutas (sin segmento en la ruta)      |

Cualquier otro archivo bajo `app/` que no empiece por `_` ni `+`, y que no
sea importado por un hermano, se trata como una ruta.
