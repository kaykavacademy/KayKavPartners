/* =========================================================
   KayKav Academy — interaction layer
   ========================================================= */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var mq = function (q) { return window.matchMedia(q).matches; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  /* ======================================================
     SMOOTH SCROLL
     ====================================================== */
  var lenis = null;
  if (!REDUCED && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function goTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.3 });
    else { var el = typeof target === 'string' ? $(target) : target; if (el) el.scrollIntoView({ behavior: 'smooth' }); }
  }

  /* ======================================================
     TEXT SPLITTING
     ====================================================== */
  function splitLines(el) {
    if (el.dataset.splitDone) return $$('.sp-line', el);
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    var words = text.split(' ');
    el.textContent = '';
    var frag = document.createDocumentFragment();
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'sp-w';
      s.style.display = 'inline-block';
      s.textContent = w;
      frag.appendChild(s);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);

    /* group words into visual lines by their offsetTop */
    var spans = $$('.sp-w', el);
    var lines = [], cur = null, top = null;
    spans.forEach(function (s) {
      var t = Math.round(s.offsetTop);
      if (top === null || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; }
      cur.push(s);
    });

    el.textContent = '';
    var out = [];
    lines.forEach(function (group) {
      var outer = document.createElement('span');
      outer.className = 'sp-line';
      var inner = document.createElement('span');
      inner.textContent = group.map(function (s) { return s.textContent; }).join(' ');
      outer.appendChild(inner);
      el.appendChild(outer);
      out.push(outer);
    });
    el.dataset.splitDone = '1';
    return out;
  }

  function splitWords(el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    text.split(' ').forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'wd';
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
    });
    return $$('.wd', el);
  }

  /* ======================================================
     PRELOADER + HERO INTRO
     ====================================================== */
  var loader = $('#loader');
  var loaderBar = $('.loader__bar span');
  var loaderCount = $('.loader__count i');
  var loaderFill = $('.loader__fill');

  function intro() {
    var bits = $$('.hero__kicker, .hero__title, .hero__lede, .chips .chip, .hero__foot');

    document.body.classList.remove('is-loading');
    gsap.set('body', { clearProps: 'overflow,height' });

    if (REDUCED) {
      if (loader) loader.style.display = 'none';
      gsap.set(bits, { opacity: 1, y: 0, clearProps: 'opacity,transform' });
      gsap.set('.nav', { opacity: 1, y: 0 });
      Player.reveal();
      ScrollTrigger.refresh();
      return;
    }

    gsap.set(bits, { opacity: 0, y: 20 });
    gsap.set('.nav', { opacity: 0, y: -30 });

    var tl = gsap.timeline();

    if (loader) {
      tl.to('.loader__inner', { opacity: 0, y: -18, duration: .5, ease: 'power2.in' })
        .to(loader, {
          yPercent: -100, duration: 1.0, ease: 'expo.inOut',
          onComplete: function () { loader.style.display = 'none'; }
        }, '-=.15');
    }

    tl.add(function () { Player.reveal(); }, '-=.62')
      .to('.nav', { opacity: 1, y: 0, duration: .8 }, '-=.6')
      .to('.hero__kicker', { opacity: 1, y: 0, duration: .7 }, '-=.62')
      .to('.hero__title', { opacity: 1, y: 0, duration: .95 }, '-=.52')
      .to('.hero__lede', { opacity: 1, y: 0, duration: .8 }, '-=.72')
      .to('.chips .chip', { opacity: 1, y: 0, duration: .6, stagger: .05 }, '-=.66')
      .to('.hero__foot', { opacity: 1, y: 0, duration: .7 }, '-=.6');

    ScrollTrigger.refresh();
  }

  function boot() {
    if (!loader || REDUCED) { if (loader) loader.style.display = 'none'; intro(); return; }
    var state = { p: 0 };
    gsap.to(state, {
      p: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: function () {
        var v = Math.round(state.p);
        if (loaderCount) loaderCount.textContent = v;
        if (loaderBar) loaderBar.style.width = v + '%';
      },
      onComplete: intro
    });
    if (loaderFill) gsap.to(loaderFill, { scale: 1, duration: 1.2, ease: 'expo.out', transformOrigin: '50% 50%' });
    gsap.to('.loader__glyph .lg', { opacity: .9, duration: 1, stagger: .1 });
  }

  /* ======================================================
     REVEALS
     ====================================================== */
  function reveals() {
    $$('[data-split]').forEach(function (el) {
      var lines = splitLines(el);
      /* .sp-line carries bottom padding so descenders clear the mask; park each
         line relative to that padded height, not just its own text height */
      lines.forEach(function (l) {
        var inner = l.firstChild;
        gsap.set(inner, { yPercent: (l.clientHeight / inner.offsetHeight) * 108 });
      });
      ScrollTrigger.create({
        trigger: el, start: 'top 86%', once: true,
        onEnter: function () {
          gsap.to(lines.map(function (l) { return l.firstChild; }), {
            yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: .085
          });
        }
      });
    });

    $$('[data-fade]').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: .95, ease: 'expo.out' }); }
      });
    });

    /* manifesto — word by word on scrub */
    var man = $('[data-words]');
    if (man) {
      var words = splitWords(man);
      ScrollTrigger.create({
        trigger: man, start: 'top 78%', end: 'bottom 52%', scrub: .6,
        onUpdate: function (self) {
          var n = words.length, p = self.progress * (n + 6);
          for (var i = 0; i < n; i++) {
            var v = Math.min(Math.max(p - i, 0), 1);
            words[i].style.opacity = (0.16 + v * 0.84).toFixed(3);
          }
        }
      });
    }

    var rule = $('[data-line]');
    if (rule) {
      ScrollTrigger.create({
        trigger: rule, start: 'top 92%', once: true,
        onEnter: function () { gsap.to(rule, { scaleX: 1, duration: 1.4, ease: 'expo.out' }); }
      });
    }

    /* stacking cards */
    var stack = $$('[data-stack]');
    if (stack.length) {
      gsap.set(stack, { opacity: 0, y: 40 });
      ScrollTrigger.batch(stack, {
        start: 'top 88%',
        onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: .9, stagger: .1, ease: 'expo.out', overwrite: true }); },
        once: true
      });
    }

    /* "collapsed": bars fall away. "unchanged": the line just holds. */
    var bars = $$('.dip__viz--a span');
    var COST = [100, 88, 71, 52, 36, 24, 15, 9, 6, 4];
    if (bars.length) {
      ScrollTrigger.create({
        trigger: '.dip--a', start: 'top 78%', once: true,
        onEnter: function () {
          gsap.to(bars, {
            height: function (i) { return COST[i] + '%'; },
            duration: 1.2, stagger: .06, ease: 'expo.out'
          });
        }
      });
    }
    var flat = $('.viz__flat');
    if (flat) {
      ScrollTrigger.create({
        trigger: '.dip--b', start: 'top 78%', once: true,
        onEnter: function () { gsap.to(flat, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' }); }
      });
    }
  }

  /* ======================================================
     COUNTERS
     ====================================================== */
  function counters() {
    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          var o = { v: 0 };
          gsap.to(o, {
            v: end, duration: 1.9, ease: 'expo.out',
            onUpdate: function () { el.textContent = Math.round(o.v) + suffix; },
            onComplete: function () { el.textContent = end + suffix; }
          });
        }
      });
    });
  }

  /* ======================================================
     HERO SCROLL PARALLAX
     ====================================================== */
  function heroScroll() {
    /* the hero text drifts a little as the player takes over */
    var text = $('.hero__text');
    if (text && !REDUCED) {
      gsap.to(text, {
        yPercent: -6, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 }
      });
    }

    var word = $('.foot__word span');
    if (word) {
      gsap.to(word, {
        yPercent: -4, ease: 'none',
        scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: .5 }
      });
    }
  }

  /* ======================================================
     HORIZONTAL TRACK (six weeks)
     ====================================================== */
  var trackST = null;
  function buildTrack() {
    var sec = $('.track'), vp = $('#trackViewport'), rail = $('#trackRail'), bar = $('#trackBar');
    if (!sec || !rail) return;

    if (trackST) { trackST.kill(); trackST = null; }
    gsap.set(rail, { x: 0 });
    vp.classList.remove('is-swipe');
    vp.onscroll = null;

    /* Pin only where a 100vh section can hold the rail; short viewports get the
       same native swipe as touch rather than a scroll-jack that clips. */
    var touchMode = !FINE || window.innerWidth < 860 || window.innerHeight < 820;
    if (touchMode) {
      /* native swipe on touch: better than hijacking scroll */
      vp.classList.add('is-swipe');
      vp.onscroll = function () {
        var max = vp.scrollWidth - vp.clientWidth;
        if (bar) bar.style.width = (max > 0 ? (vp.scrollLeft / max) * 100 : 0) + '%';
      };
      if (bar) bar.style.width = '0%';
      return;
    }

    var pad = parseFloat(getComputedStyle(rail).paddingLeft) || 40;
    var distance = Math.round(rail.scrollWidth - vp.clientWidth + pad);
    if (distance <= 0) { if (bar) bar.style.width = '100%'; return; }

    trackST = gsap.to(rail, {
      x: -distance, ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: function () { return '+=' + (distance + window.innerHeight * .35); },
        pin: true,
        scrub: .8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { if (bar) bar.style.width = (self.progress * 100).toFixed(1) + '%'; }
      }
    }).scrollTrigger;
  }

  /* ======================================================
     PITCH PLAYER
     Docked over .hero__stage, then interpolated into the
     bottom corner as the hero scrolls away. One element,
     never re-mounted, so playback is never interrupted.
     ====================================================== */
  var Player = (function () {
    var el = $('#player'), stage = $('#stage'), video = $('#video');
    var api = { place: function () {}, reveal: function () {}, ok: false };
    if (!el || !stage || !video) return api;

    var progress = 0, dismissed = false, seeking = false, revealed = false;

    function miniW() {
      var vw = window.innerWidth;
      if (vw < 520) return Math.min(vw * 0.58, 216);
      if (vw < 860) return 236;
      return Math.max(210, Math.min(vw * 0.23, 340));
    }
    function gap() { return window.innerWidth < 720 ? 14 : 24; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function place(t) {
      if (typeof t === 'number') progress = t;
      if (dismissed) return;
      var s = stage.getBoundingClientRect();
      if (!s.width) return;
      var mw = Math.round(miniW()), mh = Math.round(mw * 9 / 16), g = gap();
      var e = progress * progress * (3 - 2 * progress);           /* smoothstep */
      var w = lerp(s.width, mw, e), h = lerp(s.height, mh, e);
      var x = lerp(s.left, window.innerWidth - mw - g, e);
      var y = lerp(s.top, window.innerHeight - mh - g, e);
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
      el.style.borderRadius = lerp(14, 10, e).toFixed(1) + 'px';
      el.classList.toggle('is-mini', e > 0.5);
      el.setAttribute('data-state', e > 0.5 ? 'mini' : 'large');
    }

    /* ---- transport ---- */
    function playing() { return !video.paused && !video.ended; }
    function sync() {
      el.classList.toggle('is-playing', playing());
      el.classList.toggle('is-muted', video.muted);
      var t = $('#playToggle');
      if (t) {
        t.setAttribute('aria-label', playing() ? 'Pause the pitch video' : 'Play the pitch video');
        t.setAttribute('data-cursor', playing() ? 'Pause' : 'Play');
      }
      var m = $('#muteBtn');
      if (m) m.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
    }
    function toggle() {
      if (playing()) { video.pause(); return; }
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {            /* autoplay policy: fall back to muted */
          video.muted = true; sync();
          var q = video.play(); if (q && q.catch) q.catch(function () {});
        });
      }
    }

    function fmt(sec) {
      if (!isFinite(sec) || sec < 0) sec = 0;
      var m = Math.floor(sec / 60), s2 = Math.floor(sec % 60);
      return m + ':' + (s2 < 10 ? '0' : '') + s2;
    }
    function paint() {
      var d = video.duration, c = video.currentTime;
      var pct = (isFinite(d) && d > 0) ? (c / d) * 100 : 0;
      var played = $('#played'), knob = $('#knob'), time = $('#time'), scrub = $('#scrub');
      if (played) played.style.width = pct + '%';
      if (knob) knob.style.left = pct + '%';
      if (time) time.textContent = fmt(c);
      if (scrub) scrub.setAttribute('aria-valuenow', Math.round(pct));
    }
    function tick() { if (playing() && !seeking) paint(); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);

    video.addEventListener('loadedmetadata', function () {
      var cue = $('#cueTime');
      if (cue && isFinite(video.duration)) cue.textContent = fmt(video.duration);
      paint();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.addEventListener('ended', function () { video.currentTime = 0; sync(); paint(); });
    video.addEventListener('volumechange', sync);
    video.addEventListener('error', function () { el.classList.add('is-broken'); });

    var hit = $('#playToggle'); if (hit) hit.addEventListener('click', toggle);
    var mp = $('#miniPlay'); if (mp) mp.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    var mb = $('#muteBtn');
    if (mb) mb.addEventListener('click', function (e) { e.stopPropagation(); video.muted = !video.muted; sync(); });

    var xb = $('#expandBtn');
    if (xb) xb.addEventListener('click', function (e) { e.stopPropagation(); goTo(0); });

    var cb = $('#closeBtn');
    if (cb) cb.addEventListener('click', function (e) {
      e.stopPropagation();
      dismissed = true;
      video.pause();
      el.classList.add('is-dismissed');
    });

    /* ---- seeking ---- */
    var scrub = $('#scrub');
    if (scrub) {
      var seek = function (clientX) {
        var r = scrub.getBoundingClientRect();
        var pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        if (isFinite(video.duration)) { video.currentTime = pct * video.duration; paint(); }
      };
      scrub.addEventListener('pointerdown', function (e) {
        e.stopPropagation(); seeking = true;
        scrub.setPointerCapture(e.pointerId); seek(e.clientX);
      });
      scrub.addEventListener('pointermove', function (e) { if (seeking) seek(e.clientX); });
      scrub.addEventListener('pointerup', function (e) { seeking = false; try { scrub.releasePointerCapture(e.pointerId); } catch (err) {} });
      scrub.addEventListener('keydown', function (e) {
        if (!isFinite(video.duration)) return;
        if (e.key === 'ArrowRight') { video.currentTime = Math.min(video.duration, video.currentTime + 5); paint(); }
        if (e.key === 'ArrowLeft') { video.currentTime = Math.max(0, video.currentTime - 5); paint(); }
      });
    }

    /* ---- scroll ---- */
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: function () { return '+=' + Math.max(300, window.innerHeight * 0.72); },
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var t = REDUCED ? (self.progress > 0.5 ? 1 : 0) : self.progress;
        if (dismissed && t < 0.04) { dismissed = false; el.classList.remove('is-dismissed'); }
        place(t);
      },
      onRefresh: function (self) { place(self.progress); }
    });

    sync(); place(0);

    api.place = place;
    api.reveal = function () {
      if (revealed) return; revealed = true;
      place(progress);
      el.classList.add('is-placed');
    };
    api.ok = true;
    return api;
  })();

  /* ======================================================
     CURSOR
     ====================================================== */
  function cursor() {
    var c = $('.cursor');
    if (!c || !FINE) return;
    var dot = $('.cursor__dot', c), ring = $('.cursor__ring', c), label = $('.cursor__label', c);
    var dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power2' });
    var dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power2' });
    var rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
    var lx = gsap.quickTo(label, 'x', { duration: .5, ease: 'power3' });
    var ly = gsap.quickTo(label, 'y', { duration: .5, ease: 'power3' });

    window.addEventListener('pointermove', function (e) {
      gsap.to(c, { opacity: 1, duration: .3, overwrite: 'auto' });
      dx(e.clientX); dy(e.clientY);
      rx(e.clientX); ry(e.clientY);
      lx(e.clientX); ly(e.clientY);
    }, { passive: true });

    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a,button,summary,[data-cursor],.prow,.acc__item');
      if (!t) { c.classList.remove('is-hot'); label.textContent = ''; return; }
      c.classList.add('is-hot');
      label.textContent = t.getAttribute('data-cursor') || '';
    });
    window.addEventListener('blur', function () { gsap.to(c, { opacity: 0, duration: .2 }); });
  }

  /* ======================================================
     TILT
     ====================================================== */
  function tilt() {
    if (!FINE || REDUCED) return;
    $$('[data-tilt]').forEach(function (el) {
      var rx = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'power3' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'power3' });
      gsap.set(el, { transformPerspective: 1200, transformOrigin: '50% 50%' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 5);
        rx(((e.clientY - r.top) / r.height - .5) * -5);
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ======================================================
     NAV + MENU
     ====================================================== */
  function nav() {
    var navEl = $('#nav'), burger = $('#burger'), menu = $('#menu');
    var hero = $('.hero');
    var last = 0;

    if (hero) {
      ScrollTrigger.create({
        trigger: hero, start: 'bottom top+=80',
        onEnter: function () { navEl.classList.add('is-solid'); },
        onLeaveBack: function () { navEl.classList.remove('is-solid'); }
      });
    }

    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        if (menu.classList.contains('is-open')) { navEl.classList.remove('is-hidden'); last = y; return; }
        if (y > last && y > 520) navEl.classList.add('is-hidden');
        else navEl.classList.remove('is-hidden');
        last = y;
      }
    });

    /* scroll progress + active section in the nav */
    var bar = $('#navBar');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) { if (bar) bar.style.width = (self.progress * 100).toFixed(2) + '%'; }
    });
    $$('.nav__links a').forEach(function (a) {
      var sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 40%', end: 'bottom 40%',
        onToggle: function (self) { a.classList.toggle('is-active', self.isActive); }
      });
    });

    var links = $$('.menu__list a');
    function openMenu(open) {
      menu.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('menu-open', open);
      if (lenis) { open ? lenis.stop() : lenis.start(); }
      if (open) {
        gsap.to(links, { opacity: 1, y: 0, duration: .8, stagger: .06, ease: 'expo.out', delay: .18 });
      } else {
        gsap.to(links, { opacity: 0, y: 24, duration: .3 });
      }
    }
    burger.addEventListener('click', function () { openMenu(!menu.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) openMenu(false); });

    /* anchor links */
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = $(id);
        if (!target) return;
        e.preventDefault();
        var wasOpen = menu.classList.contains('is-open');
        if (wasOpen) openMenu(false);
        setTimeout(function () { goTo(target); }, wasOpen ? 380 : 0);
      });
    });
  }

  /* ======================================================
     ACCORDION (animated <details>)
     ====================================================== */
  function accordion() {
    $$('.acc__item').forEach(function (item) {
      var body = $('.acc__c', item);
      var sum = $('summary', item);
      if (!body || !sum) return;
      if (!item.open) gsap.set(body, { height: 0, opacity: 0, overflow: 'hidden' });
      else gsap.set(body, { height: 'auto', opacity: 1 });

      sum.addEventListener('click', function (e) {
        e.preventDefault();
        var opening = !item.open;
        if (opening) {
          item.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0 },
            { height: 'auto', opacity: 1, duration: .55, ease: 'power3.out', onComplete: ScrollTrigger.refresh });
        } else {
          gsap.to(body, {
            height: 0, opacity: 0, duration: .4, ease: 'power2.inOut',
            onComplete: function () { item.open = false; ScrollTrigger.refresh(); }
          });
        }
      });
    });
  }

  /* ======================================================
     INIT
     ====================================================== */
  function setNavH() {
    var n = $('#nav');
    if (n) document.documentElement.style.setProperty('--navh', n.offsetHeight + 'px');
  }

  function init() {
    setNavH();
    reveals();
    counters();
    heroScroll();
    buildTrack();
    cursor();
    tilt();
    nav();
    accordion();

    var w = window.innerWidth;
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (Math.abs(window.innerWidth - w) < 40) { setNavH(); Player.place(); ScrollTrigger.refresh(); return; }
        w = window.innerWidth;
        setNavH();
        buildTrack();
        Player.place();
        ScrollTrigger.refresh();
      }, 220);
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  function start() { init(); boot(); }
  function whenReady() {
    /* split text only once the webfont is applied, or line grouping is wrong */
    if (document.fonts && document.fonts.ready) {
      var done = false;
      var go = function () { if (!done) { done = true; start(); } };
      document.fonts.ready.then(go);
      setTimeout(go, 2500);
    } else start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenReady);
  else whenReady();
})();
