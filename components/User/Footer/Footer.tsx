'use client';

import { Container } from 'react-bootstrap';
import styles from './Footer.module.css';
import RichText from '@/components/Common/RichText/RichText';

interface FooterProps {
  data?: {
    judul?: string | null;
    copyright?: string | null;
    link_ig?: string | null;
    link_tiktok?: string | null;
    link_wa?: string | null;
    link_linkedin?: string | null;
    email?: string | null;
  } | null;
}

export default function Footer({ data }: FooterProps) {
  const judul = data?.judul || 'Ikuti Kami';
  const copyright = data?.copyright || '© 2026 Papeda Restaurant. All Rights Reserved.';
  const sosmed = [
    { href: data?.link_ig?.trim(), title: 'Instagram', icon: 'fab fa-instagram', luar: true },
    { href: data?.link_tiktok?.trim(), title: 'TikTok', icon: 'fab fa-tiktok', luar: true },
    { href: data?.link_wa?.trim(), title: 'WhatsApp', icon: 'fab fa-whatsapp', luar: true },
    { href: data?.email?.trim() ? `mailto:${data.email.trim()}` : '', title: 'Email', icon: 'fas fa-envelope', luar: false },
    { href: data?.link_linkedin?.trim(), title: 'LinkedIn', icon: 'fab fa-linkedin-in', luar: true },
  ];

  return (
    <footer className={`mt-auto ${styles.footer}`}>
      <Container className={styles.footerInner}>
        <div className="text-center mb-4">
          <h6 className={`${styles.footerTitle} mb-4 mt-4 text-warning`}><RichText teks={judul} /></h6>

          <div className="d-flex justify-content-center gap-3">
            {sosmed.map((s) =>
              s.href ? (
                <a
                  key={s.title}
                  href={s.href}
                  {...(s.luar ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={styles.socialBtn}
                  title={s.title}
                >
                  <i className={s.icon}></i>
                </a>
              ) : (
                <span key={s.title} className={styles.socialBtn} title={s.title} aria-disabled="true">
                  <i className={s.icon}></i>
                </span>
              )
            )}
          </div>
        </div>

        <hr className="border-light opacity-25 my-4" />

        <div className="text-center small text-light text-opacity-75">
          <RichText teks={copyright} />
        </div>
      </Container>
    </footer>
  );
}