import React, { useContext } from 'react';
import { SlotContext } from './RouterContext';

export function Slot(): React.JSX.Element {
  const content = useContext(SlotContext);
  return <>{content}</>;
}
