import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { RouteNode } from '../route-tree/types';
import { DeclaredNavigator } from './DeclaredNavigator';
import { warnDev } from './dev';
import { readNavigatorConfig } from './navigator-config';
import type { NavigationEntry } from './reducer';
import type { Router } from './router';

export interface RouterState {
  tree: RouteNode;
  stack: NavigationEntry[];
  activeEntry: NavigationEntry;
}

export const RouterStateContext = createContext<RouterState | null>(null);

export const RouterApiContext = createContext<Router | null>(null);

// Entrada del stack a la que pertenece el subárbol (pantallas en background
// conservan sus propios params aunque activeEntry haya cambiado).
export const EntryContext = createContext<NavigationEntry | null>(null);

// Interno: cambia de pestaña sin apilar historial (SET_ACTIVE_TAB).
export const TabSwitchContext = createContext<((href: string) => void) | null>(
  null,
);

// Interno: un ancestro (header nativo visible o SafeAreaView de pantalla
// sin header) ya gestiona el inset superior — los navegadores anidados no
// deben volver a aplicarlo (evita el doble hueco bajo la barra de estado).
export const TopInsetHandledContext = createContext(false);

export const DepthContext = createContext(0);

export const SlotContext = createContext<ReactNode>(null);

// Registro de navegadores montados en un mismo nivel de ruta: cada
// RouteLevel provee el suyo, y Stack/Tabs se registran para detectar un
// layout que renderiza a la vez {children} y un navegador propio.
interface NavigatorMountRegistry {
  register(): () => void;
}

function createMountRegistry(): NavigatorMountRegistry {
  let count = 0;
  return {
    register() {
      count += 1;
      if (count > 1) {
        warnDev(
          'A route level mounted more than one navigator: render either {children} or an explicit <Stack>/<Tabs> in the layout, not both.',
        );
      }
      return () => {
        count -= 1;
      };
    },
  };
}

export const NavigatorMountContext =
  createContext<NavigatorMountRegistry | null>(null);

export function useNavigatorMountGuard(): void {
  const registry = useContext(NavigatorMountContext);
  useEffect(() => registry?.register(), [registry]);
}

export function useRouterState(): RouterState {
  const state = useContext(RouterStateContext);
  if (!state) {
    throw new Error(
      'No router found. Wrap your app in <RootRouter> before using routing components or hooks.',
    );
  }
  return state;
}

export function RouteLevel({
  chain,
  index,
}: {
  chain: RouteNode[];
  index: number;
}): React.JSX.Element | null {
  const [levelMounts] = useState(createMountRegistry);
  const node = chain[index];
  if (!node) return null;

  const isLeaf = index === chain.length - 1;
  const Component = node.component as ComponentType | undefined;
  const inner = isLeaf ? (
    Component ? (
      <Component />
    ) : null
  ) : (
    <RouteLevel chain={chain} index={index + 1} />
  );

  // El contenido del nivel es el navegador declarado en layout.ts (slot y
  // ausencia de config son el paso directo). Un layout con componente lo
  // recibe como children (contrato estilo Next.js); SlotContext se mantiene
  // con el subárbol directo por compatibilidad con <Slot>.
  const config = readNavigatorConfig(node);
  const content =
    config && config.type !== 'slot' ? (
      <DeclaredNavigator config={config} />
    ) : (
      inner
    );

  let body = content;
  if (node.layout) {
    const Layout = node.layout as ComponentType<{ children?: ReactNode }>;
    body = (
      <SlotContext.Provider value={inner}>
        <Layout>{content}</Layout>
      </SlotContext.Provider>
    );
  }

  return (
    <DepthContext.Provider value={index}>
      <NavigatorMountContext.Provider value={levelMounts}>
        {body}
      </NavigatorMountContext.Provider>
    </DepthContext.Provider>
  );
}

export function EntrySubtree({
  entry,
  layoutDepth,
}: {
  entry: NavigationEntry;
  layoutDepth: number;
}): React.JSX.Element | null {
  const { chain } = entry.match;
  // Ruta index: la hoja es el propio nodo del layout, no hay nivel inferior.
  if (layoutDepth === chain.length - 1) {
    const Component = chain[layoutDepth]?.component as
      | ComponentType
      | undefined;
    return Component ? <Component /> : null;
  }
  return <RouteLevel chain={chain} index={layoutDepth + 1} />;
}
