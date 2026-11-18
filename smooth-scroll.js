// Smooth vertical wheel input while keeping the document as the scroll container.
(() => {
  const body = document.body;
  const desktop = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const timings = { light: 55, strong: 150 };
  let response = 0;
  let frame = 0;
  let previousTime = 0;
  let expectedScroll = 0;
  let position = 0;
  let destination = 0;
  let direction = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function advance(time) {
    // Yield to scroll restoration, focus and script-driven navigation.
    if (Math.abs(scrollY - expectedScroll) > 2) {
      stop();
      return;
    }
    const distance = destination - position;
    const elapsed = Math.max(0, Math.min(time - previousTime, 40));
    position = Math.abs(distance) < 1
      ? destination
      : position + distance * (1 - Math.exp(-elapsed / response));
    scrollTo({ top: position, behavior: 'instant' });
    expectedScroll = scrollY;
    if (position === destination) {
      stop();
      return;
    }
    previousTime = time;
    frame = requestAnimationFrame(advance);
  }

  function wheel(event) {
    const unit = [1, 16, innerHeight][event.deltaMode];
    if (!unit || !event.cancelable || event.defaultPrevented ||
        event.ctrlKey || event.metaKey || event.shiftKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      stop();
      return;
    }
    for (const node of event.composedPath()) {
      if (node === body) break;
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches('select, [contenteditable], [data-native-scroll]') ||
          (node.scrollHeight > node.clientHeight && /^(auto|scroll)$/.test(getComputedStyle(node).overflowY))) {
        stop();
        return;
      }
    }

    const delta = event.deltaY * unit;
    const sign = Math.sign(delta);
    const bottom = document.scrollingElement.scrollHeight - innerHeight;
    if (frame && Math.abs(scrollY - expectedScroll) > 2) stop();
    if (!frame || sign !== direction) destination = scrollY;
    const next = Math.max(0, Math.min(bottom, destination + delta));
    if (!frame && Math.abs(next - scrollY) < 0.01) return;

    event.preventDefault();
    direction = sign;
    destination = next;
    if (!frame) {
      // Keep fractional position even when the browser renders whole pixels.
      position = expectedScroll = scrollY;
      previousTime = performance.now();
      frame = requestAnimationFrame(advance);
    }
  }

  function configure() {
    stop();
    removeEventListener('wheel', wheel);
    response = timings[body.dataset.scrollMode] ?? 0;
    if (desktop.matches && response) {
      addEventListener('wheel', wheel, { passive: false });
    }
  }

  desktop.addEventListener('change', configure);
  new MutationObserver(configure).observe(body, { attributeFilter: ['data-scroll-mode'] });
  for (const event of ['keydown', 'focusin', 'pointerdown', 'touchstart', 'hashchange', 'popstate', 'pagehide', 'blur', 'resize']) {
    addEventListener(event, stop, { passive: true });
  }
  configure();
})();
