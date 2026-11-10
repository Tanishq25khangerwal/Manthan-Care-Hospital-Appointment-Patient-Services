/* ==========================================================================
   MANTHAN PHARMA — premium interactions
   Liquid-glass rails · care navigator · FAQ · dock · micro-interactions
   ========================================================================== */

const NAV_URGENCY = ['Today', 'This week', 'This month', 'Just exploring'];

const NAV_MATRIX = {
  me: ['general', 'fullbody', 'executive', 'nutrition'],
  family: ['mother', 'general', 'fullbody', 'nutrition'],
  senior: ['cardiac', 'general', 'diabetes', 'physio']
};

const NAV_COPY = {
  me: {
    kicker: 'Recommended for you',
    intro: 'A same-day physician consult is the fastest way to get answers, a prescription and a clear next step.',
    note: 'Free follow-up included'
  },
  family: {
    kicker: 'Recommended for your family',
    intro: 'One visit can cover the person you care for — with a specialist who explains everything in plain language.',
    note: 'Family-friendly slots'
  },
  senior: {
    kicker: 'Recommended for a senior',
    intro: 'A slower, more thorough review with mobility, medicines and heart health looked at together.',
    note: 'Wheelchair access'
  }
};

const JOURNAL_NOTES = {
  checkup: 'Health checkup guide · Choose by age, family history and lifestyle — our care desk can help you compare.',
  heart: 'Heart health guide · Breathlessness, jaw pain and unusual fatigue are worth checking early.',
  child: 'Family guide · Bring a comfort toy, talk through each step and ask for a child-life specialist.',
  visiting: 'Visiting hours · OPD 8:00 AM – 9:00 PM. Ward visitors 10:00 AM – 12:00 PM and 5:00 PM – 7:00 PM. Emergency always open.'
};

function initPremium() {
  bindRails();
  bindDoctorFilters();
  bindNavigator();
  bindFaq();
  bindJournal();
  bindNewsletter();
  bindDock();
  bindScrollProgress();
  bindRipples();
  bindSpotlight();
  bindRailProgress();
  bindStoryAutoplay();
}

/* --------------------------------------------------------------------------
   Horizontal glass rails
   -------------------------------------------------------------------------- */

function railStep(rail) {
  const first = rail.querySelector(':scope > *');
  if (!first) return 320;
  const gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || 16) || 16;
  return first.getBoundingClientRect().width + gap;
}

function scrollRail(railId, direction) {
  const rail = document.getElementById(railId);
  if (!rail) return;
  rail.scrollBy({ left: railStep(rail) * direction, behavior: 'smooth' });
}

function bindRails() {
  document.addEventListener('click', (event) => {
    const next = event.target.closest('[data-rail-next]');
    if (next) { scrollRail(next.dataset.railNext, 1); return; }
    const prev = event.target.closest('[data-rail-prev]');
    if (prev) { scrollRail(prev.dataset.railPrev, -1); }
  });

  ['doctorGrid', 'packageRail', 'storyRail'].forEach((id) => {
    const rail = document.getElementById(id);
    if (!rail) return;
    rail.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); scrollRail(id, 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); scrollRail(id, -1); }
    });
  });
}

function bindRailProgress() {
  const pairs = [
    ['doctorGrid', 'doctorRailProgress'],
    ['packageRail', 'packageRailProgress'],
    ['storyRail', 'storyRailProgress']
  ];
  pairs.forEach(([railId, barId]) => {
    const rail = document.getElementById(railId);
    if (!rail) return;
    const update = () => updateRailProgress(railId, barId);
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });
}

/* --------------------------------------------------------------------------
   Doctor filter chips
   -------------------------------------------------------------------------- */

function bindDoctorFilters() {
  document.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-home-dept]');
    if (!chip) return;
    state.homeDept = chip.dataset.homeDept;
    renderHomeDoctors();
  });
}

/* --------------------------------------------------------------------------
   Care navigator
   -------------------------------------------------------------------------- */

function renderNavigator() {
  const care = CARE_TYPES.find((c) => c.id === (NAV_MATRIX[state.navFor] || NAV_MATRIX.me)[state.navUrgency]);
  if (!care) return;
  const copy = NAV_COPY[state.navFor] || NAV_COPY.me;
  const wait = state.navUrgency === 0 ? 'Today' : state.navUrgency === 1 ? 'This week' : state.navUrgency === 2 ? 'This month' : 'No rush';

  const map = {
    navResultKicker: copy.kicker,
    navResultTitle: care.name,
    navResultText: care.desc,
    navResultPrice: money(care.price),
    navResultWait: wait,
    navResultIncludes: care.meta[0] || copy.note,
    navUrgencyLabel: NAV_URGENCY[state.navUrgency]
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  const book = document.getElementById('navResultBook');
  if (book) {
    book.dataset.care = care.id;
    book.innerHTML = `Book ${escapeHTML(care.name)} <svg class="ico"><use href="#i-arrow"></use></svg>`;
  }

  const range = document.getElementById('navUrgency');
  if (range) {
    range.style.setProperty('--fill', `${(state.navUrgency / 3) * 100}%`);
    range.setAttribute('aria-valuetext', NAV_URGENCY[state.navUrgency]);
  }
}

function bindNavigator() {
  const segmented = document.getElementById('navFor');
  if (segmented) {
    segmented.addEventListener('click', (event) => {
      const button = event.target.closest('[data-nav-for]');
      if (!button) return;
      const buttons = $$('.seg-btn', segmented);
      state.navFor = button.dataset.navFor;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      const index = buttons.indexOf(button);
      segmented.style.setProperty('--seg-index', String(index));
      renderNavigator();
    });
  }

  const range = document.getElementById('navUrgency');
  if (range) {
    range.addEventListener('input', () => {
      state.navUrgency = Number(range.value);
      renderNavigator();
    });
  }

  renderNavigator();
  document.getElementById('navFor')?.style.setProperty('--seg-index', '0');
}

/* --------------------------------------------------------------------------
   FAQ accordion
   -------------------------------------------------------------------------- */

function bindFaq() {
  const list = document.getElementById('faqList');
  if (!list) return;
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-faq]');
    if (!button) return;
    const item = button.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    $$('.faq-item', list).forEach((entry) => {
      entry.classList.remove('open');
      entry.querySelector('[data-faq]')?.setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
}

/* --------------------------------------------------------------------------
   Journal + newsletter
   -------------------------------------------------------------------------- */

function bindJournal() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-journal]');
    if (!button) return;
    const key = button.dataset.journal;
    toast(JOURNAL_NOTES[key] || 'This guide is being reviewed by our clinical team.', 'info');
  });
}

function bindNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('newsEmail');
    const email = input.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast('Enter a valid email address to subscribe.', 'error');
      input.focus();
      return;
    }
    toast('You are on the list. The next Manthan note arrives next month.', 'success');
    form.reset();
  });
}

/* --------------------------------------------------------------------------
   Quick dock + scroll progress
   -------------------------------------------------------------------------- */

function bindDock() {
  const dock = document.querySelector('.quick-dock');
  if (dock) {
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-back-top]')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  const back = document.querySelector('[data-back-top]');
  if (back) {
    const toggle = () => back.classList.toggle('show', window.scrollY > 600);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }
}

function bindScrollProgress() {
  const bar = document.querySelector('#scrollProgress i');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

/* --------------------------------------------------------------------------
   Micro-interactions — ripple + cursor spotlight
   -------------------------------------------------------------------------- */

function bindRipples() {
  const selector = '.btn, .dock-btn, .rail-btn, .seg-btn, .chip, .mini-book';
  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest(selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 1.4;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  });
}

function bindSpotlight() {
  if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
  $$('.liquid-card, .glass-panel, .doc-card, .package-card, .specialty-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   Gentle testimonial autoplay
   -------------------------------------------------------------------------- */

function bindStoryAutoplay() {
  const rail = document.getElementById('storyRail');
  if (!rail) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let timer = null;
  const tick = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    if (max <= 4) return;
    if (rail.scrollLeft >= max - 4) {
      rail.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollRail('storyRail', 1);
    }
  };
  const start = () => { stop(); timer = window.setInterval(tick, 7000); };
  const stop = () => { if (timer) window.clearInterval(timer); timer = null; };

  rail.addEventListener('pointerenter', stop);
  rail.addEventListener('focusin', stop);
  rail.addEventListener('pointerleave', start);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())), { threshold: 0.35 })
    : null;
  if (observer) observer.observe(rail);
  else start();
}
