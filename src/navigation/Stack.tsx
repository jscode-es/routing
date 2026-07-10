import React, { useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import {
  Screen,
  ScreenContentWrapper,
  ScreenStack,
  ScreenStackHeaderConfig,
} from 'react-native-screens';
import {
  DepthContext,
  EntryContext,
  EntrySubtree,
  useRouterState,
} from './RouterContext';
import { useRouter } from './hooks';
import {
  collectScreenConfigs,
  createBackPressHandler,
  screenNameForEntry,
  StackScreen,
} from './stack-options';

const styles = StyleSheet.create({ fill: { flex: 1 } });

function StackComponent({
  children,
}: {
  children?: ReactNode;
}): React.JSX.Element {
  const { stack } = useRouterState();
  const layoutDepth = useContext(DepthContext);
  const api = useRouter();
  const configs = collectScreenConfigs(children);

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
      {stack.map((entry, index) => {
        const name = screenNameForEntry(entry, layoutDepth);
        const options = configs[name] ?? {};
        return (
          <Screen
            key={entry.key}
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
            shouldFreeze={index < stack.length - 2}
            stackPresentation={options.presentation ?? 'push'}
            onDismissed={(event) => {
              for (let i = 0; i < event.nativeEvent.dismissCount; i++) {
                api.back();
              }
            }}
          >
            {/* El nativo recoloca este wrapper bajo el header; sin él, el
                contenido se layouta a pantalla completa y el fondo queda
                recortado. El header config nunca puede ser el primer hijo. */}
            <ScreenContentWrapper style={StyleSheet.absoluteFill}>
              <EntryContext.Provider value={entry}>
                <EntrySubtree entry={entry} layoutDepth={layoutDepth} />
              </EntryContext.Provider>
            </ScreenContentWrapper>
            <ScreenStackHeaderConfig title={options.title ?? name} />
          </Screen>
        );
      })}
    </ScreenStack>
  );
}

export const Stack = Object.assign(StackComponent, { Screen: StackScreen });
