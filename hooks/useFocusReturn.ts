import { useCallback, useLayoutEffect, useRef } from 'react';

// Secara bawaan react-bootstrap mengembalikan fokus ke tombol pemicu dengan focus() biasa saat modal
// ditutup. Navbar website sticky dan <html> memakai scroll-padding-top, jadi fokus ke tombol di navbar
// membuat halaman ikut tergulung sedikit ke atas setiap modal ditutup. Hook ini mengembalikan fokus
// ke tombol yang sama dengan preventScroll.
//
// Pakai bersama <Modal restoreFocus={false} onExited={...}>:
//   const handleExited = useFocusReturn(show);
export function useFocusReturn(show: boolean) {
  const opener = useRef<HTMLElement | null>(null);

  // layout effect berjalan sebelum modal memindahkan fokus ke dalam dirinya
  useLayoutEffect(() => {
    if (show && !opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }
  }, [show]);

  // dipasang ke prop onExited milik Modal (dipanggil setelah animasi tutup selesai)
  return useCallback(() => {
    const el = opener.current;
    opener.current = null;
    if (el && el.isConnected) el.focus({ preventScroll: true });
  }, []);
}
