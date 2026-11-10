(() => {
  'use strict';

  function init() {
    const hero = document.getElementById('hero');
    if (!hero || hero.hasAttribute('data-ready')) return;

    const matte = hero.querySelector('[data-matte]');
    const seam = hero.querySelector('[data-seam]');
    const path = seam?.querySelector('path');
    const controls = hero.querySelector('[data-controls]');
    const toggle = hero.querySelector('[data-toggle]');
    const next = hero.querySelector('[data-next]');
    const status = hero.querySelector('[data-status]');
    const count = hero.querySelector('[data-count]');
    const chapter = hero.querySelector('[data-chapter]');
    const chapterNames = ['На корте', 'Крытый зал', 'Деталь игры'];
    let current = matte?.querySelector('.hero-shot');
    const poster = current?.querySelector('img');

    if (!matte || !seam || !path || !controls || !toggle || !next || !status || !poster) return;
    hero.setAttribute('data-ready', '');

    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const slope = Math.tan(11 * Math.PI / 180);
    const shots = [
      { src: poster.src, srcset: poster.srcset, sizes: poster.sizes, alt: poster.alt },
      {
        src: './images/hero/club.webp',
        alt: 'Синие корты в крытом зале клуба «Лайм»',
      },
      {
        src: './images/hero/ball.webp',
        alt: 'Падельный мяч в руке спортсменки',
      },
    ];

    let index = 0;
    let timer = 0;
    let revision = 0;
    let busy = false;
    let visible = false;
    let playing = !reduce.matches;
    let finishCut = null;

    function canPlay() {
      return playing && visible && !reduce.matches && !document.hidden;
    }

    function syncControls() {
      toggle.textContent = playing ? 'Пауза' : 'Продолжить';
      toggle.hidden = reduce.matches;
    }

    function schedule() {
      clearTimeout(timer);
      if (canPlay() && !busy) timer = setTimeout(() => advance(false), 5600);
    }

    function pause() {
      playing = false;
      revision++;
      finishCut?.();
      syncControls();
      schedule();
    }

    async function loadShot(shotIndex) {
      const shot = shots[shotIndex];
      const image = new Image();

      image.alt = shot.alt;
      image.decoding = 'async';
      if (shot.srcset) {
        image.sizes = shot.sizes;
        image.srcset = shot.srcset;
      }
      image.src = shot.src;
      await image.decode();

      const layer = document.createElement('div');
      layer.className = 'hero-shot';
      layer.dataset.shot = String(shotIndex);
      layer.append(image);
      return layer;
    }

    function showShot(incoming) {
      const previous = current;
      const image = incoming.querySelector('img');
      const gsap = window.gsap;

      if (reduce.matches || !visible || document.hidden) {
        matte.append(incoming);
        current = incoming;
        previous.remove();
        return Promise.resolve();
      }

      return new Promise(resolve => {
        const state = { p: 0 };
        let completed = false;

        function finish() {
          if (completed) return;
          completed = true;
          incoming.style.removeProperty('clip-path');
          image.style.removeProperty('transform');
          seam.setAttribute('hidden', '');
          seam.style.removeProperty('opacity');
          previous.remove();
          finishCut = null;
          resolve();
        }

        previous.setAttribute('aria-hidden', 'true');
        matte.append(incoming);
        current = incoming;

        if (!gsap) {
          if (!incoming.animate) {
            finish();
            return;
          }

          const diagonal = matte.clientHeight * slope;
          const width = matte.clientWidth;
          const animation = incoming.animate([
            { clipPath: `polygon(0 0, 0 0, ${-diagonal}px 100%, 0 100%)` },
            { clipPath: `polygon(0 0, ${width + diagonal}px 0, ${width}px 100%, 0 100%)` },
          ], {
            duration: 700,
            easing: 'cubic-bezier(.65, 0, .35, 1)',
          });

          finishCut = () => animation.finish();
          animation.finished.then(finish, finish);
          return;
        }

        function draw() {
          const width = matte.clientWidth;
          const height = matte.clientHeight;
          const diagonal = height * slope;
          const top = state.p * (width + diagonal);
          const bottom = top - diagonal;
          const offset = matte.offsetLeft;

          incoming.style.clipPath =
            `polygon(0 0, ${top}px 0, ${bottom}px ${height}px, 0 ${height}px)`;
          seam.setAttribute('viewBox', `0 0 ${seam.clientWidth} ${height}`);
          path.setAttribute('d', `M ${top + offset} 0 L ${bottom + offset} ${height}`);
          seam.style.opacity = String(Math.max(0, Math.min(
            1, (state.p - .08) / .12, (.68 - state.p) / .16
          )));
        }

        seam.removeAttribute('hidden');
        draw();

        const timeline = gsap.timeline({
          paused: true,
          onComplete: finish,
          onInterrupt: finish,
        });

        timeline.to(state, {
          p: 1,
          duration: .7,
          ease: 'power3.inOut',
          onUpdate: draw,
        }, 0);

        timeline.fromTo(image, { scale: 1.065 }, {
          scale: 1,
          duration: .7,
          ease: 'power2.out',
        }, 0);

        finishCut = () => timeline.progress(1);
        timeline.play(0);
      });
    }

    async function advance(manual) {
      if (busy || (!manual && !canPlay())) return;
      busy = true;
      clearTimeout(timer);
      const request = ++revision;

      try {
        for (let step = 1; step < shots.length; step++) {
          const candidate = (index + step) % shots.length;
          let incoming;
          try {
            incoming = await loadShot(candidate);
          } catch {
            if (request !== revision) return;
            continue;
          }

          if (request !== revision || (!manual && !canPlay())) return;
          await showShot(incoming);
          index = candidate;
          if (count) count.textContent = String(index + 1).padStart(2, '0');
          if (chapter) chapter.textContent = chapterNames[index];
          if (manual) status.textContent = shots[index].alt;
          return;
        }

        pause();
        status.textContent = 'Следующий кадр не загрузился.';
      } finally {
        busy = false;
        schedule();
      }
    }

    toggle.addEventListener('click', () => {
      if (playing) {
        pause();
      } else if (!reduce.matches) {
        playing = true;
        syncControls();
        schedule();
      }
    });

    next.addEventListener('click', () => {
      if (busy) return;
      pause();
      advance(true);
    });

    controls.addEventListener('focusin', event => {
      if (playing && event.target.matches(':focus-visible')) pause();
    });

    function suspend() {
      revision++;
      finishCut?.();
      schedule();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) suspend();
      else schedule();
    });

    reduce.addEventListener('change', () => {
      if (reduce.matches) pause();
      syncControls();
    });

    controls.hidden = false;
    syncControls();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= .25;
        if (visible) schedule();
        else suspend();
      }, { threshold: [0, .25] }).observe(hero);
    } else {
      visible = true;
      schedule();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
