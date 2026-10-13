'use client';

import { useEffect, useCallback } from 'react';

export function useReveal(deps: unknown[] = []) {
  const triggerReveal = useCallback(() => {
    if (typeof window === 'undefined') return;

    const elements = document.querySelectorAll<HTMLElement>('.reveal:not(.show)');
    if (elements.length === 0) return;

    const windowHeight = window.innerHeight;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < windowHeight * 0.95 && rect.bottom > 0) {
        el.classList.add('show');
      }
    });

    const remaining = document.querySelectorAll<HTMLElement>('.reveal:not(.show)');
    if (remaining.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    );

    remaining.forEach((el) => observer.observe(el));
  }, []);

  useEffect(() => {
    triggerReveal();
    const t1 = setTimeout(triggerReveal, 150);
    const t2 = setTimeout(triggerReveal, 500);

    const handleCustomReveal = () => triggerReveal();
    window.addEventListener('papeda:reveal', handleCustomReveal);

    const mutationObserver = new MutationObserver(() => {
      triggerReveal();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('papeda:reveal', handleCustomReveal);
      mutationObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return triggerReveal;
}
