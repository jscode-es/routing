import React, { useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, ScreenContainer } from 'react-native-screens';
import { SafeAreaView } from 'react-native-screens/experimental';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { matchPath } from '../route-tree/match';
import { useReduceMotionEnabled } from './accessibility';
import {
  DepthContext,
  EntryContext,
  EntrySubtree,
  TabSwitchContext,
  useNavigatorMountGuard,
  useRouterState,
} from './RouterContext';
import { createEntry } from './reducer';
import type { NavigationEntry } from './reducer';
import { screenNameForEntry } from './stack-options';
import { TabBarVisibilityContext } from './tab-bar-visibility';
import { hrefForTab, resolveTabs, TabsScreen } from './tabs-options';

const ACTIVE_COLOR = '#0a7ea4';
const INACTIVE_COLOR = '#8e8e93';
const ICON_SIZE = 24;

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  // El SafeAreaView de screens aplica flex:1 por defecto; la barra debe
  // medir solo su contenido + inset inferior (gesture bar / home indicator).
  barSafeArea: {
    flex: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c7c7c7',
  },
  // El alto se anima (colapso real, no transform) para que el contenido
  // recupere el espacio de verdad al ocultar la barra, en vez de dejar un
  // hueco en blanco reservado por el flex.
  barCollapse: {
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 2,
    minHeight: 48,
  },
  label: { fontSize: 13 },
  labelActive: { fontSize: 13, fontWeight: '600' },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
  },
});

// Fade de entrada al activar una pestaña (las inactivas se descongelan al
// volver a primer plano; el fade-out no llega a verse porque el nativo las
// separa del árbol).
function TabFade({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}): React.JSX.Element {
  const opacity = useSharedValue(1);
  const reduceMotion = useReduceMotionEnabled();
  useEffect(() => {
    if (active && !reduceMotion) {
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [active, opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }), []);
  return (
    <Animated.View testID="tab-fade" style={[styles.container, style]}>
      {children}
    </Animated.View>
  );
}

function TabsComponent({
  children,
  animation = 'none',
  showLabel = true,
  order,
  hidden,
  style,
  activeTintColor = ACTIVE_COLOR,
  inactiveTintColor = INACTIVE_COLOR,
}: {
  children?: ReactNode;
  animation?: 'none' | 'fade';
  showLabel?: boolean;
  order?: string[];
  hidden?: string[];
  style?: StyleProp<ViewStyle>;
  activeTintColor?: string;
  inactiveTintColor?: string;
}): React.JSX.Element {
  const { tree, activeEntry } = useRouterState();
  useNavigatorMountGuard();
  const layoutDepth = useContext(DepthContext);
  const parentEntry = useContext(EntryContext);
  const switchTab = useContext(TabSwitchContext);
  // La entrada de referencia es la del subárbol propio: unas Tabs en
  // background no deben seguir a activeEntry si vive en otro subárbol.
  const referenceEntry = parentEntry ?? activeEntry;
  const { chain } = referenceEntry.match;
  const layoutNode = chain[layoutDepth] ?? tree;

  const allTabs = resolveTabs(layoutNode, children, order);
  const tabs =
    hidden !== undefined && hidden.length > 0
      ? allTabs.filter((tab) => !hidden.includes(tab.name))
      : allTabs;
  const activeName = screenNameForEntry(referenceEntry, layoutDepth);
  // -1: la ruta activa es una pestaña oculta — su pantalla se renderiza
  // igual (la expulsión, si procede, es cosa de un guard <Redirect>), pero
  // la barra no la muestra ni pinta indicador.
  const activeIndex = tabs.findIndex((tab) => tab.name === activeName);
  const indicatorIndex = Math.max(0, activeIndex);
  const contentTabs =
    activeIndex === -1
      ? [...tabs, { name: activeName, options: {} }]
      : tabs;

  // Última entry vista por pestaña: las pestañas en background mantienen su
  // subárbol montado (y sus params) mientras otra está en primer plano.
  // Estado derivado ajustado durante el render (patrón permitido por React).
  const [entries, setEntries] = useState<Record<string, NavigationEntry>>({});
  const pending: Record<string, NavigationEntry> = {};
  if (entries[activeName] !== referenceEntry) {
    pending[activeName] = referenceEntry;
  }
  for (const tab of tabs) {
    if (tab.name !== activeName && !entries[tab.name]) {
      const href = hrefForTab(chain, layoutDepth, tab.name);
      const match = matchPath(tree, href);
      if (match) pending[tab.name] = createEntry(href, match);
    }
  }
  if (Object.keys(pending).length > 0) {
    setEntries({ ...entries, ...pending });
  }

  const reduceMotion = useReduceMotionEnabled();
  const animationDuration = reduceMotion ? 0 : 200;

  const [barWidth, setBarWidth] = useState(0);
  const progress = useSharedValue(indicatorIndex);
  useEffect(() => {
    progress.value = withTiming(indicatorIndex, {
      duration: animationDuration,
    });
  }, [indicatorIndex, progress, animationDuration]);
  const itemWidth = tabs.length > 0 ? barWidth / tabs.length : 0;
  const indicatorStyle = useAnimatedStyle(
    () => ({
      width: itemWidth,
      transform: [{ translateX: progress.value * itemWidth }],
    }),
    [itemWidth],
  );

  // Progreso de ocultación de la barra (0 = visible, 1 = oculta), pilotado
  // por useHideTabBarOnScroll desde cualquier pantalla descendiente.
  const [barHeight, setBarHeight] = useState(0);
  const visibility = useSharedValue(0);
  useEffect(() => {
    visibility.value = withTiming(0, { duration: animationDuration });
  }, [activeName, visibility, animationDuration]);
  const barAnimatedStyle = useAnimatedStyle(
    () => ({
      // Sin medir aún: alto natural (auto) para no forzar 0 en el primer
      // frame.
      height:
        barHeight === 0 ? undefined : barHeight * (1 - visibility.value),
    }),
    [barHeight],
  );

  // Anuncio a lectores de pantalla al cambiar de pestaña: a diferencia de un
  // push/pop del Stack (transición nativa que el SO anuncia solo), cambiar
  // de pestaña no dispara nada nativo porque todas viven en el mismo árbol.
  const activeTab = allTabs.find((tab) => tab.name === activeName);
  const activeAccessibilityLabel =
    activeTab?.options.accessibilityLabel ??
    activeTab?.options.title ??
    activeName;
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    AccessibilityInfo.announceForAccessibility(activeAccessibilityLabel);
  }, [activeAccessibilityLabel]);

  return (
    <View style={styles.root}>
      <TabBarVisibilityContext.Provider value={visibility}>
        <ScreenContainer style={styles.container}>
          {contentTabs.map((tab) => {
            const entry = entries[tab.name];
            if (!entry) return null;
            const active = tab.name === activeName;
            return (
              <Screen
                key={tab.name}
                style={StyleSheet.absoluteFill}
                activityState={active ? 2 : 0}
              >
                <EntryContext.Provider value={entry}>
                  {animation === 'fade' ? (
                    <TabFade active={active}>
                      <EntrySubtree entry={entry} layoutDepth={layoutDepth} />
                    </TabFade>
                  ) : (
                    <EntrySubtree entry={entry} layoutDepth={layoutDepth} />
                  )}
                </EntryContext.Provider>
              </Screen>
            );
          })}
        </ScreenContainer>
      </TabBarVisibilityContext.Provider>
      <Animated.View
        testID="tabs-bar"
        style={[styles.barCollapse, barAnimatedStyle]}
      >
        <View
          onLayout={(e: LayoutChangeEvent) => {
            // Máximo histórico: mientras la barra colapsa, este View se
            // remide contra el alto ya reducido del padre y reportaría
            // valores decrecientes que corromperían la medida real.
            const height = e.nativeEvent.layout.height;
            setBarHeight((current) => Math.max(current, height));
          }}
        >
          <SafeAreaView
            edges={{ bottom: true }}
            style={[styles.barSafeArea, style]}
          >
            <View
              style={styles.bar}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
            >
              {activeIndex >= 0 && (
                <Animated.View
                  testID="tab-indicator"
                  style={[
                    styles.indicator,
                    indicatorStyle,
                    { backgroundColor: activeTintColor },
                  ]}
                />
              )}
              {tabs.map((tab) => {
                const active = tab.name === activeName;
                const tintColor = active
                  ? activeTintColor
                  : inactiveTintColor;
                return (
                  <Pressable
                    key={tab.name}
                    testID={`tab-${tab.name}`}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={
                      tab.options.accessibilityLabel ??
                      tab.options.title ??
                      tab.name
                    }
                    style={styles.item}
                    onPress={() =>
                      switchTab?.(hrefForTab(chain, layoutDepth, tab.name))
                    }
                  >
                    {tab.options.icon?.({
                      focused: active,
                      color: tintColor,
                      size: ICON_SIZE,
                    })}
                    {showLabel && (
                      <Text
                        style={[
                          active ? styles.labelActive : styles.label,
                          { color: tintColor },
                        ]}
                      >
                        {tab.options.title ?? tab.name}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>
    </View>
  );
}

export const Tabs = Object.assign(TabsComponent, { Screen: TabsScreen });
