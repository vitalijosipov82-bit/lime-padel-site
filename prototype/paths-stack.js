// Закрепление выполняет CSS. Высокая карточка сначала прокручивается до кнопки.
(() => {
  const section = document.querySelector('#start');
  const cards = [...(section?.querySelectorAll('.path-stage > .path') ?? [])];
  if (cards.length < 2) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 800px)');
  // A stable viewport keeps Safari toolbar changes from retiming the stack.
  const measure = document.createElement('span');
  measure.setAttribute('aria-hidden', 'true');
  measure.style.cssText = 'position:absolute;width:0;height:100svh;visibility:hidden;pointer-events:none';
  section.prepend(measure);
  let queued = false;
  let interacted = false;
  let configuration = '';

  function configure() {
    queued = false;
    const top = parseFloat(getComputedStyle(section).getPropertyValue('--stack-top'));
    const height = narrow.matches ? measure.getBoundingClientRect().height : (window.visualViewport?.height ?? innerHeight);
    const available = height - top - 16;
    const heights = cards.map(card => card.offsetHeight);
    const key = [narrow.matches, reduce.matches, section.clientWidth, height, ...heights].join('|');
    if (key === configuration) return;
    configuration = key;
    const fits = heights.every(value => value <= available);
    // On a phone, pin the card only after its bottom has reached the viewport.
    // A negative sticky top lets the whole tall card pass naturally before stacking.
    cards.forEach((card, index) => {
      const pin = narrow.matches ? Math.min(top, height - heights[index] - 16) : top;
      card.parentElement.style.setProperty('--card-stack-top', `${pin}px`);
      card.parentElement.style.setProperty('--card-stack-fill', `${narrow.matches ? Math.max(0, height - pin - heights[index]) : 0}px`);
    });
    section.classList.toggle('is-stack', !reduce.matches && (fits || narrow.matches));
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
