'use client';

import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { Dropdown, Nav } from 'react-bootstrap';

interface NavbarProps {
  user?: { nama: string; email: string } | null;
  onOpenAuth?: (tab: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

const SECTION_IDS = ['home', 'about', 'favorite-menus', 'menu', 'faq', 'location', 'reservation', 'my-reservation'];

export default function Navbar({
  user = null,
  onOpenAuth,
  onLogout,
  onOpenProfile,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeId, setActiveId] = useState('home');
  
  useEffect(() => {
    let raf = 0;
  
    const hitung = () => {
      raf = 0;
      const garis = 90 + window.innerHeight * 0.3;
      const diDasar = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let aktif = 'home';
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el || el.offsetHeight === 0) continue;
        if (diDasar || el.getBoundingClientRect().top <= garis) aktif = id;
      }
      setActiveId(aktif);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(hitung);
    };
    raf = requestAnimationFrame(hitung);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [user]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky-top">
      <div className={`${styles.headerContainer} d-flex justify-content-between align-items-center position-relative`}>
        {/* Logo dan autentikasi */}
        <div className={styles.login}>
          <Link href="#home" className={styles.logo}>
            <Image
              src="/img/Web-Icon/PAPEDA.png"
              alt="Logo Papeda"
              width={44}
              height={44}
              style={{ objectFit: 'cover' }}
              priority
            />
          </Link>

          {!user ? (
            <div id="auth-guest" className={styles.authGuest}>
              <button
                type="button"
                className={styles.signIn}
                onClick={() => onOpenAuth?.('login')}
              >
                Sign in
              </button>

              <button
                type="button"
                className={styles.regist}
                onClick={() => onOpenAuth?.('register')}
              >
                Registration
              </button>
            </div>
          ) : (
            <Dropdown
              id="auth-user"
              className="position-relative"
              show={dropdownOpen}
              onToggle={(nextShow) => setDropdownOpen(nextShow)}
              autoClose
            >
              <Dropdown.Toggle
                id="user-dropdown"
                className={styles.userBtn}
                variant="light"
                aria-label="Buka menu pengguna"
              >
                <span className={styles.userAvatar} id="user-initial">
                  {user.nama
                    ? user.nama.charAt(0).toUpperCase()
                    : 'U'}
                </span>

                <span id="user-name" className={styles.userName}>{user.nama}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className={styles.userMenu}>
                <Dropdown.Item
                  as="button"
                  type="button"
                  className={styles.userItem}
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenProfile?.();
                  }}
                >
                  <i className="fa-solid fa-user me-2" />
                  Profile
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  href="#my-reservation"
                  className={styles.userItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="fa-solid fa-calendar-check me-2" />
                  My Reservation
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item
                  as="button"
                  type="button"
                  className={`${styles.userItem} ${styles.logoutItem}`}
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout?.();
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {/* Hamburger menu */}
        <button
          type="button"
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          id="hamburger-menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="main-nav"
          className={styles.mainNav}
          style={{ display: menuOpen ? 'block' : undefined }}
        >
          <Nav as="ul">
            <Nav.Item as="li">
              <Nav.Link href="#home" active={activeId === 'home'} onClick={closeMenu}>
                Home
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link href="#about" active={activeId === 'about'} onClick={closeMenu}>
                About
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link href="#favorite-menus" active={activeId === 'favorite-menus'} onClick={closeMenu}>
                Favorite
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link href="#menu" active={activeId === 'menu'} onClick={closeMenu}>
                Menu
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link href="#faq" active={activeId === 'faq'} onClick={closeMenu}>
                FAQ
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link href="#location" active={activeId === 'location'} onClick={closeMenu}>
                Location
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link href="#reservation" active={activeId === 'reservation'} onClick={closeMenu}>
                Reservation
              </Nav.Link>
            </Nav.Item>

            {user && (
              <Nav.Item as="li" id="nav-myres">
                <Nav.Link
                  href="#my-reservation"
                  active={activeId === 'my-reservation'}
                  onClick={closeMenu}
                >
                  My Reservation
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>
        </nav>
      </div>
    </header>
  );
}