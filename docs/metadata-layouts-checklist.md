# Checklist de implementación: metadata + navegadores inferidos

> Plan paso a paso para implementar
> [rfc-metadata-layouts.md](./rfc-metadata-layouts.md). Rama:
> `feat/metadata-layouts`. Metodología TDD: cada paso empieza por los
> tests y termina con verificación manual en `example/` sobre emulador
> Android (checklist iOS pendiente de Mac, como el resto del roadmap).

## Paso 0 — Cerrar decisiones abiertas del RFC ✅

Resueltas el 2026-07-11, registradas en la sección
[Decisiones tomadas](./rfc-metadata-layouts.md#decisiones-tomadas) del RFC:

- [x] Nombre de la export: **`metadata`**
- [x] Firma de `generateMetadata`: **`{ params, pathname, segments }`**
- [x] Metadata a nivel de `layout.ts` como defaults para las hijas:
      **pospuesta** (la precedencia deja hueco para añadirla después)
- [x] Versionado: el stack implícito entra **antes del release 1.0**
      (paquete en 0.x, sin major)

## Paso 1 — `metadata` / `generateMetadata` por página

Tipos y lectura (capa `src/navigation/`, nunca `src/route-tree/` — la
regla ESLint de no importar React ahí sigue aplicando):

- [ ] Definir `ScreenMetadata` y `GenerateMetadata` (opciones de stack
      planas, opciones de pestaña bajo `tab`)
- [ ] Helper de lectura segura del módulo: export ausente → defaults sin
      warning; export malformada (no-objeto, función que lanza) →
      warning solo en desarrollo + defaults

Tests jest (`src/navigation/`), antes del código:

- [ ] Stack aplica `metadata` de la página al montarla: `title`,
      `headerShown`, `safeArea`, `presentation`, `animation`,
      `orientation`, `contentStyle`
- [ ] Tabs lee `title` y `tab.icon` de **todas** las rutas hermanas al
      montar la barra (lectura eager solo en Tabs; en Stack, lazy)
- [ ] `generateMetadata({ params })` se evalúa al resolver la entrada y
      se mezcla sobre la `metadata` estática
- [ ] Página sin exports navega igual que hoy (caso base, sin warning)
- [ ] Precedencia completa: defaults < `metadata` < `generateMetadata` <
      `<Stack.Screen options>`/`<Tabs.Screen options>` explícitos
- [ ] Metadata parcial (solo `title`) completa el resto con defaults

Cierre del paso:

- [ ] Exportar los tipos desde `src/index.ts`
- [ ] `example/`: migrar las opciones de una pantalla de cada navegador a
      `metadata` y verificar en emulador (headers, iconos de tab,
      transiciones)
- [ ] `npm run typecheck && npm run lint && npm run test`

## Paso 2 — `layout.ts` declarativo + contrato `children`

- [ ] Definir `NavigatorConfig` (`type: 'stack' | 'tabs' | 'slot'` +
      props del navegador: `animation`, `showLabel`, …)
- [ ] `parse.ts` (vitest): reconocer `layout.ts` además de `layout.tsx`
      como nombre reservado, sin cambiar la forma del árbol

Tests jest, antes del código:

- [ ] Carpeta con `export const navigator = { type: 'tabs', … }` monta
      Tabs con esas props, sin componente
- [ ] `{ type: 'slot' }` reproduce el paso directo actual
- [ ] `layout.tsx` con default export que renderiza `{children}` recibe
      el navegador de la carpeta y lo envuelve (providers/guards)
- [ ] Ambas exports (`navigator` + componente) conviven en el mismo
      archivo
- [ ] Persistencia: el layout **no se remonta** al hacer push ni al
      cambiar de pestaña entre sus hijos (contador de renders/efectos)
- [ ] Componente que ignora `children` y monta su propio
      `<Stack>`/`<Tabs>` = modo manual actual, sin navegador duplicado
- [ ] Renderizar a la vez navegador propio y `{children}` → warning en
      desarrollo

Cierre del paso:

- [ ] `example/`: reemplazar `app/(tabs)/layout.tsx` por `layout.ts` +
      `metadata` en `index`/`profile`/`settings`; verificar tabs, iconos
      y congelado de pestañas en emulador
- [ ] `npm run typecheck && npm run lint && npm run test`

## Paso 3 — Árbol de rutas visual en la terminal (DX)

Al estilo del listado de rutas de Next.js / `npx expo-router sitemap`:
al montar `RootRouter` en desarrollo, imprimir en la terminal de Metro el
árbol de pantallas descubierto, con el navegador de cada carpeta y la URL
resultante, para que el usuario vea de un vistazo qué se ha generado:

```
@jscode/react-native-routing · 6 rutas

app/                          Stack (implícito)
├── (tabs)/                   Tabs
│   ├── index                 /            "Home"
│   ├── profile               /profile     "Perfil"
│   └── settings              /settings    "Ajustes"
├── users/
│   └── [id]                  /users/:id   (dinámica)
└── not-found                 404          (default del paquete si falta)
```

- [ ] Formateador puro `formatRouteTree(tree) → string` en
      `src/route-tree/` (sin React: entra dentro de la regla ESLint),
      con tests vitest sobre el string: estáticas, `[id]`, `[...slug]`,
      grupos, `not-found`, tipo de navegador por carpeta
- [ ] Anotaciones por nodo: URL resuelta, tipo de navegador
      (implícito/declarado/manual), marca de dinámica/catch-all
- [ ] Títulos de `metadata` solo cuando ya están cargados (las pestañas
      de un Tabs, que se leen eager); no ejecutar módulos extra solo
      para el log
- [ ] Trigger en `RootRouter` (jest): imprime solo en `__DEV__`, una vez
      por montaje y al reevaluarse el árbol con Fast Refresh; prop u
      opción para desactivarlo (`logRoutes={false}` o similar)
- [ ] `example/`: comprobar la salida real en la terminal de Metro al
      arrancar y al añadir/renombrar una ruta con Fast Refresh

## Paso 4 — Stack implícito por defecto (breaking change)

- [ ] Tests jest: carpeta sin layout → `<Stack>` implícito (hoy: paso
      directo); la raíz `app/` funciona sin `layout.tsx`
- [ ] Regla de carpetas que no crean navegador: una carpeta con una única
      ruta hoja queda como pantalla del stack ancestro
- [ ] Revisar interacción con navegadores anidados (la regla actual del
      hijo directo) y con deep linking (`linking.ts` no debería cambiar,
      confirmarlo con sus tests)
- [ ] `example/`: eliminar el `layout.tsx` raíz y verificar checklist
      manual completo Android (push/pop, back físico, tabs, deep link
      con `adb`, Fast Refresh)
- [ ] Documentar la migración (quién quiera el comportamiento antiguo:
      `navigator: { type: 'slot' }`); entra en 0.x antes del release 1.0,
      sin bump major
- [ ] `npm run smoke` (el tarball publica los tipos nuevos)

## Paso 5 — Documentación y cierre

- [ ] Actualizar [file-conventions.md](./file-conventions.md): `layout.ts`
      como nombre reservado, stack implícito, `metadata`
- [ ] Actualizar [api-reference.md](./api-reference.md): `ScreenMetadata`,
      `GenerateMetadata`, `NavigatorConfig`, contrato `children`,
      precedencia, prop `logRoutes` de `RootRouter`
- [ ] Actualizar [getting-started.md](./getting-started.md) al flujo sin
      layouts manuales
- [ ] Añadir la fase al [roadmap.md](./roadmap.md) con su checklist iOS
      pendiente
- [ ] Marcar el RFC como implementado (o mover sus partes vigentes a los
      docs normales)
- [ ] Borrar este checklist
