import React from 'react';
import type { ReactNode } from 'react';
import type { RouteNode } from '../route-tree/types';

export interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export interface TabsScreenOptions {
  title?: string;
  // Render prop: el consumidor trae su propio icono (Image, SVG,
  // vector-icons, un emoji en un Text...), el paquete no bundlea ninguno.
  icon?: (props: TabIconProps) => ReactNode;
}

export interface TabsScreenProps {
  name: string;
  options?: TabsScreenOptions;
}

// Declarativo: no pinta nada, Tabs lee sus props vía resolveTabs.
export function TabsScreen(_props: TabsScreenProps): null {
  return null;
}

export interface TabDescriptor {
  name: string;
  options: TabsScreenOptions;
}

export function collectTabConfigs(
  children: ReactNode,
): Record<string, TabsScreenOptions> {
  const configs: Record<string, TabsScreenOptions> = {};
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === TabsScreen) {
      const { name, options } = child.props as TabsScreenProps;
      configs[name] = options ?? {};
    }
  });
  return configs;
}

export function resolveTabs(
  layoutNode: RouteNode,
  children: ReactNode,
): TabDescriptor[] {
  const explicit: TabDescriptor[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === TabsScreen) {
      const { name, options } = child.props as TabsScreenProps;
      explicit.push({ name, options: options ?? {} });
    }
  });
  if (explicit.length > 0) return explicit;

  const tabs: TabDescriptor[] = [];
  if (layoutNode.component !== undefined) {
    tabs.push({ name: 'index', options: {} });
  }
  for (const child of layoutNode.children) {
    if (child.component !== undefined && child.type === 'static') {
      tabs.push({ name: child.segment, options: {} });
    }
  }
  return tabs;
}

export function hrefForTab(
  chain: RouteNode[],
  layoutDepth: number,
  name: string,
): string {
  const base = chain
    .slice(1, layoutDepth + 1)
    .filter((node) => node.type !== 'group')
    .map((node) => node.segment);
  const segments = name === 'index' ? base : [...base, name];
  return `/${segments.join('/')}`;
}
