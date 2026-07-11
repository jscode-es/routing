import React from 'react';
import { Tabs } from '@jscode/react-native-routing';
import { usePremium } from '../../auth';

// Título e icono de cada pestaña salen del export metadata de su página.
// La visibilidad es dinámica: con premium activo se muestra la pestaña
// Premium y se oculta Mejorar (y al revés); las rutas ocultas siguen
// siendo navegables.
export default function TabsLayout() {
  const premium = usePremium();
  return (
    <Tabs
      animation="fade"
      order={['index', 'profile', 'settings']}
      hidden={premium ? ['upgrade'] : ['premium']}
    />
  );
}
