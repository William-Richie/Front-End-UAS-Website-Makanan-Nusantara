'use client';

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
  const linkIg = data?.link_ig || '#';
  const linkTiktok = data?.link_tiktok || '#';
  const linkWa = data?.link_wa || '#';
  const linkEmail = data?.email ? `mailto:${data.email}` : '#';
  const linkLinkedin = data?.link_linkedin || '#';

  return (
    <footer className="mt-auto custom-footer">
      <div className="container">
        <div className="text-center mb-4">
          <h6 className="fw-bold mb-4 mt-4 text-warning">{judul}</h6>

          <div className="d-flex justify-content-center gap-3">
            <a
              href={linkIg}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-social-btn text-decoration-none"
              title="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
            <a
              href={linkTiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-social-btn text-decoration-none"
              title="TikTok"
            >
              <i className="fab fa-tiktok"></i>
            </a>
            <a
              href={linkWa}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-social-btn text-decoration-none"
              title="WhatsApp"
            >
              <i className="fab fa-whatsapp"></i>
            </a>
            <a
              href={linkEmail}
              className="custom-social-btn text-decoration-none"
              title="Email"
            >
              <i className="fas fa-envelope"></i>
            </a>
            <a
              href={linkLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-social-btn text-decoration-none"
              title="LinkedIn"
            >
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        <hr className="border-light opacity-25 my-4" />

        <div className="text-center small text-light text-opacity-75">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
