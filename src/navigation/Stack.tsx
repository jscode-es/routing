import React, { useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import {
  Screen,
  ScreenContentWrapper,
  ScreenStack,
  ScreenStackHeaderConfig,
} from 'react-native-screens';
import { SafeAreaView } from 'react-native-screens/experimental';
import type { RouteNode } from '../route-tree/types';
import {
  DepthContext,
  EntryContext,
  EntrySubtree,
  TopInsetHandledContext,
  useRouterState,
} from './RouterContext';
import { useRouter } from './hooks';
import type { NavigationEntry } from './reducer';
import {
  collectScreenConfigs,
  createBackPressHandler,
  screenNameForEntry,
  StackScreen,
} from './stack-options';

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Fondo opaco por defecto: sin él, la pantalla entrante es transparente
  // y durante la animación de push/pop se mezcla con la de debajo.
  opaqueContent: { backgroundColor: '#f2f2f2' },
});

interface ScreenGroup {
  key: string;
  entries: NavigationEntry[];
  child: RouteNode | undefined;
}

// Las entradas consecutivas cuyo hijo directo tiene su propio layout
// comparten Screen: ese subárbol monta un navegador anidado que gestiona
// sus propias pantallas (el push entra al stack interior, no al exterior).
function groupEntries(
  entries: NavigationEntry[],
  layoutDepth: number,
): ScreenGroup[] {
  const groups: ScreenGroup[] = [];
  for (const entry of entries) {
    const child = entry.match.chain[layoutDepth + 1];
    const last = groups[groups.length - 1];
    if (
      last &&
      child !== undefined &&
      last.child === child &&
      child.layout !== undefined
    ) {
      last.entries.push(entry);
    } else {
      groups.push({ key: entry.key, entries: [entry], child });
    }
  }
  return groups;
}

function StackComponent({
  children,
}: {
  children?: ReactNode;
}): React.JSX.Element {
  const { tree, stack, activeEntry } = useRouterState();
  const layoutDepth = useContext(DepthContext);
  const parentEntry = useContext(EntryContext);
  const topInsetHandled = useContext(TopInsetHandledContext);
  const api = useRouter();
  const configs = collectScreenConfigs(children);

  // El nodo del propio layout se lee de la entrada bajo la que se renderiza
  // este Stack (no de activeEntry: un stack anidado en background seguiría
  // montado mientras la entrada activa vive en otro subárbol).
  const referenceChain = (parentEntry ?? activeEntry).match.chain;
  const ownNode = layoutDepth === 0 ? tree : referenceChain[layoutDepth];
  const scoped = ownNode
    ? stack.filter((entry) => entry.match.chain[layoutDepth] === ownNode)
    : [];
  const groups = groupEntries(scoped, layoutDepth);

  const stackDepthRef = useRef(stack.length);
  useEffect(() => {
    stackDepthRef.current = stack.length;
  }, [stack.length]);

  useEffect(() => {
    const handler = createBackPressHandler(
      () => stackDepthRef.current,
      api.back,
    );
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handler,
    );
    return () => subscription.remove();
  }, [api]);

  return (
    <ScreenStack style={styles.fill}>
      {groups.map((group, index) => {
        const entry = group.entries[group.entries.length - 1]!;
        const name = screenNameForEntry(entry, layoutDepth);
        const options = configs[name] ?? {};
        const headerShown = options.headerShown !== false;
        const wantsSafeArea =
          !headerShown && options.safeArea !== false && !topInsetHandled;
        const content = (
          <EntryContext.Provider value={entry}>
            <EntrySubtree entry={entry} layoutDepth={layoutDepth} />
          </EntryContext.Provider>
        );
        return (
          <Screen
            key={group.key}
            // absoluteFill, no flex:1 — el nativo fija la altura real del
            // Screen (viewport menos header) vía state update, y flexGrow
            // la pisaría estirándolo de nuevo a pantalla completa.
            style={StyleSheet.absoluteFill}
            // En ScreenStack el activityState no puede decrecer (2 -> 0
            // lanza en nativo); el congelado va aparte con shouldFreeze.
            // Se deja sin congelar la pantalla justo bajo el top para que
            // la animación de pop / swipe-back tenga contenido que mostrar.
            activityState={2}
            freezeOnBlur
            shouldFreeze={index < groups.length - 2}
            stackPresentation={options.presentation ?? 'push'}
            onDismissed={(event) => {
              const pops = event.nativeEvent.dismissCount * group.entries.length;
              for (let i = 0; i < pops; i++) {
                api.back();
              }
            }}
          >
            {/* El nativo recoloca este wrapper bajo el header; sin él, el
                contenido se layouta a pantalla completa y el fondo queda
                recortado. El header config nunca puede ser el primer hijo. */}
            <ScreenContentWrapper
              style={[
                StyleSheet.absoluteFill,
                options.presentation !== 'transparentModal' &&
                  styles.opaqueContent,
                options.contentStyle,
              ]}
            >
              <TopInsetHandledContext.Provider
                value={topInsetHandled || headerShown || wantsSafeArea}
              >
                {wantsSafeArea ? (
                  <SafeAreaView edges={{ top: true }} style={styles.fill}>
                    {content}
                  </SafeAreaView>
                ) : (
                  content
                )}
              </TopInsetHandledContext.Provider>
            </ScreenContentWrapper>
            <ScreenStackHeaderConfig
              title={options.title ?? name}
              hidden={headerShown ? undefined : true}
              // Un ancestro ya aplicó el inset superior: este header no
              // debe volver a sumar el alto de la barra de estado.
              disableTopInsetApplication={topInsetHandled ? true : undefined}
            />
          </Screen>
        );
      })}
    </ScreenStack>
  );
}

export const Stack = Object.assign(StackComponent, { Screen: StackScreen });
