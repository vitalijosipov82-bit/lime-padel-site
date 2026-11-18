// Второй экран (#start): появление при прокрутке.
// Без JS и при prefers-reduced-motion ничего не прячется — блок виден сразу.
// Скрипт сам ставит класс скрытия, поэтому сбой скрипта не оставит пустой экран.
// Страховка: кроме IntersectionObserver элементы проверяются при прокрутке и при загрузке —
// если наблюдатель не сработает (фоновая вкладка, встроенный браузер), блок всё равно появится.
(() => {
  const section = document.getElementById('start');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = [
    section.querySelector('.section-heading h2'),
    section.querySelector('.section-lead'),
    ...section.querySelectorAll('.path'),
  ].filter(Boolean);

  const STEP = 90; // шаг каскада, мс (design-system: 60–100)
  const pending = new Set(targets);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  targets.forEach((el) => el.setAttribute('data-reveal', ''));
  section.classList.add('reveal-on');

  function settle(el) {
    el.addEventListener('transitionend', function done(event) {
      if (event.propertyName !== 'translate') return;
      el.classList.add('is-settled'); // после появления наведение отвечает без задержки
      el.removeEventListener('transitionend', done);
    });
  }

  // Элементы, вошедшие в экран одновременно, появляются каскадом по порядку чтения.
  function reveal(list) {
    list
      .filter((el) => pending.has(el))
      .sort((a, b) => targets.indexOf(a) - targets.indexOf(b))
      .forEach((el, index) => {
        pending.delete(el);
        el.style.setProperty('--reveal-delay', `${index * STEP}ms`);
        el.classList.add('is-in');
        settle(el);
        if (observer) observer.unobserve(el);
      });
    if (!pending.size) window.removeEventListener('scroll', onScroll);
  }

  function inView(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.88 && r.bottom > 0;
  }

  function onScroll() {
    reveal([...pending].filter(inView));
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(
      (entries) => reveal(entries.filter((e) => e.isIntersecting).map((e) => e.target)),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )
    : null;

  if (observer) targets.forEach((el) => observer.observe(el));

  // Якорь измеряется до нативной прокрутки: цель уже должна стоять на месте.
  function showAnchorTarget(hash) {
    if (!hash || hash === '#') return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const card = target?.closest('.path');
    if (!card || !section.contains(card)) return;
    pending.delete(card);
    card.style.transition = 'none';
    card.style.setProperty('--reveal-delay', '0ms');
    card.classList.add('is-in', 'is-settled');
    // Не оставлять переход translate в момент расчёта позиции браузером.
    card.style.translate = 'none';
    card.getBoundingClientRect(); // Зафиксировать конечную геометрию до нативного перехода.
    requestAnimationFrame(() => card.style.removeProperty('transition'));
    if (observer) observer.unobserve(card);
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) showAnchorTarget(url.hash);
  });
  window.addEventListener('hashchange', () => showAnchorTarget(location.hash));
  showAnchorTarget(location.hash);

  reduceMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    for (const element of pending) {
      element.classList.add('is-in', 'is-settled');
      element.style.translate = 'none';
    }
    pending.clear();
    observer?.disconnect();
    window.removeEventListener('scroll', onScroll);
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  // Клавиатура: фокус не должен попасть на ещё невидимую карточку — показываем всё сразу.
  section.addEventListener('focusin', (event) => {
    const card = event.target.closest('.path');
    if (card) showAnchorTarget(`#${card.id}`);
    reveal([...pending]);
  });
  onScroll();
})();
