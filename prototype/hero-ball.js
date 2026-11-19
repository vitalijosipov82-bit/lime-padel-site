// Ball and circular lettering move independently inside a stable booking target.
(() => {
  const badge = document.querySelector('.hero-badge');
  const root = badge?.closest('.hero-bottom');
  if (!badge || !root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, focused = false, hovered = false, pressed = false;

  const sync = () => {
    root.classList.toggle('is-ball-running', visible && !reduced.matches && !document.hidden && !focused && !hovered && !pressed);
  };
  root.classList.add('is-ball-floating');
  badge.addEventListener('focusin', () => { focused = true; sync(); });
  badge.addEventListener('focusout', () => { focused = false; sync(); });
  badge.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; sync(); } });
  badge.addEventListener('pointerleave', () => { hovered = false; pressed = false; sync(); });
  badge.addEventListener('pointerdown', () => { pressed = true; sync(); });
  const release = () => { pressed = false; sync(); };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, {threshold: 0}).observe(badge);
  } else {
    const measure = () => {
      const r = badge.getBoundingClientRect();
      visible = r.bottom > 0 && r.top < innerHeight;
      sync();
    };
    addEventListener('scroll', measure, {passive:true});
    addEventListener('resize', measure, {passive:true});
    measure();
  }
  sync();
})();
