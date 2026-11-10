/* --------------------------------------------------------------------------
   Authentication
   -------------------------------------------------------------------------- */

const AUTH_COPY = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Good to see you again.',
    subtitle: 'Sign in to book, reschedule and view your reports.',
    switch: 'New to Manthan Pharma? <button type="button" class="link-btn" data-auth-tab="register">Create an account</button>'
  },
  register: {
    eyebrow: 'Join MANTHAN PHARMA',
    title: "Let's get you set up.",
    subtitle: 'One account for appointments, reports and everyone you care for.',
    switch: 'Already have an account? <button type="button" class="link-btn" data-auth-tab="login">Sign in instead</button>'
  }
};

function openAuth(tab = 'login') {
  setAuthTab(tab);
  clearFieldErrors($('#loginForm'));
  clearFieldErrors($('#registerForm'));
  clearFormMsg($('#loginMsg'));
  clearFormMsg($('#registerMsg'));
  $('#termsErr').textContent = '';
  openOverlay($('#authOverlay'));
}

function setAuthTab(tab) {
  const next = tab === 'register' ? 'register' : 'login';
  state.authTab = next;
  $$('[data-auth-tab]').forEach((el) => {
    if (!el.classList.contains('auth-tab')) return;
    const active = el.dataset.authTab === next;
    el.classList.toggle('active', active);
    el.setAttribute('aria-selected', String(active));
  });
  $('#loginForm').hidden = next !== 'login';
  $('#registerForm').hidden = next !== 'register';
  const copy = AUTH_COPY[next];
  $('#authEyebrow').textContent = copy.eyebrow;
  $('#authTitle').textContent = copy.title;
  $('#authSubtitle').textContent = copy.subtitle;
  $('#authSwitch').innerHTML = `<span>${next === 'login' ? 'New to Manthan Pharma?' : 'Already have an account?'}</span>${copy.switch.replace(/^[^<]*/, '')}`;
  clearFormMsg($('#loginMsg'));
  clearFormMsg($('#registerMsg'));
  const form = next === 'login' ? $('#loginForm') : $('#registerForm');
  const first = form.querySelector('input');
  if (first && $('#authOverlay').classList.contains('open')) {
    window.setTimeout(() => first.focus({ preventScroll: true }), 60);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  clearFormMsg($('#loginMsg'));
  const emailInput = $('#loginEmail');
  const passInput = $('#loginPassword');
  const email = emailInput.value.trim().toLowerCase();
  const password = passInput.value;
  let valid = true;

  if (!email) { setFieldError(emailInput, 'Enter your email address.'); valid = false; }
  else if (!EMAIL_RE.test(email)) { setFieldError(emailInput, 'That email address looks incomplete.'); valid = false; }

  if (!password) { setFieldError(passInput, 'Enter your password.'); valid = false; }
  if (!valid) return;

  const button = $('#loginForm button[type="submit"]');
  const label = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Signing you in…';

  try {
    let profile = null;
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      profile = { name: 'Tanishq Khangerwal', email: DEMO_EMAIL, mobile: '9876543210' };
    } else {
      const users = store.get(KEYS.users, []);
      const found = users.find((u) => u.email === email);
      if (found) {
        const hash = await hashPassword(password);
        if (hash === found.passHash) profile = { name: found.name, email: found.email, mobile: found.mobile };
      }
    }

    if (!profile) {
      setFormMsg($('#loginMsg'), "Email or password doesn't match. Try the demo account below.", 'error');
      return;
    }

    saveSession(profile);
    const intent = state.pendingIntent;
    state.pendingIntent = null;
    dismissOverlay($('#authOverlay'));
    toast(`Welcome back, ${getFirstName(profile.name)}.`, 'success');
    startBooking(intent && intent.opts ? intent.opts : {});
  } catch (error) {
    setFormMsg($('#loginMsg'), 'Something went wrong while signing in. Please try again.', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = label;
  }
}

async function handleRegister(event) {
  event.preventDefault();
  clearFormMsg($('#registerMsg'));
  $('#termsErr').textContent = '';

  const nameInput = $('#regName');
  const emailInput = $('#regEmail');
  const mobileInput = $('#regMobile');
  const passInput = $('#regPassword');
  const confirmInput = $('#regConfirm');
  const terms = $('#regTerms');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const mobile = mobileInput.value.replace(/\D/g, '');
  const password = passInput.value;
  const confirm = confirmInput.value;
  let valid = true;

  if (name.length < 2) { setFieldError(nameInput, 'Please enter your full name.'); valid = false; }
  if (!EMAIL_RE.test(email)) { setFieldError(emailInput, 'Enter a valid email address.'); valid = false; }
  if (!PHONE_RE.test(mobile)) { setFieldError(mobileInput, 'Enter a valid 10-digit Indian mobile number.'); valid = false; }
  if (password.length < 8) { setFieldError(passInput, 'Use at least 8 characters.'); valid = false; }
  if (confirm !== password) { setFieldError(confirmInput, 'Passwords do not match.'); valid = false; }
  if (!terms.checked) { $('#termsErr').textContent = 'Please accept the terms to create your account.'; valid = false; }
  if (!valid) return;

  const users = store.get(KEYS.users, []);
  if (email === DEMO_EMAIL || users.some((u) => u.email === email)) {
    setFieldError(emailInput, 'An account with this email already exists.');
    setFormMsg($('#registerMsg'), 'Try signing in instead — or use a different email address.', 'error');
    return;
  }

  const button = $('#registerForm button[type="submit"]');
  const label = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Creating your account…';

  try {
    const passHash = await hashPassword(password);
    const profile = { name, email, mobile, passHash, createdAt: new Date().toISOString() };
    users.push(profile);
    store.set(KEYS.users, users);
    saveSession(profile);
    const intent = state.pendingIntent;
    state.pendingIntent = null;
    $('#registerForm').reset();
    dismissOverlay($('#authOverlay'));
    toast(`Welcome, ${getFirstName(name)}. Your account is ready.`, 'success');
    startBooking(intent && intent.opts ? intent.opts : {});
  } catch (error) {
    setFormMsg($('#registerMsg'), 'We could not create your account. Please try again.', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = label;
  }
}

/* --------------------------------------------------------------------------
   Doctor portal
   -------------------------------------------------------------------------- */

function openDoctorPortal() {
  openOverlay($('#doctorOverlay'));
  if (currentDoctorSession()) {
    showDoctorDashboard();
  } else {
    showDoctorLogin();
  }
}

function showDoctorLogin() {
  $('#doctorDashView').hidden = true;
  $('#doctorLoginView').hidden = false;
  clearFieldErrors($('#doctorForm'));
  clearFormMsg($('#doctorMsg'));
}

function showDoctorDashboard() {
  $('#doctorLoginView').hidden = true;
  $('#doctorDashView').hidden = false;
  renderDashboard();
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function handleDoctorLogin(event) {
  event.preventDefault();
  clearFormMsg($('#doctorMsg'));

  const idInput = $('#docId');
  const nameInput = $('#docName');
  const deptInput = $('#docDept');
  const codeInput = $('#docCode');

  const id = idInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();
  const dept = deptInput.value;
  const code = codeInput.value.trim();
  let valid = true;

  if (!id) { setFieldError(idInput, 'Enter your Doctor ID.'); valid = false; }
  if (!name) { setFieldError(nameInput, 'Enter your full name.'); valid = false; }
  if (!dept) { setFieldError(deptInput, 'Select your department.'); valid = false; }
  if (!code) { setFieldError(codeInput, 'Enter your access code.'); valid = false; }
  if (!valid) return;

  const doctor = DOCTORS.find((d) => d.docId.toUpperCase() === id);

  if (!doctor) {
    setFieldError(idInput, 'No consultant found with this Doctor ID.');
    setFormMsg($('#doctorMsg'), 'Please check your credentials and try again.', 'error');
    return;
  }
  if (normalizeName(doctor.name) !== normalizeName(name)) {
    setFieldError(nameInput, "Name doesn't match this Doctor ID.");
    return;
  }
  if (dept !== doctor.dept) {
    setFieldError(deptInput, 'Department does not match this Doctor ID.');
    return;
  }
  if (code !== DOCTOR_CODE && code.toLowerCase() !== 'manthan') {
    setFieldError(codeInput, 'Incorrect access code.');
    setFormMsg($('#doctorMsg'), 'The demo access code is 1234.', 'error');
    return;
  }

  state.doctor = { id: doctor.id, docId: doctor.docId, name: doctor.name, dept: doctor.dept };
  store.set(KEYS.doctor, state.doctor);
  showDoctorDashboard();
  toast(`Welcome, ${doctor.name}. Your schedule is live.`, 'success');
}

function fillDoctorDemo() {
  $('#docId').value = 'MP-DOC-1042';
  $('#docName').value = 'Dr. Aarav Mehta';
  $('#docDept').value = 'Cardiology';
  $('#docCode').value = '1234';
  clearFieldErrors($('#doctorForm'));
  clearFormMsg($('#doctorMsg'));
  $('#docId').focus();
}

function doctorSignOut() {
  state.doctor = null;
  store.remove(KEYS.doctor);
  showDoctorLogin();
  toast('Signed out of the clinical portal.', 'info');
}

/* --------------------------------------------------------------------------
   Booking — open, reset, steps
   -------------------------------------------------------------------------- */

function startBooking(opts = {}) {
  if (!state.user) {
    state.pendingIntent = { type: 'booking', opts };
    openAuth('login');
    toast('Sign in or create an account to book your appointment.', 'info');
    return;
  }
  state.pendingIntent = null;
  resetBooking(opts);
  openOverlay($('#bookingOverlay'));
}

function resetBooking(opts = {}) {
  state.timers.forEach((timer) => window.clearTimeout(timer));
  state.timers = [];

  let careId = opts.careId || null;
  let doctorId = opts.doctorId || null;
  let care = CARE_TYPES.find((c) => c.id === careId) || null;
  let doctor = DOCTORS.find((d) => d.id === doctorId) || null;

  if (doctor && !care) {
    careId = doctor.defaultCare;
    care = CARE_TYPES.find((c) => c.id === careId) || null;
  }
  if (!doctor) doctorId = null;
  if (!care) careId = null;

  state.booking = { careId, doctorId, date: null, slot: null };
  state.step = 1;
  state.docFilter = doctorId ? 'all' : 'recommended';
  state.pin = '';
  state.pinOpen = false;
  state.pinBusy = false;
  state.authing = false;
  state.payRef = '';
  state.lastBooking = null;
  state.payMethod = 'gpay';

  $$('input[name="payMethod"]').forEach((input) => {
    input.checked = input.value === 'gpay';
    input.closest('.method').classList.toggle('active', input.checked);
  });

  const patientName = $('#pName');
  const patientPhone = $('#pPhone');
  if (patientName) patientName.value = state.user ? state.user.name : '';
  if (patientPhone) patientPhone.value = state.user ? state.user.mobile : '';
  if ($('#pAge')) $('#pAge').value = '';
  if ($('#pNotes')) $('#pNotes').value = '';
  clearFieldErrors($('#patientForm'));
  ['pName', 'pAge', 'pPhone', 'pNotes'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) setFieldError(input, '');
  });

  resetPaymentViews();
  renderCareTypes();
  renderBookingDoctors();
  renderSchedule();
  renderReview();
  updateTotals();

  let start = 1;
  if (careId && doctorId) start = 3;
  else if (careId) start = 2;
  goStep(start);
}

function goStep(step) {
  state.step = step;
  if (step === 1) renderCareTypes();
  if (step === 2) renderBookingDoctors();
  if (step === 3) renderSchedule();
  if (step === 4) renderReview();
  if (step === 5) preparePayment();
  renderStep();
}

function renderStep() {
  $$('.bstep').forEach((section) => {
    section.hidden = Number(section.dataset.step) !== state.step;
  });

  const activeDot = Math.min(state.step, 4);
  $$('.step').forEach((dot) => {
    const index = Number(dot.dataset.stepDot);
    const done = state.step === 6 || index < activeDot;
    dot.classList.toggle('done', done);
    dot.classList.toggle('active', !done && index === activeDot);
  });

  updateBookingChrome();

  const body = $('#bookingBody');
  if (body) body.scrollTop = 0;
}

function updateBookingChrome() {
  const foot = $('#bookingFoot');
  if (foot) foot.hidden = state.step === 6 || state.authing || state.pinOpen;
  const next = $('#bookNext');
  if (next) next.hidden = state.step >= 5;
  const back = $('#bookBack');
  if (back) back.hidden = state.step <= 1 || state.pinOpen || state.authing;
}

function resetPaymentViews() {
  $('#payMethodView').hidden = false;
  $('#paymentSummary').hidden = false;
  $('#pinView').hidden = true;
  $('#authView').hidden = true;
}

function preparePayment() {
  state.pin = '';
  state.pinOpen = false;
  state.pinBusy = false;
  state.authing = false;
  state.payRef = `MP-APPT-${Math.floor(1000 + Math.random() * 9000)}`;
  $('#payRef').textContent = state.payRef;
  resetPaymentViews();
  renderPaymentSummary();
  updateTotals();
}

function validateStep(step) {
  const care = currentCare();
  const doctor = currentDoctor();

  if (step === 1 && !care) {
    toast('Choose a care type to continue.', 'error');
    return false;
  }
  if (step === 2 && !doctor) {
    toast('Choose a specialist to continue.', 'error');
    return false;
  }
  if (step === 3) {
    if (!state.booking.date) { toast('Pick a date for your visit.', 'error'); return false; }
    if (!state.booking.slot) { toast('Pick a time slot to continue.', 'error'); return false; }
  }
  if (step === 4) {
    let valid = true;
    const name = $('#pName').value.trim();
    const phone = $('#pPhone').value.replace(/\D/g, '');
    if (name.length < 2) { setFieldError($('#pName'), 'Please enter the patient name.'); valid = false; }
    if (!PHONE_RE.test(phone)) { setFieldError($('#pPhone'), 'Enter a valid 10-digit mobile number.'); valid = false; }
    if (!valid) {
      toast('Please complete the patient details.', 'error');
      return false;
    }
  }
  return true;
}

function nextStep() {
  if (state.step >= 5) return;
  if (!validateStep(state.step)) return;
  goStep(state.step + 1);
}

function previousStep() {
  if (state.step <= 1) return;
  if (state.step === 5) {
    closePin();
    goStep(4);
    return;
  }
  goStep(state.step - 1);
}

function selectCare(id) {
  const care = CARE_TYPES.find((c) => c.id === id);
  if (!care) return;
  state.booking.careId = id;
  if (state.booking.doctorId && !care.doctors.includes(state.booking.doctorId)) {
    state.booking.doctorId = null;
  }
  state.booking.date = null;
  state.booking.slot = null;
  renderCareTypes();
  renderBookingDoctors();
  renderSchedule();
  updateTotals();
}

function selectDoctor(id) {
  if (!DOCTORS.some((d) => d.id === id)) return;
  state.booking.doctorId = id;
  renderBookingDoctors();
  renderSchedule();
  updateTotals();
}

function selectDate(iso) {
  state.booking.date = iso;
  state.booking.slot = null;
  renderSchedule();
}

function selectSlot(slot) {
  state.booking.slot = slot;
  renderSchedule();
}

/* --------------------------------------------------------------------------
   Payment — UPI PIN and authentication
   -------------------------------------------------------------------------- */

function openPin() {
  if (!currentCare() || !currentDoctor()) return;
  state.pin = '';
  state.pinOpen = true;
  state.pinBusy = false;
  state.authing = false;
  $('#payMethodView').hidden = true;
  $('#paymentSummary').hidden = true;
  $('#pinView').hidden = false;
  $('#authView').hidden = true;
  renderPinBoxes();
  updateBookingChrome();
}

function closePin() {
  if (state.pinBusy || state.authing) return;
  state.pinOpen = false;
  state.pin = '';
  $('#pinView').hidden = true;
  $('#payMethodView').hidden = false;
  $('#paymentSummary').hidden = false;
  renderPinBoxes();
  updateBookingChrome();
}

function renderPinBoxes() {
  $$('#pinBoxes span').forEach((box, index) => {
    box.classList.toggle('filled', index < state.pin.length);
    box.classList.toggle('active', index === state.pin.length && state.pin.length < 4);
  });
}

function pressPinKey(key) {
  if (state.pinBusy || state.authing) return;
  if (key === 'del') {
    state.pin = state.pin.slice(0, -1);
    renderPinBoxes();
    playClick();
    return;
  }
  if (!/^\d$/.test(key) || state.pin.length >= 4) return;
  state.pin += key;
  renderPinBoxes();
  playClick();
  if (state.pin.length === 4) {
    const timer = window.setTimeout(startAuthentication, 340);
    state.timers.push(timer);
  }
}

function startAuthentication() {
  if (state.pinBusy || state.pin.length !== 4) return;
  state.pinBusy = true;
  state.authing = true;
  $('#pinView').hidden = true;
  $('#authView').hidden = false;
  updateBookingChrome();

  const bar = $('#authView .auth-progress i');
  if (bar) {
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
  }

  $('#authStep1').innerHTML = `${icon('i-check')} PIN verified`;
  $('#authStep2').innerHTML = `<span class="tiny-spinner"></span> Confirming slot`;
  $('#authStep3').innerHTML = `<span class="tiny-spinner"></span> Issuing receipt`;
  $('#authNote').textContent = 'Contacting your bank…';

  const t1 = window.setTimeout(() => {
    $('#authNote').textContent = 'Verifying your UPI PIN…';
  }, 1000);
  const t2 = window.setTimeout(() => {
    $('#authNote').textContent = 'Confirming your appointment slot…';
    $('#authStep2').innerHTML = `${icon('i-check')} Slot confirmed`;
  }, 1900);
  const t3 = window.setTimeout(() => {
    $('#authNote').textContent = 'Securing your booking…';
    $('#authStep3').innerHTML = `${icon('i-check')} Receipt ready`;
  }, 2700);
  state.timers.push(t1, t2, t3);

  const timer = window.setTimeout(finishPayment, 3000);
  state.timers.push(timer);
}

function finishPayment() {
  state.timers.forEach((timer) => window.clearTimeout(timer));
  state.timers = [];
  state.pinBusy = false;
  state.authing = false;
  state.pinOpen = false;

  const care = currentCare();
  const doctor = currentDoctor();
  if (!care || !doctor || !state.user) return;

  const booking = {
    id: `MP-${state.booking.date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    userEmail: state.user.email,
    userName: state.user.name,
    patient: ($('#pName').value.trim() || state.user.name),
    phone: $('#pPhone').value.replace(/\D/g, ''),
    age: $('#pAge').value,
    notes: $('#pNotes').value.trim(),
    careId: care.id,
    careName: care.name,
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorDocId: doctor.docId,
    specialty: doctor.specialty,
    date: state.booking.date,
    slot: state.booking.slot,
    amount: bookingTotal(),
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  const bookings = store.get(KEYS.bookings, []);
  bookings.push(booking);
  store.set(KEYS.bookings, bookings);
  state.lastBooking = booking;

  renderSuccess(booking);
  goStep(6);

  const timer = window.setTimeout(() => {
    playSuccessSound();
    fireConfetti();
  }, 200);
  state.timers.push(timer);
}

/* --------------------------------------------------------------------------
   Calendar, receipt, visits
   -------------------------------------------------------------------------- */

function buildICS(booking) {
  const { h, m } = slotTo24(booking.slot);
  const start = new Date(`${booking.date}T${pad(h)}:${pad(m)}:00+05:30`);
  const end = new Date(start.getTime() + 30 * 60000);
  const stamp = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const escapeICS = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Manthan Pharma//Appointment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@manthanpharma.health`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeICS(`${booking.careName} · MANTHAN PHARMA`)}`,
    `DESCRIPTION:${escapeICS(`Booking ${booking.id} with ${booking.doctorName}. Patient: ${booking.patient}. Amount paid: ₹${booking.amount}.`)}`,
    'LOCATION:MANTHAN PHARMA\\, 12 Wellness Avenue\\, Indiranagar\\, Bengaluru 560038',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function addToCalendar(booking) {
  if (!booking) { toast('No appointment selected.', 'error'); return; }
  downloadBlob(buildICS(booking), `${booking.id}.ics`, 'text/calendar;charset=utf-8');
  toast('Calendar invite downloaded. Open it to add the visit.', 'success');
}

function buildReceipt(booking) {
  return [
    'MANTHAN PHARMA',
    'Hospital · Pharmacy · Diagnostics',
    '12 Wellness Avenue, Indiranagar, Bengaluru 560038',
    '1800 200 300 · care@manthanpharma.health',
    '',
    'APPOINTMENT RECEIPT',
    '------------------------------------------------------------',
    `Booking ID     : ${booking.id}`,
    `Status         : ${booking.status}`,
    `Patient        : ${booking.patient}`,
    `Care           : ${booking.careName}`,
    `Specialist     : ${booking.doctorName} (${booking.doctorDocId})`,
    `Date           : ${formatDateLong(booking.date)}`,
    `Time           : ${booking.slot}`,
    `Amount paid    : ₹${booking.amount}`,
    `Payment method : UPI · Google Pay (demo)`,
    `Booked on      : ${new Date(booking.createdAt).toLocaleString('en-IN')}`,
    '------------------------------------------------------------',
    'This is a computer-generated receipt for a demonstration booking.',
    'Free rescheduling up to 4 hours before your appointment.',
    '',
    'Thank you for trusting MANTHAN PHARMA.'
  ].join('\n');
}

function downloadReceipt(booking) {
  if (!booking) { toast('No appointment selected.', 'error'); return; }
  downloadBlob(buildReceipt(booking), `${booking.id}-receipt.txt`, 'text/plain;charset=utf-8');
  toast('Receipt downloaded.', 'success');
}

function openVisits() {
  if (!state.user) {
    openAuth('login');
    toast('Sign in to see your appointments.', 'info');
    return;
  }
  renderVisits();
  openOverlay($('#visitsOverlay'));
}
