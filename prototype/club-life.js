(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const resets = [];
  document.querySelectorAll('.club-life__poster-stage').forEach(stage => {
    const sheet = stage.querySelector('.club-life__print');
    let frame = 0, clientX = 0, clientY = 0;
    const clear = () => {
      cancelAnimationFrame(frame); frame = 0;
      sheet.classList.remove('is-following');
      ['--mx', '--my', '--rx', '--ry', '--rz'].forEach(p => sheet.style.removeProperty(p));
    };
    const draw = () => {
      frame = 0;
      const rect = stage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (clientY - rect.top) / rect.height * 2 - 1));
      const values = {
        '--mx': x * 16 + 'px', '--my': y * 10 + 'px',
        '--rx': -y * 12 + 'deg', '--ry': x * 16 + 'deg', '--rz': x * 2 + 'deg'
      };
      Object.entries(values).forEach(([key, value]) => sheet.style.setProperty(key, value));
    };
    const start = event => {
      if (reduced.matches || !fine.matches || event.pointerType === 'touch') return;
      sheet.classList.add('is-following');
    };
    stage.addEventListener('pointerenter', start);
    stage.addEventListener('pointermove', event => {
      if (!sheet.classList.contains('is-following')) start(event);
      if (!sheet.classList.contains('is-following')) return;
      clientX = event.clientX; clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(draw);
    });
    stage.addEventListener('pointerleave', clear); stage.addEventListener('pointercancel', clear);
    resets.push(clear);
  });
  const reset = () => resets.forEach(clear => clear());
  reduced.addEventListener('change', reset); fine.addEventListener('change', reset);
  addEventListener('blur', reset); addEventListener('resize', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
