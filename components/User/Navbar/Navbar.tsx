'use client';

import { useState } from 'react';
import styles from './Navbar.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dropdown, Nav } from 'react-bootstrap';

interface NavbarProps {
  user?: {
    nama: string;
    email?: string;
    role?: string;
    gerai?: string;
    username?: string;
  } | null;
  onOpenAuth?: (tab: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  /** jumlah pesan Mail yang belum dibaca */
  mailCount?: number;
  onOpenMail?: () => void;
}

export default function Navbar({
  user = null,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  mailCount = 0,
  onOpenMail,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
  href === '/reservation' || href === '/my-reservation'
    ? pathname === href || pathname.startsWith(href + '/')
    : pathname === '/' && href.startsWith('/#');

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky-top">
      <div className={`${styles.headerContainer} d-flex justify-content-between align-items-center position-relative`}>
        <div className={styles.login}>
          <Link href="/" className={styles.logo}>
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
                {user.role === 'admin' && (
                  <Dropdown.Item
                    as={Link}
                    href="/admin"
                    className={`${styles.userItem} text-warning fw-bold`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="fa-solid fa-gauge-high me-2 text-warning" />
                    Dashboard Admin
                  </Dropdown.Item>
                )}

                {user.role === 'cashier' && (
                  <Dropdown.Item
                    as={Link}
                    href="/cashier"
                    className={`${styles.userItem} text-info fw-bold`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="fa-solid fa-cash-register me-2 text-info" />
                    Panel Kasir {user.gerai ? `(${user.gerai})` : ''}
                  </Dropdown.Item>
                )}

                {(!user.role || user.role === 'user') && (
                  <>
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
                      href="/my-reservation"
                      className={styles.userItem}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="fa-solid fa-calendar-check me-2" />
                      My Reservation
                    </Dropdown.Item>
                  </>
                )}

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

          {user && (
            <button
              type="button"
              className={styles.mailBtn}
              onClick={() => onOpenMail?.()}
              aria-label={mailCount > 0 ? `Buka Mail, ${mailCount} pesan baru` : 'Buka Mail'}
            >
              <i className="fa-solid fa-envelope" />
              {mailCount > 0 && <span className={styles.mailBadge}>{mailCount > 9 ? '9+' : mailCount}</span>}
            </button>
          )}
        </div>

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
              <Nav.Link as={Link} href="/#home" onClick={closeMenu}>
                Home
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link as={Link} href="/#about" onClick={closeMenu}>
                About
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link as={Link} href="/menu" onClick={closeMenu}>
                Menu
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link as={Link} href="/#faq" onClick={closeMenu}>
                FAQ
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link as={Link} href="/#location" onClick={closeMenu}>
                Location
              </Nav.Link>
            </Nav.Item>

            <Nav.Item as="li">
              <Nav.Link
                as={Link}
                href="/reservation"
                active={isActive('/reservation')}
                onClick={closeMenu}
              >
                Reservation
              </Nav.Link>
            </Nav.Item>

            {user && (
              <Nav.Item as="li" id="nav-myres">
                <Nav.Link
                  as={Link}
                  href="/my-reservation"
                  active={isActive('/my-reservation')}
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
