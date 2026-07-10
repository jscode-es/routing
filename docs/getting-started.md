# Primeros pasos

> Módulo **para React Native** (iOS/Android). Requiere un proyecto React
> Native CLI existente (`npx @react-native-community/cli init`); no aplica
> a proyectos web ni a Expo Go.

## 1. Instalar

```sh
npm install @jscode/react-native-routing \
  react-native-screens react-native-gesture-handler \
  react-native-reanimated react-native-worklets
```

No hace falta instalar React Navigation, Expo, ni
`react-native-safe-area-context`. Las librerías de arriba son peer
dependencies obligatorias: cubren la gestión nativa de pantallas, los
gestos y las animaciones del motor de navegación (ver
[architecture.md](./architecture.md#3-motor-de-navegación-propio-sobre-primitivas-nativas)).
`react-native-worklets` es requisito de `react-native-reanimated` v4+, que
separó el runtime de worklets en un paquete propio.

Tras instalar, en iOS hace falta instalar los pods nativos:

```sh
cd ios && pod install && cd ..
```

(Sustituye `@jscode/react-native-routing` por el nombre final del
paquete una vez publicado.)

## 2. Configurar Babel

`react-native-reanimated` v4 requiere el plugin de Babel de
`react-native-worklets`, **último** en la lista de plugins:

```js
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ...otros plugins
    'react-native-worklets/plugin', // siempre el último
  ],
};
```

## 3. Configurar Metro

```js
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withRouting } = require('@jscode/react-native-routing/metro');

module.exports = withRouting(getDefaultConfig(__dirname));
```

`withRouting` activa `transformer.unstable_allowRequireContext`, necesario
para que la app pueda enumerar el directorio `app/` con `require.context`
(paso 5).

## 4. Punto de entrada

`react-native-gesture-handler` exige importarse antes que ningún otro
módulo en el entry point de la app:

```js
// index.js
import 'react-native-gesture-handler'; // primera línea, antes que cualquier otro import
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

## 5. Montar el router raíz

La app es quien llama a `require.context` sobre su propio directorio
`app/` (tiene que ser un string literal, Metro lo resuelve en build-time —
por eso no puede hacerlo el paquete desde `node_modules`) y se lo pasa a
`RootRouter`:

```tsx
// App.tsx
import { RootRouter } from '@jscode/react-native-routing';

export default function App() {
  return <RootRouter context={require.context('./app', true, /\.[jt]sx?$/)} />;
}
```

`RootRouter` ya envuelve internamente el `GestureHandlerRootView` que
necesita `react-native-gesture-handler` — no hace falta añadirlo a mano.

## 6. Crear las primeras rutas

```
app/
  layout.tsx
  index.tsx
  users/
    [id].tsx
```

```tsx
// app/layout.tsx
import { Stack } from '@jscode/react-native-routing';

export default function RootLayout() {
  return <Stack />;
}
```

```tsx
// app/index.tsx
import { Link } from '@jscode/react-native-routing';

export default function Home() {
  return <Link href="/users/42">Ir al usuario 42</Link>;
}
```

```tsx
// app/users/[id].tsx
import { Text } from 'react-native';
import { useLocalSearchParams } from '@jscode/react-native-routing';

export default function User() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>User {id}</Text>;
}
```

Ejecuta la app como siempre (`npm run ios` / `npm run android`) — no hace
falta ningún paso de codegen adicional: los archivos nuevos bajo `app/` se
detectan mediante el `require.context` de Metro en el siguiente Fast
Refresh (el único cambio de configuración es el plugin de Babel del paso 2,
que solo se hace una vez).

Consulta [file-conventions.md](./file-conventions.md) para ver todos los
patrones soportados, y [api-reference.md](./api-reference.md) para la lista
completa de componentes y hooks.
