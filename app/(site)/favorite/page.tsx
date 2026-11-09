import { redirect } from 'next/navigation';

export default function FavoritePage() {
  redirect('/menu#favorite-menus');
}