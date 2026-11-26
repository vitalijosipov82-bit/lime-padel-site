/* Counter 106771873: loaded only after analytics consent. */
(() => {
  'use strict';
  // Keep local files, localhost and staging previews out of the live counter.
  const production = location.protocol === 'https:' && ['lime-padel.ru', 'www.lime-padel.ru'].includes(location.hostname);
  if (window.LimeAnalytics) return;
  let active = false;
  let started = false;
  window.LimeAnalytics = {
    enable() {
      if (!production || started) return;
      active = started = true;
      start();
    },
    disable() {
      active = false;
      if (!started) return;
      // Remove queued init/goals if the remote tag has not loaded yet.
      if (window.ym && Array.isArray(window.ym.a)) window.ym.a.length = 0;
      try { window.ym(106771873, 'destruct'); } catch {}
      // Unload the tag and any Webvisor listeners, including a pending download.
      location.reload();
    }
  };
  function start() {
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j=0;j<document.scripts.length;j++) {if(document.scripts[j].src===r) return;}
    k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
  })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=106771873','ym');
  window.ym(106771873,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});

  }

  document.addEventListener('click', (event) => {
    if (!active) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.hostname !== 'n1437757.yclients.ru' || !url.pathname.startsWith('/company/1301052/')) return;
    // These are outbound clicks, never a confirmed booking or payment.
    try {
      window.ym(106771873, 'reachGoal', 'lime_booking_open');
      if (link.closest('.site-header')) window.ym(106771873, 'reachGoal', 'lime_booking_header');
    } catch { /* Analytics must not interrupt navigation. */ }
  }, true);
})();
