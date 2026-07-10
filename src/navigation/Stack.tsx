import React, { useContext, useEffect, useRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import {
  Screen,
  ScreenStack,
  ScreenStackHeaderConfig,
} from 'react-native-screens';
import {
  DepthContext,
  EntryContext,
  RouteLevel,
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

const styles = StyleSheet.create({ fill: { flex: 1 } });

function EntryContent({
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
            style={styles.fill}
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
            <ScreenStackHeaderConfig title={options.title ?? name} />
            <EntryContext.Provider value={entry}>
              <EntryContent entry={entry} layoutDepth={layoutDepth} />
            </EntryContext.Provider>
          </Screen>
        );
      })}
    </ScreenStack>
  );
}

export const Stack = Object.assign(StackComponent, { Screen: StackScreen });
