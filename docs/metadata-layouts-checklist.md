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

## Paso 1 — `metadata` / `generateMetadata` por página ✅

Tipos y lectura (capa `src/navigation/`, nunca `src/route-tree/` — la
regla ESLint de no importar React ahí sigue aplicando):

- [x] Definir `ScreenMetadata` y `GenerateMetadata` (opciones de stack
      planas, opciones de pestaña bajo `tab`) — `src/navigation/metadata.ts`
- [x] Helper de lectura segura del módulo: export ausente → defaults sin
      warning; export malformada (no-objeto, función que lanza) →
      warning solo en desarrollo + defaults

Tests jest (`src/navigation/metadata.test.tsx`), escritos antes del código:

- [x] Stack aplica `metadata` de la página al montarla: `title`,
      `headerShown`, `safeArea`, `presentation`, `animation`,
      `orientation`, `contentStyle`
- [x] Tabs lee `title` y `tab.icon` de **todas** las rutas hermanas al
      montar la barra (el árbol ya ejecuta los módulos en
      `buildRouteTree`, así que la captura es coste cero)
- [x] `generateMetadata({ params, pathname, segments })` se evalúa al
      resolver la entrada y se mezcla sobre la `metadata` estática
- [x] Página sin exports navega igual que hoy (caso base, sin warning)
- [x] Precedencia completa: defaults < `metadata` < `generateMetadata` <
      `<Stack.Screen options>`/`<Tabs.Screen options>` explícitos
- [x] Metadata parcial (solo `title`) completa el resto con defaults
- [x] Captura de exports en `parse` (vitest): nodos de página sí,
      `layout`/`not-found` no

Cierre del paso:

- [x] Exportar los tipos desde `src/index.ts`
- [x] `example/`: migradas las opciones de `modal` y `users/[id]` (stack,
      con `generateMetadata` dinámico) y de las tres pestañas (el layout
      de tabs queda sin `Tabs.Screen`)
- [x] **Checklist manual Android**: iconos/etiquetas de tab con opacidad
      por foco, header "Ajustes" desde el metadata del index del
      sub-stack, título dinámico "Usuario 42" vía generateMetadata y
      modal OTT (landscape, sin header/safe area, fondo negro) — todo
      verificado en emulador
- [ ] **Checklist iOS (pendiente de Mac)**
- [x] `npm run typecheck && npm run lint && npm run test`

Nota de implementación: la metadata de página no se aplica al `Screen`
exterior cuando el grupo contiene un layout anidado (mismo criterio que
`groupEntries`) — las opciones del interior no se filtran al stack padre.
El título de la pestaña de una carpeta (p. ej. `settings/`) sale del
`metadata` de su `index`.

## Paso 2 — `layout.ts` declarativo + contrato `children` ✅

- [x] Definir `NavigatorConfig` (`type: 'stack' | 'tabs' | 'slot'` +
      `animation`/`showLabel` para tabs) — `src/navigation/navigator-config.ts`
- [x] `parse.ts` (vitest): `layout.ts` ya entraba como nombre reservado;
      lo nuevo es tolerar un layout sin default export cuando exporta
      `navigator` (y error claro si no exporta ninguna de las dos)

Tests jest (`src/navigation/declarative-layout.test.tsx`), antes del código:

- [x] Carpeta con `export const navigator = { type: 'tabs', … }` monta
      Tabs con esas props, sin componente (también stack raíz declarativo)
- [x] `{ type: 'slot' }` reproduce el paso directo actual
- [x] `layout.tsx` con default export que renderiza `{children}` recibe
      el navegador de la carpeta y lo envuelve
- [x] Ambas exports (`navigator` + componente) conviven en el mismo
      archivo
- [x] Persistencia: el layout **no se remonta** al hacer push ni al
      cambiar de pestaña entre sus hijos
- [x] Componente que ignora `children` y monta su propio
      `<Stack>`/`<Tabs>` = modo manual actual, sin navegador duplicado
- [x] Renderizar a la vez navegador propio y `{children}` → warning en
      desarrollo (registro de montaje por nivel de ruta)
- [x] `navigator` malformado → warning en dev y paso directo

Cierre del paso:

- [x] `example/`: `app/(tabs)/layout.tsx` y `settings/layout.tsx`
      reemplazados por `layout.ts` declarativos (el título del detalle
      pasó a metadata); verificado en emulador: tabs con fade, iconos, y
      push dentro del sub-stack declarado con su header
- [ ] **Checklist iOS (pendiente de Mac)**
- [x] `npm run typecheck && npm run lint && npm run test`

Notas de implementación: el push agrupa entradas cuando el hijo directo
tiene navegador propio (layout manual **o** config declarativa; slot no);
`SlotContext` se mantiene con el subárbol directo por compatibilidad con
`<Slot>`, y `{children}` en un layout sin config equivale al Slot de hoy.

## Paso 3 — Árbol de rutas visual en la terminal (DX) ✅

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

- [x] Formateador puro `formatRouteTree(tree) → string` en
      `src/route-tree/format.ts` (sin React), con tests vitest:
      estáticas, `[id]`, `[...slug]`, grupos, `not-found`, tipo de
      navegador por carpeta
- [x] Anotaciones por nodo: URL resuelta, tipo de navegador
      (declarado/manual), marca de dinámica/catch-all, título de
      `metadata` cuando existe (todos los módulos ya están cargados en
      `buildRouteTree`, no hay coste extra)
- [x] Trigger en `RootRouter` (jest): imprime solo en `__DEV__` vía
      `logDev`, una vez por montaje y al reevaluarse el árbol; prop
      `logRoutes={false}` para desactivarlo
- [x] Verificado en dispositivo vía logcat (`ReactNativeJS`): árbol
      completo del example con navegadores, URLs y títulos. Nota: Metro
      ≥0.77 ya no muestra los console.log del cliente en su terminal —
      se ven en logcat y en React Native DevTools

## Paso 4 — Stack implícito por defecto (breaking change) ✅

- [x] Tests jest (`implicit-stack.test.tsx`): la raíz funciona sin ningún
      archivo de layout; una carpeta con varias rutas obtiene su propio
      stack implícito (el push agrupa dentro)
- [x] Regla de carpetas que no crean navegador: una carpeta con una única
      ruta hoja queda como pantalla del stack ancestro
      (`src/route-tree/implicit.ts`, compartido con el formateador)
- [x] Navegadores anidados y deep linking intactos (suites completas en
      verde; los tests de Tabs se actualizaron al nuevo contrato: la
      pantalla exterior del grupo existe y su header va oculto por
      defecto cuando el hijo tiene navegador propio)
- [x] Extra: `not-found.tsx` también acepta `metadata` (se copia a la
      hoja virtual de `matchNotFound`)
- [x] `example/`: eliminado el `layout.tsx` raíz — la app entera corre
      sin componentes de layout; verificado en emulador (tabs, login sin
      header desde metadata, not-found con título propio, árbol logueado
      con `Stack (implícito)`)
- [x] Migración documentada en los docs del Paso 5; entra en 0.x antes
      del release 1.0, sin bump major
- [x] `npm run smoke`
- [ ] **Checklist iOS (pendiente de Mac)**

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
