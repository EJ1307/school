/* ==========================================================================
   Hopscotch — site behaviour
   Vanilla JS, no dependencies. Everything here is an enhancement: the page
   is fully readable without it.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');

  /* ---------- Sticky header: add a hairline once the page scrolls ---------- */
  var header = document.querySelector('.site-header');
  function updateHeader() {
    header.classList.toggle('is-stuck', header.getBoundingClientRect().top <= 0 && window.scrollY > 20);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var mobileNav = window.matchMedia('(max-width: 1100px)');

  function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

  function setNav(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    toggle.querySelector('.nav-toggle__label').textContent = open ? 'Close' : 'Menu';
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', function () { setNav(!isOpen(), false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) setNav(false, true);
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && isOpen()) setNav(false, false);
  });

  // Close when focus or a click moves outside the header
  document.addEventListener('focusin', function (e) {
    if (isOpen() && !header.contains(e.target)) setNav(false, false);
  });
  document.addEventListener('click', function (e) {
    if (isOpen() && !header.contains(e.target)) setNav(false, false);
  });

  mobileNav.addEventListener('change', function (e) {
    if (!e.matches && isOpen()) setNav(false, false);
  });

  /* ---------- Highlight the nav link for the section in view ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__list a'));
  if ('IntersectionObserver' in window) {
    var linkFor = {};
    navLinks.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- FAQ accordion ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll('.accordion__trigger'));

  function setPanel(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
  }

  triggers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setPanel(btn, btn.getAttribute('aria-expanded') !== 'true');
    });
  });

  // Links such as "How day care works" open the matching answer
  function openFromHash() {
    var target = location.hash && document.querySelector(location.hash);
    if (!target || !target.classList.contains('accordion__item')) return;
    var btn = target.querySelector('.accordion__trigger');
    setPanel(btn, true);
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  /* ---------- A day at Hopscotch: timeline, progress rail + clock ---------- */
  var track = document.querySelector('.day__track');
  if (track) {
    var slots = Array.prototype.slice.call(track.querySelectorAll('.slot'));
    var prevBtn = document.querySelector('[data-day="prev"]');
    var nextBtn = document.querySelector('[data-day="next"]');
    var hourHand = document.querySelector('.clock__hour');
    var minHand = document.querySelector('.clock__min');
    var nowTime = document.querySelector('.day__now-time');
    var nowLabel = document.querySelector('.day__now-label');
    var active = -1;

    var isHorizontal = function () { return getComputedStyle(track).flexDirection === 'row'; };

    var setActive = function (i) {
      i = Math.max(0, Math.min(slots.length - 1, i));
      if (i === active) return;
      active = i;
      slots.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      // Angles keep growing through the morning so the hands always move forwards
      var minutes = Number(slots[i].getAttribute('data-minutes'));
      minHand.style.transform = 'rotate(' + (minutes - 480) * 6 + 'deg)';
      hourHand.style.transform = 'rotate(' + minutes * 0.5 + 'deg)';
      nowTime.textContent = slots[i].querySelector('time').textContent;
      nowLabel.textContent = slots[i].querySelector('h3').textContent;
    };

    // progress runs from 0 (first moment) to slots.length - 1 (last moment)
    var setProgress = function (progress) {
      slots.forEach(function (s, n) {
        var fill = Math.max(0, Math.min(1, progress - n));
        s.style.setProperty('--fill', fill.toFixed(3));
        s.classList.toggle('is-reached', progress >= n - 0.001);
      });
    };

    var step = function () {
      return slots.length > 1 ? slots[1].offsetLeft - slots[0].offsetLeft : track.clientWidth;
    };

    var sync = function () {
      if (isHorizontal()) {
        var max = track.scrollWidth - track.clientWidth;
        prevBtn.disabled = track.scrollLeft <= 2;
        nextBtn.disabled = track.scrollLeft >= max - 2;
        // Spread the whole scroll range across the morning
        var progress = max > 0 ? (track.scrollLeft / max) * (slots.length - 1) : 0;
        setProgress(progress);
        setActive(Math.round(progress));
      } else {
        // Vertical list: the rail fills as each moment passes the middle of the screen
        var mid = window.innerHeight * 0.55;
        var tops = slots.map(function (s) { return s.getBoundingClientRect().top + 10; });
        var progress = 0;
        for (var n = 0; n < tops.length; n++) {
          if (mid < tops[n]) break;
          var next = n + 1 < tops.length ? tops[n + 1] : tops[n];
          progress = n + (next > tops[n] ? Math.min(1, (mid - tops[n]) / (next - tops[n])) : 0);
        }
        setProgress(progress);
        setActive(Math.floor(progress));
      }
    };

    var ticking = false;
    var requestSync = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { sync(); ticking = false; });
    };
    track.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('scroll', function () { if (!isHorizontal()) requestSync(); }, { passive: true });
    window.addEventListener('resize', requestSync);

    prevBtn.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' }); });
    nextBtn.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' }); });

    slots.forEach(function (slot, i) {
      slot.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && isHorizontal()) setActive(i); });
    });

    setActive(0);
    sync();
  }

  /* ---------- Admissions: a pebble hops along the four squares, once ---------- */
  var hopsWrap = document.querySelector('.hops-wrap');
  if (hopsWrap && 'IntersectionObserver' in window) {
    var marker = hopsWrap.querySelector('.hops__marker');
    var tiles = Array.prototype.slice.call(hopsWrap.querySelectorAll('.hops__tile'));
    var hopped = false;

    // Where the pebble sits on a square: lower right of its face
    var spotOn = function (tile) {
      var w = hopsWrap.getBoundingClientRect(), t = tile.getBoundingClientRect();
      return { x: t.left - w.left + t.width * 0.8 - 13, y: t.top - w.top + t.height * 0.82 - 8 };
    };
    var place = function () {
      var end = spotOn(tiles[tiles.length - 1]);
      marker.style.transform = 'translate(' + end.x + 'px,' + end.y + 'px)';
      marker.classList.add('is-placed');
    };

    var hop = function () {
      var spots = tiles.map(spotOn);
      if (reduceMotion.matches || root.classList.contains('shot') || !marker.animate) { place(); return; }
      var frames = [];
      var segments = spots.length; // a drop onto square 1, then a hop to each next square
      var t = function (k) { return k / segments; };
      var at = function (p, sx, sy) { return 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + (sx || 1) + ',' + (sy || 1) + ')'; };
      frames.push({ offset: 0, opacity: 0, transform: at({ x: spots[0].x, y: spots[0].y - 90 }), easing: 'cubic-bezier(.5,0,1,1)' });
      spots.forEach(function (p, k) {
        var land = t(k + 1) - 0.12 / segments;
        frames.push({ offset: land, opacity: 1, transform: at(p, 1.25, 0.7), easing: 'ease-out' });
        frames.push({ offset: Math.min(1, land + 0.06 / segments), opacity: 1, transform: at(p), easing: 'cubic-bezier(.2,.6,.4,1)' });
        if (k + 1 < spots.length) {
          var q = spots[k + 1];
          frames.push({ offset: t(k + 1) + 0.45 / segments, opacity: 1, transform: at({ x: (p.x + q.x) / 2, y: Math.min(p.y, q.y) - 80 }), easing: 'cubic-bezier(.5,0,1,1)' });
        }
      });
      frames[frames.length - 1].offset = 1;
      var anim = marker.animate(frames, { duration: 650 * segments, delay: 900, fill: 'backwards' });
      marker.classList.add('is-placed');
      anim.onfinish = place;
      place();
    };

    var hopIo = new IntersectionObserver(function (entries) {
      if (hopped || !entries[0].isIntersecting) return;
      hopped = true;
      hop();
      hopIo.disconnect();
    }, { threshold: 0.45 });
    hopIo.observe(hopsWrap);
    window.addEventListener('resize', function () { if (hopped) place(); });
  }

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var success = document.getElementById('form-success');
    var dob = form.elements.dob;
    var programme = form.elements.programme;
    var dobHint = document.getElementById('child-dob-hint');
    var programmeChosenByHand = false;
    var attempted = false;
    var CUTOFF = new Date(2027, 5, 1); // age criteria are "as on 1 June 2027"
    var CLASS_BY_AGE = ['', '', 'Playgroup', 'Nursery', 'Junior KG', 'Senior KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

    var today = new Date();
    dob.max = today.toISOString().slice(0, 10);

    var ageOnCutoff = function (value) {
      var d = new Date(value + 'T00:00:00');
      if (isNaN(d)) return null;
      var age = CUTOFF.getFullYear() - d.getFullYear();
      if (CUTOFF.getMonth() < d.getMonth() || (CUTOFF.getMonth() === d.getMonth() && CUTOFF.getDate() < d.getDate())) age--;
      return age;
    };

    var rules = {
      childName: function (v) {
        return v.trim().length < 2 ? 'Please tell us your child’s name — a first name is fine.' : '';
      },
      dob: function (v) {
        if (!v) return 'We need a date of birth to suggest the right class.';
        var d = new Date(v + 'T00:00:00');
        if (isNaN(d) || d > today) return 'That date doesn’t look quite right — could you check it?';
        if (ageOnCutoff(v) > 10) return 'Hopscotch goes up to Grade 5 (about age 10). Please check the year.';
        return '';
      },
      programme: function (v) {
        return v ? '' : 'Pick a programme, or choose “Not sure yet”.';
      },
      parentName: function (v) {
        return v.trim().length < 2 ? 'Please add your name, so we know who to ask for.' : '';
      },
      phone: function (v) {
        var digits = v.replace(/[\s\-().]/g, '').replace(/^(\+91|0091|0)/, '');
        if (!v.trim()) return 'We’ll need a number to call you back on.';
        return /^[6-9]\d{9}$/.test(digits) ? '' : 'That doesn’t look like a 10-digit mobile number — could you check it?';
      },
      email: function (v) {
        if (!v.trim()) return 'Please add your email address.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That email looks incomplete — something like name@example.com.';
      }
    };

    var showError = function (field, message) {
      var error = document.getElementById(field.id + '-error');
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.textContent = message;
      error.hidden = !message;
    };

    var validate = function (name) {
      var field = form.elements[name];
      var message = rules[name](field.value);
      showError(field, message);
      return !message;
    };

    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      field.addEventListener('blur', function () {
        if (attempted || field.value) validate(name);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validate(name);
      });
    });

    // Suggest a class from the date of birth
    var suggestClass = function () {
      var age = dob.value ? ageOnCutoff(dob.value) : null;
      if (age === null || isNaN(age) || age > 10 || new Date(dob.value) > today) { dobHint.textContent = ''; return; }
      if (age < 2) {
        dobHint.textContent = 'Turns 2 after 1 June 2027, so Playgroup the year after. You’re nicely early!';
        return;
      }
      dobHint.textContent = 'That’s ' + CLASS_BY_AGE[age] + ' for 2027–28.';
      if (!programmeChosenByHand) {
        programme.value = CLASS_BY_AGE[age];
        if (programme.getAttribute('aria-invalid') === 'true') validate('programme');
      }
    };
    dob.addEventListener('change', suggestClass);
    dob.addEventListener('input', suggestClass);
    programme.addEventListener('change', function () { programmeChosenByHand = true; });

    // "Enquire about …" links on the programme cards pre-select the programme
    document.querySelectorAll('[data-programme]').forEach(function (link) {
      link.addEventListener('click', function () {
        programme.value = link.getAttribute('data-programme');
        programmeChosenByHand = true;
        if (programme.getAttribute('aria-invalid') === 'true') validate('programme');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempted = true;
      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        if (!validate(name) && !firstInvalid) firstInvalid = form.elements[name];
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      // No backend in this demo: show a friendly confirmation instead
      var parent = form.elements.parentName.value.trim().split(/\s+/)[0];
      var child = form.elements.childName.value.trim().split(/\s+/)[0];
      var day = form.elements.visitDay.value;
      success.querySelector('[data-success-name]').textContent = ', ' + parent;
      success.querySelector('[data-success-text]').textContent =
        'We’ll call you on ' + form.elements.phone.value.trim() + ' within one working day to fix a time for your visit' +
        (day && day !== 'Any day' ? ' — a ' + day + ' if we can.' : '.') +
        ' ' + child + ' is very welcome to come along too.';
      form.hidden = true;
      success.hidden = false;
      success.querySelector('.form-success__title').focus();
    });

    success.querySelector('[data-success-reset]').addEventListener('click', function () {
      form.reset();
      attempted = false;
      programmeChosenByHand = false;
      dobHint.textContent = '';
      Object.keys(rules).forEach(function (name) { showError(form.elements[name], ''); });
      success.hidden = true;
      form.hidden = false;
      form.elements.childName.focus();
    });
  }

  /* ---------- Gentle reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    // Small stagger between siblings that reveal together
    items.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
      var index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = Math.min(index, 5) * 70 + 'ms';
    });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        revealer.unobserve(el);
        if (el.style.transitionDelay) window.setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    root.classList.add('reveal-on');
    items.forEach(function (el) { revealer.observe(el); });
  }
})();
