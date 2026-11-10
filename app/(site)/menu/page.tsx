'use client';

import { useState } from 'react';
import MenuSection from '@/components/User/Menu/MenuSection';
import OrbitCarousel from '@/components/User/Orbit/OrbitCarousel';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function MenuPage() {
  const { menus, favorites, orbitSetting, addToCart } = useSite();
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<number | null>(null);

  useReveal([menus, favorites]);

  return (
    <>
      <OrbitCarousel
        favorites={favorites}
        setting={orbitSetting}
        onFavoriteClick={setSelectedFavoriteId}
      />

      <MenuSection
        menus={menus}
        onAddToCart={addToCart}
        focusMenuId={selectedFavoriteId}
        onFocusComplete={() => setSelectedFavoriteId(null)}
      />
    </>
  );
}