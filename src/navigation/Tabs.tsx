import React, { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, ScreenContainer } from 'react-native-screens';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { matchPath } from '../route-tree/match';
import {
  DepthContext,
  EntryContext,
  EntrySubtree,
  TabSwitchContext,
  useRouterState,
} from './RouterContext';
import { createEntry } from './reducer';
import type { NavigationEntry } from './reducer';
import { screenNameForEntry } from './stack-options';
import { hrefForTab, resolveTabs, TabsScreen } from './tabs-options';

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c7c7c7',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: { color: '#8e8e93', fontSize: 13 },
  labelActive: { color: '#0a7ea4', fontSize: 13, fontWeight: '600' },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: '#0a7ea4',
  },
});

function TabsComponent({
  children,
}: {
  children?: ReactNode;
}): React.JSX.Element {
  const { tree, activeEntry } = useRouterState();
  const layoutDepth = useContext(DepthContext);
  const parentEntry = useContext(EntryContext);
  const switchTab = useContext(TabSwitchContext);
  // La entrada de referencia es la del subárbol propio: unas Tabs en
  // background no deben seguir a activeEntry si vive en otro subárbol.
  const referenceEntry = parentEntry ?? activeEntry;
  const { chain } = referenceEntry.match;
  const layoutNode = chain[layoutDepth] ?? tree;

  const tabs = resolveTabs(layoutNode, children);
  const activeName = screenNameForEntry(referenceEntry, layoutDepth);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.name === activeName),
  );

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

  const [barWidth, setBarWidth] = useState(0);
  const progress = useSharedValue(activeIndex);
  useEffect(() => {
    progress.value = withTiming(activeIndex, { duration: 200 });
  }, [activeIndex, progress]);
  const itemWidth = tabs.length > 0 ? barWidth / tabs.length : 0;
  const indicatorStyle = useAnimatedStyle(
    () => ({
      width: itemWidth,
      transform: [{ translateX: progress.value * itemWidth }],
    }),
    [itemWidth],
  );

  return (
    <View style={styles.root}>
      <ScreenContainer style={styles.container}>
        {tabs.map((tab) => {
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
                <EntrySubtree entry={entry} layoutDepth={layoutDepth} />
              </EntryContext.Provider>
            </Screen>
          );
        })}
      </ScreenContainer>
      <View
        style={styles.bar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View testID="tab-indicator" style={[styles.indicator, indicatorStyle]} />
        {tabs.map((tab) => {
          const active = tab.name === activeName;
          return (
            <Pressable
              key={tab.name}
              testID={`tab-${tab.name}`}
              style={styles.item}
              onPress={() =>
                switchTab?.(hrefForTab(chain, layoutDepth, tab.name))
              }
            >
              <Text style={active ? styles.labelActive : styles.label}>
                {tab.options.title ?? tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const Tabs = Object.assign(TabsComponent, { Screen: TabsScreen });
