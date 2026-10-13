'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface NavbarProps {
  user?: { nama: string; email: string } | null;
  onOpenAuth?: (tab: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

export default function Navbar({
  user = null,
  onOpenAuth,
  onLogout,
  onOpenProfile,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky-top">
      <div className="header-container d-flex justify-content-between align-items-center position-relative">
        {/* Tombol daftar dan Logo */}
        <div className="LOGIN">
          <Link href="#home" className="logo">
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
            <div id="auth-guest" className="d-flex align-items-center">
              <div
                className="Sign-in"
                role="button"
                tabIndex={0}
                onClick={() => onOpenAuth?.('login')}
              >
                Sign in
              </div>
              <div
                className="regist"
                role="button"
                tabIndex={0}
                onClick={() => onOpenAuth?.('register')}
              >
                Registration
              </div>
            </div>
          ) : (
            <div id="auth-user" className="dropdown position-relative">
              <button
                type="button"
                className="user-btn dropdown-toggle d-flex align-items-center gap-2 border-0 bg-transparent"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
              >
                <span className="user-avatar" id="user-initial">
                  {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
                </span>
                <span id="user-name">{user.nama}</span>
              </button>

              {dropdownOpen && (
                <ul
                  className="dropdown-menu show position-absolute"
                  style={{ top: '100%', left: 0 }}
                >
                  <li>
                    <button
                      className="dropdown-item"
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenProfile?.();
                      }}
                    >
                      <i className="fa-solid fa-user me-2"></i> Profile
                    </button>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      href="#my-reservation"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="fa-solid fa-calendar-check me-2"></i> My Reservation
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item logout text-danger"
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout?.();
                      }}
                    >
                      <i className="fa-solid fa-right-from-bracket me-2"></i> Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Hamburger Menu (Mobile) */}
        <div
          className="hamburger"
          id="hamburger-menu"
          role="button"
          tabIndex={0}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navigasi Link */}
        <nav
          id="main-nav"
          style={{ display: menuOpen ? 'block' : undefined }}
        >
          <ul>
            <li>
              <a href="#home" className="nav-link" onClick={closeMenu}>
                Home
              </a>
            </li>
            <li>
              <a href="#about" className="nav-link" onClick={closeMenu}>
                About
              </a>
            </li>
            <li>
              <a href="#favorite-menus" className="nav-link" onClick={closeMenu}>
                Favorite
              </a>
            </li>
            <li>
              <a href="#menu" className="nav-link" onClick={closeMenu}>
                Menu
              </a>
            </li>
            <li>
              <a href="#faq" className="nav-link" onClick={closeMenu}>
                FAQ
              </a>
            </li>
            <li>
              <a href="#location" className="nav-link" onClick={closeMenu}>
                Location
              </a>
            </li>
            <li>
              <a href="#reservation" className="nav-link" onClick={closeMenu}>
                Reservation
              </a>
            </li>
            {user && (
              <li id="nav-myres">
                <a href="#my-reservation" className="nav-link" onClick={closeMenu}>
                  My Reservation
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
