/* Visual Rhythms — amélioration progressive.
   Tout le contenu est dans le HTML : ce script n'ajoute que le confort
   (thème, apparitions, filtres de l'émission, lecteur Soundcloud). */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---------- Thème clair / sombre ---------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return mq && mq.matches ? 'dark' : 'light';
  }
  var switches = document.querySelectorAll('.theme-switch');
  function syncSwitch() {
    var dark = currentTheme() === 'dark';
    for (var i = 0; i < switches.length; i++) {
      switches[i].setAttribute('aria-pressed', dark ? 'true' : 'false');
      switches[i].setAttribute('aria-label', dark ? 'Passer en thème clair' : 'Passer en thème sombre');
    }
  }
  for (var i = 0; i < switches.length; i++) {
    switches[i].addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('vr-theme', next); } catch (e) {}
      syncSwitch();
    });
  }
  syncSwitch();

  /* ---------- Apparition au scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vr-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    for (var r = 0; r < reveals.length; r++) io.observe(reveals[r]);
  } else {
    for (var r2 = 0; r2 < reveals.length; r2++) reveals[r2].classList.add('vr-in');
  }

  /* ---------- Filtres par style (page Émission) ---------- */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    var groups = document.querySelectorAll('[data-group]');
    var pills = filterBar.querySelectorAll('[data-filter]');
    var applyFilter = function (value, scroll) {
      for (var p = 0; p < pills.length; p++) {
        var on = pills[p].getAttribute('data-filter') === value;
        pills[p].classList.toggle('is-active', on);
        if (on) pills[p].setAttribute('aria-current', 'true'); else pills[p].removeAttribute('aria-current');
      }
      for (var g = 0; g < groups.length; g++) {
        groups[g].hidden = !(value === 'all' || groups[g].getAttribute('data-group') === value);
      }
      if (scroll) filterBar.scrollIntoView({ block: 'nearest' });
    };
    filterBar.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-filter]');
      if (!a) return;
      ev.preventDefault();
      var v = a.getAttribute('data-filter');
      applyFilter(v, false);
      if (history.replaceState) history.replaceState(null, '', v === 'all' ? location.pathname : '#' + v);
    });
    var initial = location.hash.replace('#', '');
    if (initial && filterBar.querySelector('[data-filter="' + initial + '"]')) applyFilter(initial, true);
  }

  /* ---------- Lecteur Soundcloud habillé (Widget API) ---------- */
  var apiPromise = null;
  function loadApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      if (window.SC && window.SC.Widget) return resolve(window.SC);
      var s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.async = true;
      s.onload = function () { resolve(window.SC); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return apiPromise;
  }
  function fmt(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  var current = null; // lecteur en cours

  function setup(card, url) {
    var state = { card: card, widget: null, duration: 0, ready: null, playing: false };
    var iframe = document.createElement('iframe');
    iframe.className = 'sc-frame';
    iframe.title = 'Lecteur Soundcloud';
    iframe.setAttribute('allow', 'autoplay');
    iframe.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) +
      '&auto_play=false&visual=false&show_comments=false&show_teaser=false&hide_related=true';
    card.appendChild(iframe);

    var clip = card.querySelector('.wave clipPath rect');
    var wave = card.querySelector('.wave');
    var elapsed = card.querySelector('[data-elapsed]');
    var total = card.querySelector('[data-total]');

    state.ready = loadApi().then(function (SC) {
      return new Promise(function (resolve) {
        var w = SC.Widget(iframe);
        state.widget = w;
        var E = SC.Widget.Events;
        w.bind(E.READY, function () {
          w.getDuration(function (d) {
            state.duration = d;
            if (total && d) total.textContent = fmt(d);
          });
          resolve(w);
        });
        w.bind(E.PLAY, function () {
          state.playing = true;
          card.classList.add('is-playing', 'is-active');
          if (current && current !== state && current.playing) current.widget.pause();
          current = state;
        });
        w.bind(E.PAUSE, function () { state.playing = false; card.classList.remove('is-playing'); });
        w.bind(E.FINISH, function () { state.playing = false; card.classList.remove('is-playing'); });
        w.bind(E.PLAY_PROGRESS, function (e) {
          // La forme d'onde déborde (overflow hidden) : la progression suit la partie visible.
          if (clip && wave) clip.setAttribute('width', (e.relativePosition * wave.clientWidth).toFixed(1));
          if (elapsed) elapsed.textContent = fmt(e.currentPosition);
        });
      });
    });

    if (wave) {
      wave.addEventListener('click', function (ev) {
        if (!state.widget || !state.duration) return;
        var rect = wave.getBoundingClientRect();
        var ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
        state.widget.seekTo(ratio * state.duration);
        if (!state.playing) state.widget.play();
      });
    }
    return state;
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('a.play[data-sc]');
    if (!btn) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; // laisser ouvrir dans un onglet
    var card = btn.closest('[data-player]');
    if (!card) return;
    ev.preventDefault();
    if (!card._vr) card._vr = setup(card, btn.getAttribute('data-sc'));
    var st = card._vr;
    st.ready.then(function (w) {
      if (st.playing) w.pause(); else w.play();
    }, function () {
      // API Soundcloud indisponible : on ouvre la piste directement.
      window.open(btn.href, '_blank', 'noopener');
    });
  });
})();
