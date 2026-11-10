/* --------------------------------------------------------------------------
   Sound — generated with the Web Audio API (no files needed)
   -------------------------------------------------------------------------- */

function getAudio() {
  try {
    if (!audioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (error) {
    return null;
  }
}

function playTone(ctx, frequency, offset, duration, type = 'sine', volume = 0.1) {
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + offset;
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.06);
}

function playClick() {
  const ctx = getAudio();
  if (!ctx) return;
  playTone(ctx, 880, 0, 0.06, 'sine', 0.03);
}

function playSuccessSound() {
  const ctx = getAudio();
  if (!ctx) return;
  // A warm, rising chime with a soft pad underneath.
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    playTone(ctx, frequency, index * 0.13, 0.55, 'sine', 0.105);
  });
  playTone(ctx, 1046.5, 0.42, 0.9, 'sine', 0.12);
  playTone(ctx, 523.25, 0.42, 1.1, 'triangle', 0.045);
  playTone(ctx, 392, 0, 1.5, 'triangle', 0.028);
}

/* --------------------------------------------------------------------------
   Confetti
   -------------------------------------------------------------------------- */

function fireConfetti() {
  const canvas = $('#confetti');
  if (!canvas) return;
  const host = canvas.parentElement;
  const rect = host.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const colors = ['#3ee6b0', '#71f5ca', '#f4c96b', '#ffffff', '#7cd4ff'];
  const particles = Array.from({ length: 150 }, () => ({
    x: width / 2 + (Math.random() - 0.5) * 260,
    y: height * 0.36 + (Math.random() - 0.5) * 80,
    vx: (Math.random() - 0.5) * 7.5,
    vy: Math.random() * -6 - 2,
    gravity: 0.14 + Math.random() * 0.08,
    size: 3 + Math.random() * 6,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.25,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const startTime = performance.now();
  const duration = 3000;

  function frame(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
    particles.forEach((particle) => {
      particle.vy += particle.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.995;
      particle.rotation += particle.spin;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
      ctx.restore();
    });
    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Reveal + counters + scroll spy
   -------------------------------------------------------------------------- */

function initReveal() {
  const items = $$('[data-reveal]');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('in'));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -45px 0px' });

  items.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight * 0.96 && rect.bottom > 0;
    const notRendered = rect.width === 0 && rect.height === 0 && getComputedStyle(item).display === 'none';
    if (onScreen || notRendered) {
      item.classList.add('in');
    } else {
      item.classList.add('reveal-pending');
      revealObserver.observe(item);
    }
  });

  // Fail-safe: if anything still has not revealed after scrolling stops,
  // force it visible. Guarantees no permanently blank sections.
  const forceVisible = () => {
    $$('[data-reveal].reveal-pending').forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        item.classList.remove('reveal-pending');
        item.classList.add('in');
        if (revealObserver) revealObserver.unobserve(item);
      }
    });
  };
  window.addEventListener('scroll', forceVisible, { passive: true });
  setTimeout(() => {
    $$('[data-reveal].reveal-pending').forEach((item) => {
      item.classList.remove('reveal-pending');
      item.classList.add('in');
      if (revealObserver) revealObserver.unobserve(item);
    });
  }, 6000);
}

function observeNewReveals() {
  if (!revealObserver) {
    $$('[data-reveal]:not(.in)').forEach((item) => item.classList.add('in'));
    return;
  }
  $$('[data-reveal]:not(.in)').forEach((item) => revealObserver.observe(item));
}

function initCounters() {
  const stats = $$('.stat');
  if (!stats.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const run = (stat) => {
    const number = $('[data-count]', stat);
    if (!number) return;
    const target = Number(number.dataset.count) || 0;
    if (reduce) { number.textContent = String(target); return; }
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      number.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    stats.forEach(run);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });
  stats.forEach((stat) => observer.observe(stat));
}

function initScrollSpy() {
  const nav = $('#siteNav');
  const links = $$('.nav-link');
  if (!nav || !links.length) return;
  const ids = links.map((link) => link.getAttribute('href').slice(1));
  let ticking = false;

  const update = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
    const marker = window.scrollY + 170;
    let current = ids[0];
    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (section && section.offsetTop <= marker) current = id;
    });
    links.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
}

/* --------------------------------------------------------------------------
   Mobile menu
   -------------------------------------------------------------------------- */

function setMenu(open) {
  const menu = $('#mobileMenu');
  const toggle = $('#menuToggle');
  if (!menu || !toggle) return;
  menu.hidden = !open;
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

/* --------------------------------------------------------------------------
   Event bindings
   -------------------------------------------------------------------------- */

function bindOverlays() {
  $$('.overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target !== overlay) return;
      if (overlay.id === 'bookingOverlay' && state.authing) {
        toast('Please wait — your payment is being authenticated.', 'info');
        return;
      }
      dismissOverlay(overlay);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if ($('#mobileMenu') && !$('#mobileMenu').hidden) {
      setMenu(false);
      return;
    }
    if (state.pinOpen && !state.authing) {
      closePin();
      return;
    }
    closeTopOverlay();
  });

  document.addEventListener('keydown', (event) => {
    if (!state.pinOpen || state.authing) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      pressPinKey(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      pressPinKey('del');
    }
  });
}

function bindGlobalClicks() {
  document.addEventListener('click', (event) => {
    const target = event.target;

    if (target.closest('[data-close-auth]')) { dismissOverlay($('#authOverlay')); return; }
    if (target.closest('[data-close-doctor]')) { dismissOverlay($('#doctorOverlay')); return; }
    if (target.closest('[data-close-booking]')) { dismissOverlay($('#bookingOverlay')); return; }
    if (target.closest('[data-close-visits]')) { dismissOverlay($('#visitsOverlay')); return; }

    const bookNow = target.closest('[data-book-now]');
    if (bookNow) {
      if ($('#visitsOverlay').classList.contains('open')) dismissOverlay($('#visitsOverlay'));
      startBooking();
      return;
    }

    const careButton = target.closest('[data-care]');
    if (careButton) {
      if (careButton.closest('#bookingOverlay')) return;
      if ($('#visitsOverlay').classList.contains('open')) dismissOverlay($('#visitsOverlay'));
      startBooking({ careId: careButton.dataset.care });
      return;
    }

    const doctorButton = target.closest('[data-book-doctor]');
    if (doctorButton) {
      startBooking({ doctorId: doctorButton.dataset.bookDoctor });
      return;
    }

    const authButton = target.closest('[data-open-auth]');
    if (authButton) {
      openAuth(authButton.dataset.openAuth || 'login');
      return;
    }

    if (target.closest('#navDoctor') || target.closest('[data-open-doctor]')) {
      openDoctorPortal();
      return;
    }

    if (target.closest('#navUser') || target.closest('[data-my-visits]')) {
      openVisits();
      return;
    }

    if (target.closest('#navSignOut') || target.closest('#mobileSignOut')) {
      signOut();
      return;
    }

    const authTab = target.closest('[data-auth-tab]');
    if (authTab) {
      setAuthTab(authTab.dataset.authTab);
      return;
    }

    const revealButton = target.closest('[data-reveal-for]');
    if (revealButton) {
      const input = document.getElementById(revealButton.dataset.revealFor);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      revealButton.textContent = show ? 'Hide' : 'Show';
      return;
    }

    if (target.closest('[data-demo-login]')) {
      setAuthTab('login');
      $('#loginEmail').value = DEMO_EMAIL;
      $('#loginPassword').value = DEMO_PASSWORD;
      clearFieldErrors($('#loginForm'));
      setFormMsg($('#loginMsg'), 'Demo credentials filled — press “Sign in securely”.', 'ok');
      $('#loginForm button[type="submit"]').focus();
      return;
    }

    if (target.closest('[data-demo-doctor]')) {
      fillDoctorDemo();
      return;
    }

    const icsButton = target.closest('[data-ics]');
    if (icsButton) {
      const booking = store.get(KEYS.bookings, []).find((item) => item.id === icsButton.dataset.ics);
      addToCalendar(booking);
      return;
    }

    if (target.closest('#addCalendar')) { addToCalendar(state.lastBooking); return; }
    if (target.closest('#downloadReceipt')) { downloadReceipt(state.lastBooking); return; }

    if (target.closest('#bookAnother')) {
      state.lastBooking = null;
      resetBooking({});
      return;
    }

    if (target.closest('#successDone')) {
      dismissOverlay($('#bookingOverlay'));
      toast('Your appointment is confirmed. We will see you soon.', 'success');
    }
  });
}

function bindMenu() {
  $('#menuToggle').addEventListener('click', () => {
    setMenu($('#mobileMenu').hidden);
  });
  $('#mobileMenu').addEventListener('click', (event) => {
    if (event.target.closest('a, button')) setMenu(false);
  });
}

function bindForms() {
  $('#loginForm').addEventListener('submit', handleLogin);
  $('#registerForm').addEventListener('submit', handleRegister);
  $('#doctorForm').addEventListener('submit', handleDoctorLogin);

  $$('#regMobile, #pPhone').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 10);
    });
  });

  $('#regTerms').addEventListener('change', () => {
    if ($('#regTerms').checked) $('#termsErr').textContent = '';
  });

  document.addEventListener('input', (event) => {
    const field = event.target.closest('.field');
    if (!field) return;
    field.classList.remove('has-err');
    const err = field.querySelector('.err');
    if (err) err.textContent = '';
  });

  document.addEventListener('change', (event) => {
    const field = event.target.closest('.field');
    if (!field) return;
    field.classList.remove('has-err');
    const err = field.querySelector('.err');
    if (err) err.textContent = '';
  });
}

function bindBooking() {
  const careGrid = $('#careGrid');
  if (careGrid) {
    careGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.care-card');
      if (card) selectCare(card.dataset.care);
    });
  }

  const doctorGrid = $('#bookingDoctorGrid');
  if (doctorGrid) {
    doctorGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.bdoc-card');
      if (card) selectDoctor(card.dataset.doctor);
    });
  }

  const filters = $('#doctorFilters');
  if (filters) {
    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-doc-filter]');
      if (!chip) return;
      state.docFilter = chip.dataset.docFilter;
      $$('.chip', filters).forEach((item) => item.classList.toggle('active', item === chip));
      renderBookingDoctors();
    });
  }

  const dates = $('#dateScroller');
  if (dates) {
    dates.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-date]');
      if (chip) selectDate(chip.dataset.date);
    });
  }

  const slots = $('#slotGrid');
  if (slots) {
    slots.addEventListener('click', (event) => {
      const button = event.target.closest('[data-slot]');
      if (!button || button.disabled) return;
      selectSlot(button.dataset.slot);
    });
  }

  $('#bookNext').addEventListener('click', nextStep);
  $('#bookBack').addEventListener('click', previousStep);
  $('#payBtn').addEventListener('click', () => {
    getAudio();
    openPin();
  });
  $('#pinBack').addEventListener('click', closePin);

  $('#keypad').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-key]');
    if (!button) return;
    pressPinKey(button.dataset.key);
  });

  $('#methodList').addEventListener('change', () => {
    $$('#methodList .method').forEach((method) => {
      const input = method.querySelector('input');
      method.classList.toggle('active', !!(input && input.checked));
      if (input && input.checked) state.payMethod = input.value;
    });
  });
}

function bindDoctorDashboard() {
  $('#dashClose').addEventListener('click', () => dismissOverlay($('#doctorOverlay')));
  $('#dashSignOut').addEventListener('click', doctorSignOut);
  $('#dashRefresh').addEventListener('click', () => {
    renderDashboard();
    toast('Schedule refreshed.', 'info');
  });
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */

function init() {
  $('#year').textContent = String(new Date().getFullYear());
  initReveal();
  renderHomeDoctors();
  syncAuthUI();
  initCounters();
  initScrollSpy();
  bindMenu();
  bindOverlays();
  bindGlobalClicks();
  bindForms();
  bindBooking();
  bindDoctorDashboard();
  initPremium();
  observeNewReveals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
