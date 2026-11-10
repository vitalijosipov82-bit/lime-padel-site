(() => {
  'use strict';

  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const film = hero.querySelector('[data-film]');
  const reel = hero.querySelector('[data-reel]');
  const playButton = hero.querySelector('[data-play]');
  const nextButton = hero.querySelector('[data-next]');
  const playIcon = playButton.querySelector('[data-play-icon]');
  const pauseIcon = playButton.querySelector('[data-pause-icon]');
  const number = hero.querySelector('[data-number]');
  const announcement = hero.querySelector('[data-announcement]');
  const meter = hero.querySelector('[data-meter]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const shots = [
    { src: './on-court-1440.webp', name: 'На корте' },
    { src: './club.webp', name: 'Клуб' },
    { src: './ball.webp', name: 'Мяч' },
  ];
  const hold = 5000;
  const cutDuration = 720;
  const slope = Math.tan(11 * Math.PI / 180);
  const decoded = new Map();

  let current = film.querySelector('.shot');
  let active = 0;
  let playing = true;
  let switching = false;
  let timer = 0;
  let progress;
  let completeCut;
  let generation = 0;

  function autoplay() {
    return playing && !reduced.matches && !document.hidden;
  }

  function reflectPlayback() {
    playButton.hidden = reduced.matches;
    playButton.setAttribute('aria-label', playing ? 'Приостановить показ' : 'Продолжить показ');
    playIcon.toggleAttribute('hidden', playing);
    pauseIcon.toggleAttribute('hidden', !playing);
  }

  function clearClock() {
    clearTimeout(timer);
    progress?.cancel();
    progress = undefined;
  }

  function stopPending() {
    generation++;
    clearClock();
    completeCut?.();
  }

  function loadFrame(index) {
    if (decoded.has(index)) return decoded.get(index);
    const image = new Image();
    image.alt = '';
    image.className = 'shot';
    image.dataset.frame = String(index);
    image.decoding = 'async';
    image.src = shots[index].src;
    const request = image.decode().then(() => image, () => {
      decoded.delete(index);
      return null;
    });
    decoded.set(index, request);
    return request;
  }

  function startClock() {
    clearClock();
    if (!autoplay() || switching) return;

    loadFrame((active + 1) % shots.length);
    progress = meter.animate?.(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: hold, fill: 'forwards' },
    );
    timer = setTimeout(() => advance(false), hold);
  }

  function reveal(incoming) {
    const outgoing = current;
    if (reduced.matches || document.hidden) {
      film.replaceChildren(incoming);
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const state = { progress: 0 };
      let width = film.clientWidth;
      let height = film.clientHeight;
      let observer;
      let nativeAnimation;
      let timeline;
      let complete = false;

      function polygon(progress) {
        const offset = height * slope;
        const top = progress * (width + offset);
        const bottom = top - offset;
        return 'polygon(0 0, ' + top + 'px 0, ' + bottom + 'px ' + height + 'px, 0 ' + height + 'px)';
      }

      function render() {
        incoming.style.clipPath = polygon(state.progress);
      }

      function finish() {
        if (complete) return;
        complete = true;
        observer?.disconnect();
        timeline?.kill();
        nativeAnimation?.cancel();
        incoming.style.removeProperty('clip-path');
        outgoing.remove();
        completeCut = undefined;
        resolve();
      }

      completeCut = finish;
      render();
      film.append(incoming);

      if (window.gsap?.timeline) {
        if ('ResizeObserver' in window) {
          observer = new ResizeObserver(() => {
            width = film.clientWidth;
            height = film.clientHeight;
            render();
          });
          observer.observe(film);
        }
        timeline = window.gsap.timeline({ paused: true, onComplete: finish });
        timeline.to(state, { progress: 1, duration: cutDuration / 1000, ease: 'power3.inOut', onUpdate: render });
        timeline.play();
      } else if (incoming.animate) {
        nativeAnimation = incoming.animate(
          [{ clipPath: polygon(0) }, { clipPath: polygon(1) }],
          { duration: cutDuration, easing: 'cubic-bezier(.65, 0, .35, 1)' },
        );
        nativeAnimation.finished.then(finish, finish);
        if ('ResizeObserver' in window) {
          observer = new ResizeObserver(() => {
            if (film.clientWidth !== width || film.clientHeight !== height) finish();
          });
          observer.observe(film);
        }
      } else {
        finish();
      }
    });
  }

  async function advance(manual) {
    if (switching || (!manual && !autoplay())) return;
    switching = true;
    clearClock();
    const request = generation;

    try {
      for (let offset = 1; offset < shots.length; offset++) {
        const index = (active + offset) % shots.length;
        const incoming = await loadFrame(index);
        if (request !== generation || (!manual && !autoplay())) return;
        if (!incoming) continue;

        await reveal(incoming);
        current = incoming;
        active = index;
        number.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(shots.length).padStart(2, '0');
        if (manual) announcement.textContent = 'Кадр ' + (index + 1) + ' из ' + shots.length + '. ' + shots[index].name;
        return;
      }
    } finally {
      switching = false;
      startClock();
    }
  }

  playButton.addEventListener('click', () => {
    playing = !playing;
    reflectPlayback();
    if (playing) startClock();
    else stopPending();
  });
  nextButton.addEventListener('click', () => advance(true));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPending();
    else startClock();
  });
  reduced.addEventListener('change', () => {
    reflectPlayback();
    if (reduced.matches) stopPending();
    else startClock();
  });

  const poster = current;
  decoded.set(0, poster.decode().then(() => poster, () => {
    decoded.delete(0);
    return null;
  }));
  reflectPlayback();
  reel.hidden = false;
  startClock();
})();
