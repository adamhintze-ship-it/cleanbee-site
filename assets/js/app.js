/* ===========================================================================
   Clean Bee — site behaviour
   Hash routing, the booking wizard, and the live price estimate.
   No dependencies, no build step.
   =========================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     Business data. These are the numbers the estimate is built from — change
     them here and both the wizard and the estimate panel follow.
     ---------------------------------------------------------------------- */
  /* Where booking requests are sent.
     Empty = nothing is transmitted; the wizard still confirms on screen, but
     NOBODY RECEIVES THE BOOKING. Paste a form endpoint here to go live —
     see "Turning on booking emails" in EDITING.md. */
  var FORM_ENDPOINT = '';

  /* The phone number shown if a booking fails to send. */
  var FALLBACK_PHONE = '(801) 614-2233';

  var BASE_PRICE = 99; // a standard recurring clean, 2 bed / 1 bath, ≤1,200 sq ft

  var TYPES = [
    { label: 'Recurring clean',    note: 'Standard upkeep visit',      base: 99 },
    { label: 'Deep clean',         note: 'Top to bottom reset',        base: 189 },
    { label: 'Move in / out',      note: 'Empty place, every surface', base: 249 },
    { label: 'Airbnb turnover',    note: 'Between guests',             base: 79 },
    { label: 'Office / commercial', note: 'We quote by scope',         base: 0 }
  ];

  var FREQS = [
    { label: 'Weekly',        mult: 0.85 },
    { label: 'Every 2 weeks', mult: 0.9 },
    { label: 'Monthly',       mult: 0.95 },
    { label: 'One time',      mult: 1 }
  ];

  var ADDONS = [
    { label: 'Inside the fridge',     cost: 35 },
    { label: 'Inside the oven',       cost: 35 },
    { label: 'Laundry, wash & fold',  cost: 30 },
    { label: 'Interior windows',      cost: 45 },
    { label: 'Carpet shampoo',        cost: 79 },
    { label: 'Garage sweep-out',      cost: 49 }
  ];

  var TIMES = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];

  /* ZIPs we currently serve — Davis County plus a hop into north Salt Lake. */
  var ZIPS = ['84010', '84011', '84014', '84015', '84016', '84025', '84037',
              '84040', '84041', '84054', '84056', '84075', '84087', '84089'];

  var STEP_LABELS = ['Your space', 'Extras & timing', 'Contact'];

  var PAGES = ['home', 'services', 'pricing', 'about', 'book'];
  var ROUTES = { '': 'home', '/': 'home', '/services': 'services',
                 '/pricing': 'pricing', '/about': 'about', '/book': 'book' };

  /* -------------------------------------------------------------------------
     State
     ---------------------------------------------------------------------- */
  var state = {
    page: 'home',
    step: 1,
    submitted: false,
    menuOpen: false,
    zip: '',
    type: 'Recurring clean',
    beds: 2,
    baths: 1,
    sqft: '',
    freq: 'Every 2 weeks',
    addons: [],
    date: '',
    time: '10:00 AM',
    name: '', tel: '', email: '', addr: '', notes: ''
  };

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* -------------------------------------------------------------------------
     Pricing
     ---------------------------------------------------------------------- */
  function findBy(list, label) {
    for (var i = 0; i < list.length; i++) if (list[i].label === label) return list[i];
    return null;
  }

  /** Returns the estimate in dollars, or null for quote-only work. */
  function price() {
    var type = findBy(TYPES, state.type) || TYPES[0];
    if (type.base === 0) return null;

    var base = BASE_PRICE + (type.base - 99);
    var sq = parseInt(String(state.sqft).replace(/[^0-9]/g, ''), 10) || 0;
    var sqExtra = sq > 1200 ? Math.round((sq - 1200) * 0.045) : 0;
    var rooms = state.beds * 22 + state.baths * 18;

    var extras = state.addons.reduce(function (sum, label) {
      var addon = findBy(ADDONS, label);
      return sum + (addon ? addon.cost : 0);
    }, 0);

    var freq = findBy(FREQS, state.freq) || FREQS[3];
    return Math.round((base + rooms + sqExtra) * freq.mult) + extras;
  }

  function whenLine() {
    if (!state.date) return 'Not picked yet';
    var d = new Date(state.date + 'T12:00:00');
    if (isNaN(d.getTime())) return 'Not picked yet';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
           ', ' + state.time;
  }

  /* -------------------------------------------------------------------------
     Routing
     ---------------------------------------------------------------------- */
  function pageFromHash() {
    var raw = window.location.hash.replace(/^#/, '');
    if (Object.prototype.hasOwnProperty.call(ROUTES, raw)) return ROUTES[raw];
    // tolerate a trailing slash: #/pricing/
    var trimmed = raw.replace(/\/+$/, '');
    return ROUTES[trimmed] || 'home';
  }

  function showPage(page, opts) {
    opts = opts || {};
    state.page = page;

    PAGES.forEach(function (name) {
      var el = document.getElementById('page-' + name);
      if (el) el.hidden = (name !== page);
    });

    $$('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.title = titleFor(page);
    closeNav();
    syncMobileBar();

    if (!opts.keepScroll) window.scrollTo(0, 0);
    if (page === 'book') renderBooking();
  }

  function titleFor(page) {
    var base = 'Clean Bee';
    var suffix = {
      home: 'Professional home & office cleaning in Davis County, UT',
      services: 'Services',
      pricing: 'Pricing',
      about: 'About us',
      book: 'Book a clean'
    }[page];
    return base + ' — ' + suffix;
  }

  function onRouteChange() { showPage(pageFromHash()); }

  function navigate(page) {
    var hash = page === 'home' ? '#/' : '#/' + page;
    if (window.location.hash === hash) showPage(page);
    else window.location.hash = hash;
  }

  /* -------------------------------------------------------------------------
     Compact header + sticky booking bar

     The design switches at 900px. CSS swaps the header controls on its own;
     JS only needs `narrow` for the two things CSS can't express — the drawer's
     open state, and the booking bar, which also depends on the current page.
     ---------------------------------------------------------------------- */
  var narrowQuery = window.matchMedia('(max-width: 899px)');
  var burger = $('#nav-burger');
  var drawer = $('#nav-drawer');
  var mobileBar = $('#mobile-bar');

  function isNarrow() { return narrowQuery.matches; }

  function closeNav() {
    if (!burger || !drawer) return;
    state.menuOpen = false;
    drawer.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    syncMobileBar();
  }

  /* Shown on phones, on every page except the booking flow itself, and never
     underneath an open menu. */
  function syncMobileBar() {
    if (!mobileBar) return;
    mobileBar.hidden = !(isNarrow() && state.page !== 'book' && !state.menuOpen);
  }

  if (burger && drawer) {
    burger.addEventListener('click', function () {
      state.menuOpen = !state.menuOpen;
      drawer.hidden = !state.menuOpen;
      burger.setAttribute('aria-expanded', String(state.menuOpen));
      syncMobileBar();
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
  }

  // Crossing the breakpoint closes the menu, matching the design's resize rule.
  var onBreakpoint = function () { closeNav(); };
  if (narrowQuery.addEventListener) narrowQuery.addEventListener('change', onBreakpoint);
  else narrowQuery.addListener(onBreakpoint);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.menuOpen) { closeNav(); burger.focus(); }
  });

  /* -------------------------------------------------------------------------
     Photo slots — reveal the styled placeholder when a file isn't there yet
     ---------------------------------------------------------------------- */
  function markEmpty(img) {
    var fig = img.closest('.photo');
    if (fig) fig.classList.add('is-empty');
  }

  $$('.photo img').forEach(function (img) {
    img.addEventListener('error', function () { markEmpty(img); });
    // Already failed before this script ran (cached 404, or no file at all).
    if (img.complete && img.naturalWidth === 0) markEmpty(img);
  });

  /* -------------------------------------------------------------------------
     Booking wizard — rendering
     ---------------------------------------------------------------------- */
  var els = {
    progress:  $('#book-progress'),
    formView:  $('#book-form-view'),
    doneView:  $('#book-done-view'),
    form:      $('#book-form'),
    types:     $('#type-choices'),
    freqs:     $('#freq-choices'),
    addons:    $('#addon-choices'),
    times:     $('#time-choices'),
    zip:       $('#f-zip'),
    zipOk:     $('#zip-ok'),
    sqft:      $('#f-sqft'),
    date:      $('#f-date'),
    beds:      $('#out-beds'),
    baths:     $('#out-baths'),
    back:      $('#btn-back'),
    next:      $('#btn-next'),
    error:     $('#form-error'),
    estAmount: $('#est-amount'),
    estNote:   $('#est-note'),
    sumType:   $('#sum-type'),
    sumSpace:  $('#sum-space'),
    sumFreq:   $('#sum-freq'),
    sumAddons: $('#sum-addons'),
    sumWhen:   $('#sum-when'),
    doneWhen:  $('#done-when'),
    doneType:  $('#done-type'),
    doneSpace: $('#done-space'),
    doneFreq:  $('#done-freq'),
    doneEst:   $('#done-estimate'),
    rebook:    $('#btn-rebook')
  };

  var bookingReady = false;

  function buildProgress() {
    els.progress.innerHTML = '';
    STEP_LABELS.forEach(function (label, i) {
      var li = document.createElement('li');
      li.className = 'progress__step';
      li.dataset.step = String(i + 1);
      li.innerHTML = '<span class="progress__bar"></span>' +
                     '<span class="progress__label"></span>';
      $('.progress__label', li).textContent = label;
      els.progress.appendChild(li);
    });
  }

  function buildChoices() {
    // Type of clean — single choice
    els.types.innerHTML = '';
    TYPES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.setAttribute('role', 'radio');
      btn.dataset.value = t.label;
      btn.innerHTML = '<span class="choice__label"></span><span class="choice__note"></span>';
      $('.choice__label', btn).textContent = t.label;
      $('.choice__note', btn).textContent = t.note;
      btn.addEventListener('click', function () { set('type', t.label); });
      els.types.appendChild(btn);
    });

    // Frequency — single choice
    els.freqs.innerHTML = '';
    FREQS.forEach(function (f) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.dataset.value = f.label;
      btn.textContent = f.label;
      btn.addEventListener('click', function () { set('freq', f.label); });
      els.freqs.appendChild(btn);
    });

    // Add-ons — multi choice
    els.addons.innerHTML = '';
    ADDONS.forEach(function (a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice choice--addon';
      btn.dataset.value = a.label;
      btn.innerHTML = '<span class="choice__label"></span><span class="choice__price"></span>';
      $('.choice__label', btn).textContent = a.label;
      $('.choice__price', btn).textContent = '+$' + a.cost;
      btn.addEventListener('click', function () { toggleAddon(a.label); });
      els.addons.appendChild(btn);
    });

    // Arrival window — single choice
    els.times.innerHTML = '';
    TIMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip chip--sm';
      btn.setAttribute('role', 'radio');
      btn.dataset.value = t;
      btn.textContent = t;
      btn.addEventListener('click', function () { set('time', t); });
      els.times.appendChild(btn);
    });

    [els.types, els.freqs, els.times].forEach(enableArrowKeys);
  }

  /** Left/right (and up/down) move between options in a radio group. */
  function enableArrowKeys(group) {
    group.addEventListener('keydown', function (e) {
      var keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
      if (!(e.key in keys)) return;
      var opts = $$('[role="radio"]', group);
      var i = opts.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      var next = opts[(i + keys[e.key] + opts.length) % opts.length];
      next.focus();
      next.click();
    });
  }

  function syncGroup(group, selected) {
    $$('[role="radio"]', group).forEach(function (btn) {
      btn.setAttribute('aria-checked', String(btn.dataset.value === selected));
    });
  }

  function renderBooking() {
    if (!els.form) return;
    if (!bookingReady) {
      buildProgress();
      buildChoices();
      wireBooking();
      bookingReady = true;
    }

    els.formView.hidden = state.submitted;
    els.doneView.hidden = !state.submitted;
    if (state.submitted) { renderDone(); return; }

    // progress bars
    $$('.progress__step', els.progress).forEach(function (li) {
      li.classList.toggle('is-reached', Number(li.dataset.step) <= state.step);
    });

    // step panes
    $$('.step-pane', els.form).forEach(function (pane) {
      pane.hidden = Number(pane.dataset.step) !== state.step;
    });

    // selections
    syncGroup(els.types, state.type);
    syncGroup(els.freqs, state.freq);
    syncGroup(els.times, state.time);
    $$('.choice--addon', els.addons).forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(state.addons.indexOf(btn.dataset.value) !== -1));
    });

    // counters + zip check
    els.beds.textContent = String(state.beds);
    els.baths.textContent = String(state.baths);
    els.zipOk.hidden = ZIPS.indexOf(state.zip.trim()) === -1;

    els.next.textContent = state.step === 3 ? 'Confirm booking' : 'Continue';

    renderEstimate();
  }

  function renderEstimate() {
    var p = price();
    els.estAmount.textContent = p === null ? 'Custom' : '$' + p;
    els.estNote.textContent = p === null
      ? 'Commercial jobs are quoted after a walkthrough'
      : (state.freq === 'One time' ? 'one-time visit, all in' : 'per visit, ' + state.freq.toLowerCase());

    els.sumType.textContent = state.type;
    els.sumSpace.textContent = state.beds + ' bed · ' + state.baths + ' bath';
    els.sumFreq.textContent = state.freq;
    els.sumAddons.textContent = state.addons.length ? state.addons.length + ' selected' : 'None';
    els.sumWhen.textContent = whenLine();
  }

  function renderDone() {
    var p = price();
    els.doneWhen.textContent = whenLine() === 'Not picked yet' ? 'a slot' : whenLine();
    els.doneType.textContent = state.type;
    els.doneSpace.textContent = state.beds + ' bed · ' + state.baths + ' bath';
    els.doneFreq.textContent = state.freq;
    els.doneEst.textContent = p === null ? 'Custom' : '$' + p;
  }

  /* -------------------------------------------------------------------------
     Booking wizard — interaction
     ---------------------------------------------------------------------- */
  function set(key, value) {
    state[key] = value;
    renderBooking();
  }

  function toggleAddon(label) {
    var i = state.addons.indexOf(label);
    if (i === -1) state.addons = state.addons.concat(label);
    else state.addons = state.addons.filter(function (x) { return x !== label; });
    renderBooking();
  }

  function bump(key, delta, min, max) {
    state[key] = Math.min(max, Math.max(min, state[key] + delta));
    renderBooking();
  }

  /** Step 3 needs a way to reach you before we can hold the slot. */
  function validateContact() {
    var required = [
      { el: $('#f-name'),  key: 'name',  label: 'your name' },
      { el: $('#f-tel'),   key: 'tel',   label: 'a phone number' },
      { el: $('#f-email'), key: 'email', label: 'an email address' }
    ];
    var missing = [];

    required.forEach(function (f) {
      var ok = String(state[f.key]).trim() !== '';
      if (ok && f.key === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
      f.el.classList.toggle('is-invalid', !ok);
      if (!ok) missing.push(f.label);
    });

    if (!missing.length) { els.error.hidden = true; return true; }

    els.error.textContent = missing.length === 1
      ? 'We still need ' + missing[0] + '.'
      : 'We still need ' + missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1] + '.';
    els.error.hidden = false;
    required[0].el.closest('.book__panel').scrollIntoView({ block: 'nearest' });
    var firstBad = $('.input.is-invalid', els.form);
    if (firstBad) firstBad.focus();
    return false;
  }

  /** Everything the office needs to act on the request. */
  function bookingPayload() {
    var p = price();
    return {
      name: state.name,
      phone: state.tel,
      email: state.email,
      address: state.addr,
      zip: state.zip,
      service: state.type,
      frequency: state.freq,
      bedrooms: state.beds,
      bathrooms: state.baths,
      sqft: state.sqft,
      addons: state.addons.join(', ') || 'None',
      date: state.date,
      arrival_window: state.time,
      when: whenLine(),
      estimate: p === null ? 'Custom quote' : '$' + p,
      notes: state.notes,
      submitted_at: new Date().toISOString()
    };
  }

  function showConfirmation() {
    state.submitted = true;
    renderBooking();
    window.scrollTo(0, 0);
  }

  function submitBooking() {
    // No endpoint configured yet — confirm on screen without sending.
    if (!FORM_ENDPOINT) { showConfirmation(); return; }

    els.next.disabled = true;
    els.next.textContent = 'Sending…';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(bookingPayload())
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showConfirmation();
    }).catch(function () {
      els.error.textContent = 'We couldn’t send that just now. Please call ' +
        FALLBACK_PHONE + ' and we’ll book you in.';
      els.error.hidden = false;
    }).then(function () {
      els.next.disabled = false;
      els.next.textContent = state.step === 3 ? 'Confirm booking' : 'Continue';
    });
  }

  function wireBooking() {
    // steppers
    $$('[data-bump]', els.form).forEach(function (btn) {
      var key = btn.dataset.bump;
      var delta = Number(btn.dataset.delta);
      var range = key === 'beds' ? [0, 8] : [1, 6];
      btn.addEventListener('click', function () { bump(key, delta, range[0], range[1]); });
    });

    // text inputs mirror straight into state
    [['#f-zip', 'zip'], ['#f-sqft', 'sqft'], ['#f-date', 'date'], ['#f-name', 'name'],
     ['#f-tel', 'tel'], ['#f-email', 'email'], ['#f-addr', 'addr'], ['#f-notes', 'notes']
    ].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.addEventListener('input', function () {
        state[pair[1]] = el.value;
        el.classList.remove('is-invalid');
        renderBooking();
      });
    });

    // no bookings in the past
    if (els.date) els.date.min = new Date().toISOString().slice(0, 10);

    els.back.addEventListener('click', function () {
      if (state.step === 1) navigate('home');
      else { state.step -= 1; renderBooking(); window.scrollTo(0, 0); }
    });

    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.step < 3) {
        state.step += 1;
        renderBooking();
        window.scrollTo(0, 0);
        return;
      }
      if (!validateContact()) return;
      submitBooking();
    });

    els.rebook.addEventListener('click', function () {
      state.submitted = false;
      state.step = 1;
      renderBooking();
      window.scrollTo(0, 0);
    });
  }

  /* -------------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  window.addEventListener('hashchange', onRouteChange);
  showPage(pageFromHash(), { keepScroll: true });
})();
