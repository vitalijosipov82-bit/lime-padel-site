(() => {
  'use strict';

  const media = document.querySelector('#hero-media');
  const toggle = document.querySelector('[data-media-toggle]');
  if (!media || !toggle) return;

  const shots = ['on-court-1440.webp', 'club.webp', 'ball.webp'];
  const interval = 5000;
  const duration = 1600;
  const slope = Math.tan(11 * Math.PI / 180);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pauseIcon = toggle.querySelector('[data-pause-icon]');
  const playIcon = toggle.querySelector('[data-play-icon]');
  const poster = media.querySelector('.hero-shot');
  const cache = new Map();

  let current = poster;
  let activeIndex = 0;
  let paused = false;
  let changing = false;
  let revision = 0;
  let timer;
  let finishCut;

  function canPlay() {
    return !paused && !document.hidden && !reducedMotion.matches;
  }

  function preload(index) {
    if (cache.has(index)) return cache.get(index);

    const image = new Image();
    image.className = 'hero-shot';
    image.dataset.frame = String(index);
    image.alt = '';
    image.decoding = 'async';
    image.src = './' + shots[index];

    const request = image.decode().then(() => image, () => {
      cache.delete(index);
      return null;
    });
    cache.set(index, request);
    return request;
  }

  function schedule(delay = interval) {
    clearTimeout(timer);
    if (!canPlay() || changing) return;

    preload((activeIndex + 1) % shots.length);
    timer = setTimeout(advance, delay);
  }

  function reveal(incoming) {
    return new Promise(resolve => {
      const outgoing = current;
      const playhead = { progress: 0 };
      let width = media.clientWidth;
      let height = media.clientHeight;
      let timeline;
      let animationFrame;
      let observer;

      function paint() {
        // The edge keeps the same 11° tilt from vertical at any aspect ratio.
        const run = height * slope;
        const top = playhead.progress * (width + run);
        const bottom = top - run;
        incoming.style.clipPath =
          'polygon(0 0, ' + top + 'px 0, ' + bottom + 'px ' + height + 'px, 0 ' + height + 'px)';
      }

      function finish() {
        finishCut = undefined;
        observer?.disconnect();
        timeline?.kill();
        cancelAnimationFrame(animationFrame);
        outgoing.remove();
        incoming.style.removeProperty('clip-path');
        resolve();
      }

      finishCut = finish;
      paint();
      media.append(incoming);

      if ('ResizeObserver' in window) {
        observer = new ResizeObserver(() => {
          width = media.clientWidth;
          height = media.clientHeight;
          paint();
        });
        observer.observe(media);
      }

      if (window.gsap?.timeline) {
        timeline = window.gsap.timeline({ onComplete: finish });
        timeline.to(playhead, { progress: 1, duration: duration / 1000, ease: 'power4.inOut', onUpdate: paint });
        return;
      }

      // Keep the same duration, easing and geometry when the CDN is unavailable.
      const started = performance.now();
      function tick(now) {
        const elapsed = Math.max(0, Math.min(1, (now - started) / duration));
        playhead.progress = elapsed < .5 ? 16 * elapsed ** 5 : 1 - (-2 * elapsed + 2) ** 5 / 2;
        if (elapsed === 1) finish();
        else {
          paint();
          animationFrame = requestAnimationFrame(tick);
        }
      }
      animationFrame = requestAnimationFrame(tick);
    });
  }

  async function advance() {
    if (changing || !canPlay()) return;
    changing = true;
    const request = revision;
    let cutStarted;

    try {
      for (let offset = 1; offset < shots.length; offset++) {
        const next = (activeIndex + offset) % shots.length;
        const incoming = await preload(next);
        if (request !== revision || !canPlay()) return;
        if (!incoming) continue;

        cutStarted = performance.now();
        await reveal(incoming);
        current = incoming;
        activeIndex = next;
        return;
      }
    } finally {
      changing = false;
      const sinceCut = request === revision && cutStarted !== undefined ? performance.now() - cutStarted : 0;
      schedule(Math.max(0, interval - sinceCut));
    }
  }

  function syncPlayback() {
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute('aria-label', paused ? 'Продолжить смену кадров' : 'Приостановить смену кадров');
    playIcon.toggleAttribute('hidden', !paused);
    pauseIcon.toggleAttribute('hidden', paused);

    if (canPlay()) {
      schedule();
    } else {
      revision++;
      clearTimeout(timer);
      finishCut?.();
    }
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  cache.set(0, poster.decode().then(() => poster, () => {
    cache.delete(0);
    return null;
  }));
  syncPlayback();
})();
