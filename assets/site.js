/* 316 Garage Door Services — shared site script.
   Safe to load on every page; each block only runs when its elements exist. */
(function () {
  'use strict';

  /* ---------- Sticky header ---------- */
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('fixed', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(function (e) { e.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Animated counters ---------- */
  var countEls = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  var countersStarted = false;
  function runCounters() {
    if (countersStarted) return;
    countersStarted = true;
    countEls.forEach(function (el) {
      var end = Number(el.dataset.count || 0);
      var duration = 1500;
      var start = performance.now();
      (function tick(now) {
        var p = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased).toLocaleString() + '+';
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = end.toLocaleString() + '+';
      })(start);
      requestAnimationFrame(function () {});
    });
  }
  var statTarget = document.querySelector('.stats');
  if (statTarget && countEls.length) {
    if ('IntersectionObserver' in window) {
      var statObs = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { runCounters(); statObs.disconnect(); }
      }, { threshold: 0.05 });
      statObs.observe(statTarget);
    } else { runCounters(); }
  }

  /* ---------- Hero garage door (homepage) ---------- */
  var house = document.getElementById('house'),
      houseWrap = document.getElementById('houseWrap'),
      doorStatus = document.getElementById('doorStatus'),
      openBtn = document.getElementById('openDoor'),
      closeBtn = document.getElementById('closeDoor');
  if (house && openBtn && closeBtn) {
    var doorBusy = false;
    var setDoor = function (open) {
      if (doorBusy || house.classList.contains('is-open') === open) return;
      doorBusy = true;
      house.classList.toggle('is-open', open);
      if (houseWrap) houseWrap.classList.toggle('is-open', open);
      openBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
      closeBtn.setAttribute('aria-pressed', open ? 'false' : 'true');
      if (doorStatus) doorStatus.textContent = open ? 'Opening\u2026' : 'Closing\u2026';
      setTimeout(function () {
        if (doorStatus) doorStatus.textContent = open ? 'Open' : 'Closed & secure';
        doorBusy = false;
      }, 5400);
    };
    openBtn.addEventListener('click', function () { setDoor(true); });
    closeBtn.addEventListener('click', function () { setDoor(false); });
  }

  /* ---------- myQ phone dial (homepage) ---------- */
  var ringSweep = document.getElementById('ringSweep'),
      ringKnob = document.getElementById('ringKnob'),
      ringText = document.getElementById('ringText'),
      ringSub = document.getElementById('ringSub'),
      phoneStatus = document.getElementById('phoneStatus');
  if (ringSweep && ringKnob && ringText) {
    var RING_LEN = 2 * Math.PI * 85,
        ringState = 'CLOSED', ringBusy = false, ringRAF = null;

    var drawRing = function (pct) {
      var f = Math.max(0, Math.min(100, pct)) / 100;
      ringSweep.style.strokeDashoffset = RING_LEN * (1 - f);
      var ang = (f * 360 - 90) * Math.PI / 180;
      ringKnob.setAttribute('cx', (93 + 85 * Math.cos(ang)).toFixed(2));
      ringKnob.setAttribute('cy', (93 + 85 * Math.sin(ang)).toFixed(2));
      ringKnob.style.opacity = f <= 0.001 ? 0 : 1;
    };
    var setPhone = function (state) {
      if (ringBusy || state === ringState) return;
      ringBusy = true;
      var opening = (state === 'OPEN'), from = opening ? 0 : 100, to = opening ? 100 : 0,
          dur = 2200, t0 = null;
      ringText.textContent = opening ? '0%' : '100%';
      if (ringSub) ringSub.textContent = opening ? 'Opening' : 'Closing';
      if (phoneStatus) phoneStatus.textContent = opening ? 'Opening' : 'Closing';
      if (ringRAF) cancelAnimationFrame(ringRAF);
      (function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1),
            e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
            val = from + (to - from) * e;
        drawRing(val);
        ringText.textContent = Math.round(val) + '%';
        if (p < 1) { ringRAF = requestAnimationFrame(step); }
        else {
          ringState = state;
          ringText.textContent = opening ? 'OPEN' : 'CLOSED';
          if (ringSub) ringSub.textContent = opening ? 'Fully open' : 'Secure';
          if (phoneStatus) phoneStatus.textContent = opening ? 'Open' : 'Secure';
          ringBusy = false;
        }
      })(performance.now());
    };
    var ringSetOpen = function () {
      if (ringBusy) return;
      if (ringRAF) cancelAnimationFrame(ringRAF);
      ringState = 'OPEN';
      drawRing(100);
      ringText.textContent = 'OPEN';
      if (ringSub) ringSub.textContent = 'Fully open';
      if (phoneStatus) phoneStatus.textContent = 'Open';
    };
    var ringSetClosed = function () {
      ringState = 'CLOSED';
      drawRing(0);
      ringText.textContent = 'CLOSED';
      if (ringSub) ringSub.textContent = 'Secure';
      if (phoneStatus) phoneStatus.textContent = 'Secure';
    };
    window.setPhone = setPhone;

    var ringReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ringSetOpen();

    var ringCard = document.querySelector('.phone-card');
    if (ringCard && 'IntersectionObserver' in window) {
      var ringArmed = true, ringTimer = null;
      var ringObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (ringArmed) {
              ringArmed = false;
              if (ringReduce) { ringSetClosed(); }
              else { ringTimer = setTimeout(function () { setPhone('CLOSED'); }, 600); }
            }
          } else {
            ringArmed = true;
            if (ringTimer) { clearTimeout(ringTimer); ringTimer = null; }
            ringSetOpen();
          }
        });
      }, { threshold: 0.45 });
      ringObs.observe(ringCard);
    }
  }

  /* ---------- Mobile nav ---------- */
  var hamb = document.querySelector('.hamb'), nav = document.querySelector('.navlinks');
  if (hamb && nav) {
    hamb.setAttribute('aria-expanded', 'false');
    hamb.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === '1';
      if (open) {
        nav.removeAttribute('style'); nav.removeAttribute('data-open');
        hamb.setAttribute('aria-expanded', 'false');
      } else {
        nav.setAttribute('data-open', '1');
        nav.setAttribute('style', 'display:flex;position:absolute;top:calc(100% + 10px);left:10px;right:10px;padding:22px;flex-direction:column;background:#07121c;border:1px solid rgba(255,255,255,.12);gap:18px;box-shadow:0 24px 50px rgba(0,0,0,.55);max-height:calc(100vh - 160px);overflow:auto');
        hamb.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ---------- Reviews marquee (homepage) ---------- */
  var rails = document.querySelectorAll('.rail');
  rails.forEach(function (rail) {
    var cards = Array.prototype.slice.call(rail.children);
    cards.forEach(function (c) { rail.appendChild(c.cloneNode(true)); });
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rails.forEach(function (r) { r.style.animation = 'none'; });
  }

  /* ---------- Year stamp ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
