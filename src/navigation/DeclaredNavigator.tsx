import React from 'react';
import { Stack } from './Stack';
import { Tabs } from './Tabs';
import type { NavigatorConfig } from './navigator-config';

export function DeclaredNavigator({
  config,
}: {
  config: NavigatorConfig;
}): React.JSX.Element {
  if (config.type === 'tabs') {
    return (
      <Tabs
        animation={config.animation}
        showLabel={config.showLabel}
        order={config.order}
        hidden={config.hidden}
      />
    );
  }
  return <Stack />;
}
