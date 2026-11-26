// Раскрытие первого кадра вместе с фактами, без инерции и перехвата прокрутки.
(() => {
  const body = document.body, club = document.querySelector('#club');
  if (!body.classList.contains('page-flow-selected') || !club) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fact = club.querySelector('.scene__fact');
  let queued = false, lastProgress = null, factEdge = 0;
  const update = () => {
    queued = false;
    if (document.hidden) return;
    const enabled = !reduce.matches && club.classList.contains('is-scene');
    body.classList.toggle('is-window-motion', enabled);
    if (!enabled) { lastProgress = null; return; }
    const top = club.getBoundingClientRect().top;
    // Fractional card heights can leave the section <1px from the native scroll target.
    const height = club.querySelector('.scene__pin').clientHeight;
    const p = top <= 1 ? 0 : Math.min(1,top / (height * .85));
    // At entry facts hug the photo corners; near the viewport top they clear the header.
    club.style.setProperty('--club-fact-top', `${Math.max(24, 92 - Math.max(0, top))}px`);
    if (p === lastProgress) return;
    lastProgress = p;
    const narrow = innerWidth <= 800;
    const inset = narrow ? 0 : document.documentElement.clientWidth * .18 * p;
    club.style.setProperty('--window-x',`${inset}px`);
    club.style.setProperty('--window-y',`${(narrow ? Math.min(16, height * .025) : innerHeight * .08) * p}px`);
    club.style.setProperty('--window-radius',`${narrow ? 0 : 16 * p}px`);
    club.style.setProperty('--fact-shift-x',`${narrow ? 0 : Math.max(0,inset + 24 - factEdge)}px`);
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  const measure = () => {
    factEdge = parseFloat(getComputedStyle(fact).left) || 0;
    lastProgress = null;
    schedule();
  };
  addEventListener('scroll',schedule,{ passive: true });
  addEventListener('resize',measure,{ passive: true });
  document.addEventListener('visibilitychange',measure);
  reduce.addEventListener('change',measure);
  club.addEventListener('focusin',event => {
    if (!club.classList.contains('is-scene') || !event.target.closest('.scene__routes')) return;
    const link = event.target.getBoundingClientRect();
    if (link.top >= 8 && link.bottom <= innerHeight - 8) return;
    const r = club.getBoundingClientRect(),start = r.top + scrollY,end = r.bottom + scrollY - innerHeight;
    scrollTo({ top: Math.max(start,Math.min(scrollY,end)),behavior: 'instant' });
    schedule();
  });
  document.fonts.ready.then(measure);
  addEventListener('load',measure,{ once: true });
  measure();
})();
