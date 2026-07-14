import React from 'react';
import { Tabs } from '@authuser/react-native-routing';
import { usePremium } from '../../auth';

// Título e icono de cada pestaña salen del export metadata de su página.
// La visibilidad es dinámica: con premium activo se muestra la pestaña
// Premium y se oculta Mejorar (y al revés); las rutas ocultas siguen
// siendo navegables. order se aplica antes que hidden, así que listar
// ambas coloca a la visible en ese hueco (aquí, segunda posición).
// style/activeTintColor/inactiveTintColor demuestran el tabbar oscuro y
// tintado; la pestaña Home oculta esta misma barra al hacer scroll (ver
// useHideTabBarOnScroll en index.tsx).
export default function TabsLayout() {
  const premium = usePremium();
  return (
    <Tabs
      animation="fade"
      order={['index', 'premium', 'upgrade', 'profile', 'settings']}
      hidden={premium ? ['upgrade'] : ['premium']}
      style={{ backgroundColor: 'rgba(17,24,39,0.92)', borderTopWidth: 0 }}
      activeTintColor="#38bdf8"
      inactiveTintColor="#9ca3af"
    />
  );
}
