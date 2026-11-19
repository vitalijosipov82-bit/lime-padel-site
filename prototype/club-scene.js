/* Блок «Клуб» · сцена — по мотивам twicemediahouse.com («Selected work»).
   Фото не двигает скрипт: четыре кадра во весь экран идут в обычном потоке страницы
   (их собирает этот скрипт из тех же <picture>, что стоят в списке), поверх закреплён
   слой с заголовками, фактами и маршрутом. Поэтому нет отставания от прокрутки.
   Скрипт только переключает заголовок, когда кадр пересекает середину экрана,
   и гасит нижние углы, когда к низу экрана подходит белый стык с «Ценами».
   Прокрутку не перехватываем. На очень низких экранах, без JS
   и при prefers-reduced-motion остаётся список кадров. */
(() => {
  const club = document.querySelector('.scene-club');
  if (!club) return;
  // A phone gets the same scene. Only a short viewport or reduced motion needs a list.
  const sceneAllowed = window.matchMedia('(max-width: 800px) and (min-height: 480px) and (prefers-reduced-motion: no-preference), (min-width: 801px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)');
  const scene = club.querySelector('.scene');
  const pin = club.querySelector('.scene__pin');
  const frames = [...club.querySelectorAll('.scene__frame')];
  let photos = null;
  let frameRequest = 0;
  let current = -1;

  const build = () => {
    photos = document.createElement('div');
    photos.className = 'scene__photos';
    photos.setAttribute('aria-hidden', 'true');
    frames.forEach(frame => {
      const picture = frame.querySelector('.scene__photo');
      if (!picture) return;
      const copy = picture.cloneNode(true);
      copy.className = '';
      copy.querySelector('img').alt = '';
      photos.append(copy);
    });
    scene.append(photos);
  };

  const show = (index) => {
    if (index === current) return;
    current = index;
    club.style.setProperty('--active', index);
  };

  const sync = () => {
    frameRequest = 0;
    const { top, bottom } = photos.getBoundingClientRect();
    const height = pin.clientHeight;
    // svh is stable while Safari's address bar changes size. Match the actual title layer.
    const midpoint = height / 2;
    if (bottom < 0 || top > window.innerHeight) return;
    // Середина окна выбирает главу даже после резкого прыжка.
    const index = [...photos.children].findIndex(picture => picture.getBoundingClientRect().bottom > midpoint);
    if (photos.children.length) show(index < 0 ? photos.children.length - 1 : index);
    club.classList.toggle('is-ending', bottom - height < height * 0.3);
  };

  const schedule = () => {
    if (!frameRequest) frameRequest = requestAnimationFrame(sync);
  };

  const configure = () => {
    if (sceneAllowed.matches) {
      if (!photos) build();
      club.classList.add('is-scene');
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      sync();
    } else {
      club.classList.remove('is-scene', 'is-ending');
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    }
  };

  configure();
  sceneAllowed.addEventListener('change', configure);
})();
