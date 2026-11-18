(() => {
  const film = document.querySelector('.first-game-film video');
  if (!film) return;

  // Native playback starts only on request, including under prefers-reduced-motion.
  const viewingSeparately = () => document.fullscreenElement === film
    || document.pictureInPictureElement === film || film.webkitDisplayingFullscreen;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !viewingSeparately()) {
        film.pause();
      }
    });
    observer.observe(film);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !viewingSeparately()) {
      film.pause();
    }
  });
})();
