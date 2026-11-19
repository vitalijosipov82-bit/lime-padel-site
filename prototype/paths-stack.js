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
  let geometry = '';
  let contentDirty = true;

  function configure() {
    queued = false;
    const top = parseFloat(getComputedStyle(section).getPropertyValue('--stack-top'));
    const height = narrow.matches ? measure.getBoundingClientRect().height : (window.visualViewport?.height ?? innerHeight);
    const signature = [narrow.matches, reduce.matches, section.clientWidth, height].join('|');
    // A toolbar-only resize must not briefly remove equal heights above the reader.
    if (!contentDirty && signature === geometry) return;
    geometry = signature;
    contentDirty = false;
    const available = height - top - 16;
    // Measure natural content without the previous equal-height constraint.
    const previousHeight = section.style.getPropertyValue('--paths-stack-height');
    section.style.removeProperty('--paths-stack-height');
    const heights = cards.map(card => card.getBoundingClientRect().height);
    if (previousHeight) section.style.setProperty('--paths-stack-height', previousHeight);
    const key = [narrow.matches, reduce.matches, section.clientWidth, height, ...heights].join('|');
    if (key === configuration) return;
    configuration = key;
    const fits = heights.every(value => value <= available);
    const commonHeight = Math.ceil(Math.max(...heights));
    if (narrow.matches) section.style.setProperty('--paths-stack-height', `${commonHeight}px`);
    else section.style.removeProperty('--paths-stack-height');
    const headerHeight = document.querySelector('.site-header')?.offsetHeight ?? top;
    const commonPin = Math.min(top, headerHeight, height - commonHeight - 16);
    // Equal mobile heights and a common top align both edges during complete coverage.
    // A negative sticky top still lets the whole tall card pass before it pins.
    cards.forEach((card, index) => {
      const pin = narrow.matches ? commonPin : top;
      card.parentElement.style.setProperty('--card-stack-top', `${pin}px`);
      card.parentElement.style.setProperty('--card-stack-fill', `${narrow.matches ? Math.max(0, height - pin - commonHeight) : 0}px`);
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
    const observer = new ResizeObserver(() => { contentDirty = true; schedule(); });
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
    contentDirty = true;
    configure();
    if (interacted || !location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target && section.contains(target)) target.scrollIntoView({ behavior: 'instant' });
  });
})();
