# RFC: metadata por pantalla y navegadores inferidos

> **Estado: implementado** (Fase 10 del [roadmap](./roadmap.md), julio
> 2026). Se conserva como registro de diseño y de las decisiones tomadas;
> la documentación vigente está en [api-reference.md](./api-reference.md)
> y [file-conventions.md](./file-conventions.md). Diferencias menores
> respecto al texto original: la lectura de metadata resultó de coste
> cero también en Stack (los módulos ya se ejecutan al construir el
> árbol), `not-found.tsx` también acepta `metadata`, y el stack implícito
> aplica además a cualquier carpeta con más de una entrada navegable (no
> solo a la raíz), con header exterior oculto por defecto sobre
> navegadores anidados.

## Motivación

Hoy el `layout.tsx` de una carpeta cumple dos papeles a la vez: decide
**qué navegador** envuelve a sus hijos (`<Stack>` o `<Tabs>`) y concentra
las **opciones de cada pantalla** (`<Stack.Screen options>` /
`<Tabs.Screen options>`). Eso produce dos fricciones:

1. **La configuración de una pantalla vive lejos de la pantalla.** El
   título, el icono de pestaña o el `headerShown` de `profile.tsx` están
   en `layout.tsx`, no en `profile.tsx`. Añadir una ruta implica tocar dos
   archivos; renombrarla, mantener sincronizado el `name` del
   `Stack.Screen`/`Tabs.Screen` a mano.
2. **El caso común exige boilerplate.** El 90 % de los layouts son un
   `<Stack>` o un `<Tabs>` sin lógica: un componente entero solo para
   decir "esta carpeta es una pila".

Next.js resolvió lo primero con `export const metadata` colocalizada en
cada página, y lo segundo haciendo que la estructura de carpetas defina el
árbol de layouts. Esta propuesta traslada ambas ideas al modelo de este
paquete: **la carpeta define el navegador; la página define sus opciones**.

## Propuesta

### 1. `export const metadata` en cada página

Cada archivo de ruta puede exportar un objeto `metadata` con las mismas
opciones que hoy aceptan `Stack.Screen` y `Tabs.Screen`:

```tsx
// app/(tabs)/profile.tsx
import type { ScreenMetadata } from '@authuser/react-native-routing';

export const metadata: ScreenMetadata = {
  title: 'Perfil',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>👤</Text>
    ),
  },
};

export default function ProfileScreen() {
  return <View>…</View>;
}
```

Forma del tipo (borrador):

```ts
type ScreenMetadata = {
  // Comunes
  title?: string;

  // Opciones de Stack.Screen (aplican cuando el padre es un stack)
  headerShown?: boolean;
  safeArea?: boolean;
  presentation?: 'push' | 'modal' | 'transparentModal' | 'formSheet';
  animation?: StackAnimation;
  orientation?: ScreenOrientation;
  contentStyle?: StyleProp<ViewStyle>;

  // Opciones de Tabs.Screen, agrupadas para no mezclar espacios de nombres
  tab?: {
    icon?: (props: { focused: boolean; color: string; size: number }) => ReactNode;
  };
};
```

Las opciones de stack van planas (son la mayoría y el caso común); las de
pestaña se agrupan bajo `tab` porque una misma pantalla puede estar a la
vez dentro de un Tabs y de un Stack anidado, y así queda inequívoco a qué
navegador aplica cada cosa.

#### La export es opcional: sin `metadata` nada se rompe

Una página sin `export const metadata` es totalmente válida y es el caso
base: la pantalla navega igual y recibe los defaults del paquete
(`title = name`, `headerShown = true`, `safeArea = true`, icono de
pestaña ausente, …) — exactamente lo mismo que hoy una ruta sin
`<Stack.Screen>`/`<Tabs.Screen>` explícito en el layout. La ausencia de
la export no puede producir error ni warning: es el comportamiento
esperado, no un olvido. Lo mismo aplica a `generateMetadata` y a campos
parciales (un `metadata` con solo `title` completa el resto con
defaults). Una export malformada (no-objeto, función que lanza) tampoco
debe tumbar la navegación: se ignora con un warning en desarrollo y la
pantalla cae a los defaults.

Nota sobre el nombre: `metadata` sigue el modelo mental de Next.js. La
alternativa `screenOptions` es más literal (son opciones de comportamiento,
no metadatos de documento), pero pierde la familiaridad. **Decidido:
`metadata`** (ver [Decisiones tomadas](#decisiones-tomadas)).

#### Metadata dinámica

Para títulos que dependen de params (el equivalente a `generateMetadata`
de Next.js), una segunda export en forma de función:

```tsx
// app/users/[id].tsx
export const generateMetadata: GenerateMetadata = ({ params }) => ({
  title: `Usuario ${params.id}`,
});
```

Se evalúa al resolver la entrada de navegación (push/deep link). Recibe
`{ params, pathname, segments }` — los tres ya los tiene el matcher al
resolver, exponerlos es gratis y evita cambiar la firma más adelante. Si coexisten `metadata` y
`generateMetadata`, la función recibe la estática como base y su resultado
se mezcla encima. Es síncrona: para títulos que dependen de datos remotos
ya existe `router.setParams` / estado propio — fuera de alcance aquí.

### 2. Navegadores inferidos de las carpetas

Con la metadata colocalizada, `layout.tsx` deja de ser necesario en el
caso común. La propuesta:

- **Toda carpeta con rutas navegables obtiene un `<Stack>` implícito**,
  incluida la raíz `app/`. Es el default correcto para móvil: push/pop con
  transiciones nativas, sin escribir nada.
- **Una carpeta se convierte en `<Tabs>`** declarándolo en un `layout.ts`
  (sin JSX, sin componente) que exporta la configuración del navegador:

```ts
// app/(tabs)/layout.ts
import type { NavigatorConfig } from '@authuser/react-native-routing';

export const navigator: NavigatorConfig = {
  type: 'tabs',
  animation: 'fade',
  showLabel: false,
};
```

- El mismo mecanismo cubre los props del stack implícito cuando haga falta
  (`{ type: 'stack' }` con futuras opciones a nivel de navegador) y el
  paso directo actual (`{ type: 'slot' }`) para carpetas que no deben
  introducir nivel de navegación.

La regla de resolución por carpeta queda:

| La carpeta tiene…                                        | Resultado                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `layout.tsx` cuyo componente renderiza `{children}`       | UI compartida envolviendo al navegador de la carpeta (ver sección 3)   |
| `layout.tsx` cuyo componente monta `<Stack>`/`<Tabs>`     | Modo manual actual: el JSX define el navegador, manda sobre todo       |
| `layout.ts` solo con `export const navigator`             | Navegador declarativo según `type`                                     |
| Nada                                                      | `<Stack>` implícito                                                    |

Ambas exports pueden convivir en el mismo archivo: un `layout.tsx` puede
exportar `navigator` (la config del navegador) **y** un componente default
que lo envuelve. `layout.ts` es simplemente el caso sin componente.

> **Cambio de comportamiento**: hoy una carpeta sin `layout.tsx` hace paso
> directo (`<Slot>` implícito). Pasar el default a stack implícito es un
> breaking change deliberado — es lo que espera quien viene de Expo Router
> (`<Stack>` en el `_layout` raíz) y elimina el layout raíz obligatorio.
> Quien quiera el comportamiento antiguo lo declara con `{ type: 'slot' }`.
> Matiz necesario: solo las carpetas que aportan segmento de ruta o grupo
> crean navegador; una carpeta con una única ruta hoja no necesita pila
> propia (queda como pantalla del stack ancestro), igual que hoy un
> navegador anidado se declara en el hijo directo del padre.

#### Azúcar opcional: `(tabs)` como nombre reservado

Podría añadirse que un grupo llamado exactamente `(tabs)` implique
`{ type: 'tabs' }` sin `layout.ts`. Se desaconseja: convierte el nombre de
una carpeta en semántica de runtime (renombrar el grupo cambiaría el
navegador), no escala a variantes (`animation`, `showLabel`) y el
`layout.ts` de tres líneas ya es suficientemente barato. Se menciona solo
para registrar que se consideró y por qué se descarta.

### 3. `layout.tsx` estilo Next.js: UI compartida que envuelve al hijo

Con el navegador fuera de su responsabilidad, `layout.tsx` adopta el mismo
contrato que en Next.js: un componente que recibe `children` y lo
envuelve con UI compartida (providers, guards, shells). `children` es el
navegador ya resuelto de la carpeta — el `<Stack>` implícito o lo que
declare `export const navigator` — con la pantalla activa dentro:

```tsx
// app/(tabs)/layout.tsx
export const navigator: NavigatorConfig = { type: 'tabs', animation: 'fade' };

export default function TabsShell({ children }: { children: ReactNode }) {
  const session = useSession();
  if (!session) return <Redirect href="/login" />;
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

Propiedades, las mismas que en Next.js:

- **Se anidan**: el layout de `app/` envuelve toda la app; el de un grupo,
  solo su subárbol. Cada nivel envuelve al siguiente. (Esto ya es así hoy —
  ver [file-conventions.md](./file-conventions.md#layouts-layouttsx).)
- **Se comparten y persisten**: al navegar entre hijos (push en el stack,
  cambio de pestaña) el layout **no se remonta** — sus providers, estado
  local y animaciones sobreviven; solo cambia la pantalla dentro del
  navegador. El paquete ya garantiza esto (por eso `SET_ACTIVE_TAB`
  conserva la `key` de la entrada superior); la propuesta lo eleva a
  contrato documentado.
- **El orden es UI compartida → navegador → pantalla**: lo que se renderiza
  alrededor de `{children}` envuelve al navegador entero (tab bar
  incluida), que es lo que permite que persista entre pantallas.

`children` es un elemento lazy: el navegador de la carpeta solo se
materializa donde se renderiza. Un componente que ignora `children` y
monta su propio `<Stack>`/`<Tabs>` es el modo manual actual — no se crea
navegador implícito duplicado. Renderizar ambos (el navegador propio y
`{children}`) es un error de uso y se avisa en desarrollo.

Este contrato también sustituye al patrón actual de `<Slot>` dentro de un
`layout.tsx` para inyectar providers sin añadir nivel de navegación: pasa
a ser `{children}` con `navigator: { type: 'slot' }`. `<Slot>` seguiría
exportado por compatibilidad.

### 4. Precedencia de opciones

De menor a mayor prioridad:

1. Defaults del paquete (`title = name`, `headerShown = true`, …).
2. `metadata` estática de la página.
3. `generateMetadata` de la página (mezclada sobre la estática).
4. `<Stack.Screen options>` / `<Tabs.Screen options>` explícitos en un
   `layout.tsx` manual.

El punto 4 garantiza compatibilidad total: todo lo que funciona hoy sigue
funcionando igual, y un layout manual puede sobreescribir puntualmente la
metadata de una página (por ejemplo, forzar `headerShown: false` a todas
sus hijas).

## Antes / después

El `app/(tabs)/layout.tsx` actual del example (44 líneas, tres
`Tabs.Screen` que duplican los nombres de archivo):

```tsx
// app/(tabs)/layout.tsx — hoy
export default function TabsLayout() {
  return (
    <Tabs animation="fade">
      <Tabs.Screen name="index" options={{ title: 'Home', icon: … }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', icon: … }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes', icon: … }} />
    </Tabs>
  );
}
```

Con la propuesta:

```ts
// app/(tabs)/layout.ts
export const navigator: NavigatorConfig = { type: 'tabs', animation: 'fade' };
```

```tsx
// app/(tabs)/index.tsx
export const metadata: ScreenMetadata = { title: 'Home', tab: { icon: … } };
export default function HomeScreen() { … }
```

Y el stack raíz de `app/` desaparece por completo: es el implícito.

## Cómo se leería la metadata (nota técnica)

`require.context` ya entrega todos los módulos de `app/` a `parse.ts`
(ver [architecture.md](./architecture.md#1-descubrir-archivos-requirecontext-de-metro)),
pero hoy `parse` solo consume `ctx.keys()`: los módulos no se ejecutan
hasta que su pantalla se renderiza. Leer `metadata` obliga a ejecutar el
módulo (`ctx(key).metadata`), y el coste depende del navegador:

- **Stack**: lazy sin problema. Las opciones de una pantalla solo se
  necesitan cuando entra en la pila, y en ese momento su módulo se va a
  ejecutar de todas formas para renderizar el componente. Coste cero
  añadido.
- **Tabs**: la barra necesita título e icono de **todas** las pestañas al
  montarse, así que montar un Tabs ejecuta los módulos de todas sus rutas
  hermanas aunque solo una esté activa. Es el mismo coste que ya paga hoy
  un `layout.tsx` que importa los iconos, pero conviene documentarlo: los
  módulos de página no deben tener side effects en top-level (regla sana
  en cualquier caso).

Se consideró extraer la metadata estáticamente con el plugin de Babel
(como hace Next.js en build) para evitar ejecutar módulos. Se descarta en
esta fase: `tab.icon` es una render prop (JSX, no serializable), la
evaluación lazy del stack ya es gratis, y el plugin de Babel del paquete
se mantiene deliberadamente mínimo (JS plano sin build, ver
[architecture.md](./architecture.md)). Queda como optimización futura si
el coste del caso Tabs resultara medible.

Restricción heredada del engine: `src/route-tree/` no puede importar
React, así que el tipo de `tab.icon` obliga a que `ScreenMetadata` viva en
la capa de navegación (o use un tipo estructural sin importar `react`).
El árbol de `parse` seguiría siendo puro; la lectura de metadata ocurre en
`src/navigation/`.

## Fuera de alcance

- Metadata asíncrona / dependiente de datos remotos.
- Nuevos tipos de navegador (drawer) — la propuesta solo reorganiza cómo
  se declaran los existentes.
- Cambios en el matcher, deep linking o el reducer: la forma del árbol de
  rutas y las entradas de navegación no cambian.

## Encaje en el roadmap

Encajaría como una fase nueva **antes del release 1.0** (el paquete está
en 0.x; semver permite breaking changes en minor y así el 1.0 nace con el
modelo definitivo), en tres pasos TDD:

1. **Lectura de `metadata`/`generateMetadata`** y mezcla de precedencias en
   Stack y Tabs existentes (tests jest sobre `src/navigation/`).
2. **`layout.ts` declarativo** (`export const navigator`) y contrato
   `children` en `layout.tsx` (tests vitest en `parse` para la detección
   por carpeta, jest para el render y la persistencia del layout al
   navegar entre hijos).
3. **Stack implícito por defecto** — el breaking change, al final, con la
   migración documentada y verificación manual en `example/`.

## Decisiones tomadas

Resueltas el 2026-07-11 (eran las preguntas abiertas de la primera
versión de este documento):

- **Nombre de la export: `metadata`.** Prima la familiaridad con Next.js
  sobre la literalidad de `screenOptions`.
- **`generateMetadata` recibe `{ params, pathname, segments }`.** El
  matcher ya los tiene; añadirlos después no rompería la firma (es un
  objeto), pero exponerlos desde el principio evita la duda.
- **Metadata a nivel de `layout.ts` (defaults para las hijas): pospuesta.**
  La cadena de precedencia deja hueco para insertarla más adelante entre
  los defaults del paquete y la metadata de página, sin breaking change.
- **El stack implícito por defecto entra antes del release 1.0.** El
  paquete está en 0.x y el 1.0 sigue pendiente del checklist iOS; no hace
  falta un major, y el 1.0 se publica ya con el modelo definitivo.
