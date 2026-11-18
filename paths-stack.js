// Закрепление выполняет CSS. JS лишь проверяет, что карточки помещаются целиком.
(() => {
  const section = document.querySelector('#start');
  const cards = [...(section?.querySelectorAll('.path-stage > .path') ?? [])];
  if (cards.length < 2) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let queued = false;
  let interacted = false;

  function configure() {
    queued = false;
    const top = parseFloat(getComputedStyle(section).getPropertyValue('--stack-top'));
    const height = window.visualViewport?.height ?? innerHeight;
    const available = height - top - 16;
    const fits = cards.every(card => card.offsetHeight <= available);
    section.classList.toggle('is-stack', !reduce.matches && fits);
  }

  function schedule() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(configure);
    }
  }

  addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  reduce.addEventListener('change', schedule);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    cards.forEach(card => observer.observe(card));
  }
  section.addEventListener('focusin', event => {
    if (!event.target.closest('.path') || !event.target.matches(':focus-visible')) return;
    requestAnimationFrame(() => {
      if (document.activeElement === event.target) {
        const { top, bottom } = event.target.getBoundingClientRect();
        if (top < 88 || bottom > innerHeight) {
          event.target.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      }
    });
  });
  for (const event of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
    addEventListener(event, () => { interacted = true; }, { once: true, passive: true });
  }
  configure();
  document.fonts.ready.then(() => {
    configure();
    if (interacted || !location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target && section.contains(target)) target.scrollIntoView({ behavior: 'instant' });
  });
})();
