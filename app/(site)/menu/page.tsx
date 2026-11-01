'use client';

import MenuSection from '@/components/User/Menu/MenuSection';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function MenuPage() {
  const { menus, addToCart } = useSite();
  useReveal([menus]);
  return <MenuSection menus={menus} onAddToCart={addToCart} />;
}
