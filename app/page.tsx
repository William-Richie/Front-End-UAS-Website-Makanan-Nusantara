'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/User/Navbar/Navbar';
import Hero from '@/components/User/Hero/Hero';
import About from '@/components/User/About/About';
import OrbitCarousel, { FavoriteItem } from '@/components/User/Orbit/OrbitCarousel';
import MenuSection, { MenuItem } from '@/components/User/Menu/MenuSection';
import FaqSection, { FaqItem } from '@/components/User/Faq/FaqSection';
import LocationSection from '@/components/User/Location/LocationSection';
import ReservationSection, { BranchMap } from '@/components/User/Reservation/ReservationSection';
import MyReservationSection from '@/components/User/MyReservation/MyReservationSection';
import Footer from '@/components/User/Footer/Footer';
import CartFloating, { CartItem } from '@/components/User/FloatingButton/FloatingButton';
import CheckoutModal from '@/components/User/Checkout/CheckoutModal';
import AuthModal from '@/components/User/Auth/AuthModal';
import IntroOverlay from '@/components/User/Intro/IntroOverlay';
import { useReveal } from '@/hooks/useReveal';
import ProfileModal from '@/components/User/Profile/ProfileModal';

interface UserData {
  id: string;
  nama: string;
  email: string;
}

interface KontenWebData {
  id?: number;
  teks_hero?: string | null;
  teks_about?: string | null;
}

interface KontenFooterData {
  id?: number;
  judul?: string | null;
  copyright?: string | null;
  link_ig?: string | null;
  link_tiktok?: string | null;
  link_wa?: string | null;
  link_linkedin?: string | null;
  email?: string | null;
}

const CART_KEY = 'papeda_cart';
const MAX_QTY_PER_ITEM = 99;

export default function Home() {
  // State User Auth
  const [user, setUser] = useState<UserData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authKey, setAuthKey] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  // State Data Database
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [branches, setBranches] = useState<BranchMap[]>([]);
  const [kontenWeb, setKontenWeb] = useState<KontenWebData | null>(null);
  const [kontenFooter, setKontenFooter] = useState<KontenFooterData | null>(null);

  // State Cart & Checkout
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartHydrated = useRef(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll Reveal
  useReveal([menus, favorites, faqs, branches, kontenWeb]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('papeda_user');
    if (saved) {
      const timer = setTimeout(() => {
        try {
          setUser(JSON.parse(saved));
        } catch {
          localStorage.removeItem('papeda_user');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (i): i is CartItem =>
              !!i &&
              typeof i.id === 'number' &&
              typeof i.nama_makanan === 'string' &&
              typeof i.harga === 'number' &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0
          );
          if (valid.length) setCartItems(valid);
        }
      } catch {
        localStorage.removeItem(CART_KEY);
      }
      cartHydrated.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cartHydrated.current) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch {
    }
  }, [cartItems]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Konten Web
        fetch('/api/konten')
          .then((r) => r.json())
          .then((d) => setKontenWeb(d.data || d))
          .catch(() => { });

        // Konten Footer
        fetch('/api/footer')
          .then((r) => r.json())
          .then((d) => setKontenFooter(d.data || d))
          .catch(() => { });

        // Menu
        fetch('/api/menu')
          .then((r) => r.json())
          .then((d) => setMenus(d.data || []))
          .catch(() => { });

        // Favorit
        fetch('/api/favorit')
          .then((r) => r.json())
          .then((d) => setFavorites(d.data || []))
          .catch(() => { });

        // FAQ
        fetch('/api/faq')
          .then((r) => r.json())
          .then((d) => setFaqs(d.data || []))
          .catch(() => { });

        // Maps
        fetch('/api/maps')
          .then((r) => r.json())
          .then((d) => setBranches(d.data || []))
          .catch(() => { });

        // Statistik pengunjung
        fetch('/api/pengunjung', { method: 'POST' }).catch(() => { });
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('logged-in', !!user);
  }, [user]);

  const cartView = useMemo<CartItem[]>(() => {
    if (menus.length === 0) return cartItems;
    const byId = new Map(menus.map((m) => [m.id, m]));
    return cartItems.flatMap((i) => {
      const m = byId.get(i.id);
      if (!m || !m.status) return [];
      return [{ ...i, nama_makanan: m.nama_makanan, harga: m.harga, gambar: m.gambar }];
    });
  }, [cartItems, menus]);

  // Cart Handlers
  const handleAddToCart = (menu: MenuItem, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === menu.id);
      if (existing) {
        return prev.map((i) =>
          i.id === menu.id
            ? { ...i, quantity: Math.min(MAX_QTY_PER_ITEM, i.quantity + qty) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: menu.id,
          nama_makanan: menu.nama_makanan,
          harga: menu.harga,
          quantity: qty,
          gambar: menu.gambar,
        },
      ];
    });
    showToast(
      qty > 1 ? `Ditambahkan: ${qty}x ${menu.nama_makanan}` : `Ditambahkan: ${menu.nama_makanan}`
    );
  };

  const handleUpdateQty = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: Math.min(MAX_QTY_PER_ITEM, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleOpenAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setAuthKey((k) => k + 1);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('papeda_user');
    setUser(null);
    showToast('Berhasil logout.');
  };

  return (
    <>
      <IntroOverlay onEnter={() => { }} />

      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main>
        <Hero teksHero={kontenWeb?.teks_hero} />
        <About teksAbout={kontenWeb?.teks_about} />
        <OrbitCarousel favorites={favorites} />
        <MenuSection menus={menus} onAddToCart={handleAddToCart} />
        <FaqSection faqList={faqs} onSuccessNotification={showToast} />
        <LocationSection branches={branches} />
        <ReservationSection
          branches={branches}
          user={user}
          onOpenAuth={handleOpenAuth}
          onSuccess={showToast}
        />
        <MyReservationSection user={user} onNotification={showToast} />
      </main>

      <Footer data={kontenFooter} />

      {/* Floating Actions */}
      <CartFloating
        items={cartView}
        onUpdateQuantity={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          if (!user) {
            handleOpenAuth('login');
          } else {
            setCheckoutModalOpen(true);
          }
        }}
      />

      {/* Modals */}
      <CheckoutModal
        show={checkoutModalOpen}
        cartItems={cartView}
        branches={branches}
        userName={user?.nama}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={(orderId) => {
          setCartItems([]);
          showToast(`Pesanan #${orderId} berhasil diproses!`);
        }}
      />

      <ProfileModal
        key={profileOpen ? 'buka' : 'tutup'}
        show={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSaved={(u) => {
          setUser(u);
          showToast('Profil berhasil diperbarui.');
        }}
        onLogout={handleLogout}
      />

      <AuthModal
        key={authKey}
        show={authModalOpen}
        initialTab={authTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          showToast(`Selamat datang, ${loggedInUser.nama}!`);
        }}
      />

      {/* Papeda Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x mb-4 p-3 bg-dark text-white rounded shadow-lg d-flex align-items-center gap-2"
          style={{ zIndex: 99999 }}
        >
          <i className="fa-solid fa-circle-check text-success"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}