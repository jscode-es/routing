import type { RequireContext } from './context';

// El plugin "@jscode/react-native-routing/babel" reemplaza el `return null`
// por un require.context apuntando al directorio de rutas del proyecto.
// Sin el plugin configurado, RootRouter exige el prop `context`.
export function getAppContext(): RequireContext | null {
  return null;
}
