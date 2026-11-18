// One finite entrance per offer. Visible default, no scroll interception or external actions.
(() => {
  const root = document.querySelector('#loyalty-gift');
  if (!root) return;
  const offers = [...root.querySelectorAll('.benefits__offer')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width:800px)');
  const seen = new Set();
  const running = new Set();
  const tokens = new Map();
  let observer;
  let pressed;
  let held = false;

  function settle() {
    tokens.clear();
    running.forEach(animation => animation.cancel());
    running.clear();
    offers.forEach(offer => offer.classList.remove('is-scene-entering'));
  }
  function showAll() {
    held = false;
    offers.forEach(offer => seen.add(offer));
    observer?.disconnect();
    settle();
  }
  function animate(element, frames, duration, delay = 0) {
    if (!element.animate) return;
    const animation = element.animate(frames, {duration, delay, easing: 'cubic-bezier(.22,.75,.18,1)', fill: 'backwards'});
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  }
  function wrapHeading(heading) {
    const lines = heading.innerHTML.split(/<br\s*\/?\s*>/i);
    heading.replaceChildren();
    lines.forEach((line, index) => {
      const mask = document.createElement('span');
      mask.className = 'scene-line';
      const text = document.createElement('span');
      text.innerHTML = line;
      mask.append(text);
      if (index) heading.append(' ');
      heading.append(mask);
    });
  }
  {
    root.querySelectorAll('h3').forEach(wrapHeading);
    root.querySelectorAll('dt,.benefits__amount').forEach(number => {
      const inner = document.createElement('span');
      inner.className = 'scene-number';
      inner.append(...number.childNodes);
      number.classList.add('scene-number-mask');
      number.append(inner);
    });
  }
  // Button feedback belongs to the shared magnetic system; labels stay intact.

  function enter(offer) {
    if (reduced.matches || document.hidden || seen.has(offer)) return;
    seen.add(offer);
    observer?.unobserve(offer);
    const token = {};
    tokens.set(offer, token);
    offer.classList.add('is-scene-entering');
    const index = offers.indexOf(offer);
    const step = narrow.matches ? 0 : index * 90;
    {
      const start = narrow.matches ? 'inset(0 0 100% 0 round 22px)' : index ? 'inset(0 100% 0 0 round 22px)' : 'inset(0 0 0 100% round 22px)';
      animate(offer, [{clipPath: start}, {clipPath: 'inset(0 0 0 0 round 22px)'}], 720, step);
    }
    {
      offer.querySelectorAll('.scene-line > span').forEach((line, row) => {
        animate(line, [{transform: 'translateY(145%)'}, {transform: 'translateY(0)'}], 740, step + 90 + row * 85);
      });
      offer.querySelectorAll('.scene-number').forEach((number, row) => {
        animate(number, [{transform: 'translateY(110%)'}, {transform: 'translateY(0)'}], 620, step + 220 + row * 70);
      });
    }
    const own = [...running].filter(animation => animation.effect?.target === offer || offer.contains(animation.effect?.target));
    Promise.all(own.map(animation => animation.finished.catch(() => {}))).then(() => {
      if (tokens.get(offer) !== token) return;
      tokens.delete(offer);
      offer.classList.remove('is-scene-entering');
    });
    if (seen.size === offers.length) observer?.disconnect();
  }
  function observe() {
    observer?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => entries.filter(entry => entry.isIntersecting).forEach(entry => enter(entry.target)), {rootMargin: '0px 0px -8% 0px', threshold: .12});
    offers.filter(offer => !seen.has(offer)).forEach(offer => observer.observe(offer));
  }
  function release() {
    if (!held && !pressed) return;
    held = false;
    pressed?.classList.remove('is-pressed');
    pressed = null;
    // Click is delivered before restoring a moving surface, so its hit target stays put.
    requestAnimationFrame(settle);
  }
  root.addEventListener('focusin', () => { if (!held) showAll(); });
  root.addEventListener('pointerdown', event => {
    const link = event.target.closest('a');
    if (!link || !root.contains(link)) return;
    held = true;
    running.forEach(animation => animation.pause());
    if (event.pointerType === 'touch' && link.matches('.benefits__button')) {
      pressed = link;
      pressed.classList.add('is-pressed');
    }
  });
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  // Finish only an entrance already running; offscreen offers still get their turn.
  window.addEventListener('blur', () => { release(); settle(); });
  reduced.addEventListener('change', () => {
    showAll();
    pressed?.classList.remove('is-pressed');
    pressed = null;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { settle(); release(); }
    else observe();
  });

  if (document.fonts?.ready) document.fonts.ready.then(observe);
  else observe();
})();
