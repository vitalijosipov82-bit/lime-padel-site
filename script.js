document.addEventListener("DOMContentLoaded", () => {
    const media = document.getElementById("hero-media");
    const matte = document.getElementById("hero-matte");
    const edge = document.getElementById("hero-cut");
    
    // Массив фестивальных кадров
    const shots = [ "on-court-1440.webp", "club.webp", "ball.webp" ];
    let currentIdx = 0;
    let isTransitioning = false;

    // 1. Скрипт стартового вступления GSAP строго по контракту ТЗ (§4)
    const introLines = document.querySelectorAll("[data-intro-line]");
    const initTl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });
    
    initTl.fromTo(matte,
      { clipPath: 'inset(0 8% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 0.64, stagger: 0, clearProps: 'clipPath' },
      0
    ).fromTo(introLines,
      { yPercent: 28, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, clearProps: 'transform,opacity' },
      0.10
    );

    // 2. Функция создания CourtCut (Смена кадров под углом 11° строго по формуле §5)
    function createCourtCut(gsap, media, next, previous, edge, onDone) {
      const path = edge.querySelector('path');
      const state = { p: 0 };
      const d = Math.tan(11 * Math.PI / 180);
      let done = false;

      function paint() {
        const w = media.clientWidth;
        const h = media.clientHeight;
        if (!w || !h) return;
        const dx = h * d;
        const top = state.p * (w + dx);
        const bottom = top - dx;
        next.style.clipPath = `polygon(0 0, ${top}px 0, ${bottom}px ${h}px, 0 ${h}px)`;
        edge.setAttribute('viewBox', `0 0 ${w} ${h}`);
        path.setAttribute('d', `M ${top} 0 L ${bottom} ${h}`);
        edge.style.opacity = String(Math.max(0, Math.min(1,
          (state.p - 0.08) / 0.12, (0.64 - state.p) / 0.16
        )));
      }

      function finish() {
        if (done) return;
        done = true;
        edge.setAttribute('hidden', '');
        edge.style.removeProperty('opacity');
        next.style.removeProperty('clip-path');
        previous.remove();
        onDone();
      }

      paint();
      edge.removeAttribute('hidden');
      const timeline = gsap.timeline({ onComplete: finish });
      timeline.to(state, { p: 1, duration: 0.56, ease: 'power3.inOut', onUpdate: paint }, 0);
      timeline.fromTo(next.querySelector('img'), { scale: 1.055 }, {
        scale: 1, duration: 0.56, ease: 'power2.out', clearProps: 'transform', overwrite: 'auto',
      }, 0);
    }

    // 3. Логика таймера автоматической смены (5600мс выдержка, 560мс переход)
    function nextFrame() {
        if (isTransitioning) return;
        isTransitioning = true;

        const previous = matte.querySelector(`[data-shot='${currentIdx}']`);
        currentIdx = (currentIdx + 1) % shots.length;

        // Создаем новый слой поверх предыдущего
        const next = document.createElement("div");
        next.setAttribute("data-shot", currentIdx);
        next.className = "absolute inset-0";
        next.innerHTML = `<img src="${shots[currentIdx]}" class="absolute inset-0 h-full w-full object-cover">`;
        matte.appendChild(next);

        // Запуск триггера скольжения маски
        createCourtCut(gsap, media, next, previous, edge, () => {
            isTransitioning = false;
            setTimeout(nextFrame, 5600);
        });
    }

    // Старт цикла автоматических кадров
    setTimeout(nextFrame, 5600);
});
