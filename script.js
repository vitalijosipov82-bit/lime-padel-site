(() => {
  'use strict';
  const hero = document.getElementById('hero');
  const gsap = window.gsap;
  if (!hero || !gsap) return;
  const title = hero.querySelector('#hero-title');
  const mask = hero.querySelector('[data-hero-mask]');
  const book = hero.querySelector('[data-hero-book]');
  const arrow = book?.querySelector('[data-hero-arrow]');
  if (!title || !mask || !book || !arrow) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precise = window.matchMedia('(hover: hover) and (pointer: fine)');
  const navigation = performance.getEntriesByType('navigation')[0];
  let intro = null;
  if (!reduced.matches && !location.hash && scrollY === 0 && navigation?.type !== 'back_forward') {
    intro = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' }, onComplete() { intro = null; } });
    intro.fromTo(mask, { clipPath: 'inset(0% 8% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.64, clearProps: 'clipPath' }, 0).fromTo(title, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.50, clearProps: 'transform,opacity' }, 0.10);
  }
  const tokens = getComputedStyle(hero);
  const colors = { rest: tokens.getPropertyValue('--accent').trim(), hover: tokens.getPropertyValue('--accent-hover').trim(), pressed: tokens.getPropertyValue('--accent-pressed').trim() };
  let hovered = false;
  let pressed = false;
  function drawBook(duration) {
    const state = pressed ? 'pressed' : hovered ? 'hover' : 'rest';
    gsap.to(book, { backgroundColor: colors[state], duration, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(arrow, { x: hovered ? 3 : 0, duration, ease: 'power2.out', overwrite: 'auto' });
  }
  function clearBookMotion() { hovered = false; pressed = false; gsap.killTweensOf([book, arrow]); book.style.removeProperty('background-color'); gsap.set(arrow, { clearProps: 'transform' }); }
  book.addEventListener('pointerenter', (event) => { if (reduced.matches || !precise.matches || event.pointerType !== 'mouse') return; hovered = true; drawBook(pressed ? 0 : 0.16); });
  book.addEventListener('pointerleave', () => { if (!hovered || reduced.matches) return; hovered = false; drawBook(pressed ? 0 : 0.18); });
  book.addEventListener('pointerdown', (event) => { if (reduced.matches || event.button !== 0) return; pressed = true; drawBook(0); });
  function releaseBook() { if (!pressed) return; pressed = false; if (reduced.matches) clearBookMotion(); else drawBook(0.12); }
  window.addEventListener('pointerup', releaseBook);
  window.addEventListener('pointercancel', releaseBook);
  window.addEventListener('blur', clearBookMotion);
  precise.addEventListener('change', clearBookMotion);
  reduced.addEventListener('change', () => { if (reduced.matches) intro?.progress(1); clearBookMotion(); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) { intro?.progress(1); clearBookMotion(); } });
})();
