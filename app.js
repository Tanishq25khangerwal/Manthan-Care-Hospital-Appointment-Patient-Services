/* ==========================================================================
   MANTHAN PHARMA — application logic
   Auth · Booking · GPay-style demo checkout · Doctor portal · Visits
   No external libraries.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   Tiny helpers
   -------------------------------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const pad = (n) => String(n).padStart(2, '0');
const icon = (name) => `<svg class="ico"><use href="#${name}"></use></svg>`;

const escapeHTML = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* storage blocked — demo still works for this session */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }
};

const KEYS = {
  users: 'mp_users_v1',
  session: 'mp_session_v1',
  bookings: 'mp_bookings_v1',
  doctor: 'mp_doctor_session_v1'
};

const PLATFORM_FEE = 29;
const DEMO_EMAIL = 'tanishq@manthan.health';
const DEMO_PASSWORD = 'manthan123';
const DOCTOR_CODE = '1234';

/* --------------------------------------------------------------------------
   Catalog data
   -------------------------------------------------------------------------- */

const CARE_TYPES = [
  {
    id: 'general',
    name: 'General Consultation',
    price: 899,
    tag: 'Same-day',
    icon: 'i-stethoscope',
    dur: '20 min consult',
    desc: 'In-clinic or video consult with a physician, prescription and one free follow-up.',
    meta: ['Clinic / video', 'Free follow-up'],
    doctors: ['vikram', 'sara', 'rohan', 'kabir']
  },
  {
    id: 'fullbody',
    name: 'Full Body Checkup',
    price: 2499,
    tag: '68 tests',
    icon: 'i-activity',
    dur: '2–3 hours',
    desc: 'A complete baseline across heart, liver, kidney, thyroid, sugar and vitamins.',
    meta: ['68 parameters', 'Reports in 24h'],
    doctors: ['vikram', 'sara']
  },
  {
    id: 'cardiac',
    name: 'Cardiac Screening',
    price: 3499,
    tag: 'Heart',
    icon: 'i-heart',
    dur: '3 hours',
    desc: 'ECG, 2D echo, treadmill test and a cardiologist review of your risk profile.',
    meta: ['ECG + Echo', 'Cardiologist'],
    doctors: ['aarav']
  },
  {
    id: 'dental',
    name: 'Dental Care',
    price: 799,
    icon: 'i-tooth',
    dur: '45 min',
    desc: 'Consultation, scaling and a clear, no-pressure treatment plan for healthier teeth.',
    meta: ['Scaling', 'Painless care'],
    doctors: ['isha']
  },
  {
    id: 'mother',
    name: 'Mother & Child',
    price: 1499,
    icon: 'i-baby',
    dur: '60 min',
    desc: 'Antenatal check, growth scan review or a paediatric consult — for every stage.',
    meta: ['Gynae + Paeds', 'Same-day'],
    doctors: ['meera', 'ananya']
  },
  {
    id: 'eye',
    name: 'Eye & Vision',
    price: 699,
    icon: 'i-eye',
    dur: '40 min',
    desc: 'A full eye exam with refraction, retinal screening and practical expert advice.',
    meta: ['Vision test', 'Retina check'],
    doctors: ['neel', 'tara']
  },
  {
    id: 'imaging',
    name: 'Diagnostics & Imaging',
    price: 1899,
    icon: 'i-scan',
    dur: '90 min',
    desc: 'MRI, CT, ultrasound or digital X-ray with same-day radiologist reporting.',
    meta: ['3T MRI', 'Report in 24h'],
    doctors: ['tara', 'neel']
  },
  {
    id: 'executive',
    name: 'Executive Health',
    price: 4999,
    tag: 'Premium',
    icon: 'i-stethoscope',
    dur: 'One day',
    desc: 'A 120-parameter assessment with same-day physician review and a 30-day follow-up.',
    meta: ['120 parameters', 'Physician review'],
    doctors: ['vikram', 'aarav', 'sara']
  },
  {
    id: 'ent',
    name: 'ENT Consultation',
    price: 899,
    tag: 'Ear · Nose · Throat',
    icon: 'i-ear',
    dur: '30 min',
    desc: 'Sinus, hearing, voice and sleep concerns reviewed with on-site endoscopy if needed.',
    meta: ['Endoscopy', 'Same-day'],
    doctors: ['naina', 'vikram']
  },
  {
    id: 'gastro',
    name: 'Gastro Care',
    price: 1299,
    tag: 'Digestive',
    icon: 'i-activity',
    dur: '40 min',
    desc: 'Acidity, IBS, liver health and digestive concerns with a gastroenterologist.',
    meta: ['Liver profile', 'Diet plan'],
    doctors: ['aditya', 'vikram']
  },
  {
    id: 'mental',
    name: 'Mental Health',
    price: 1499,
    tag: 'Confidential',
    icon: 'i-brain',
    dur: '50 min',
    desc: 'A private, unhurried session for anxiety, sleep, burnout or low mood. No judgement.',
    meta: ['100% private', 'Therapy plan'],
    doctors: ['farah']
  },
  {
    id: 'physio',
    name: 'Physiotherapy',
    price: 999,
    icon: 'i-bone',
    dur: '45 min',
    desc: 'Back, neck, sports or post-surgery rehab with a movement assessment and home plan.',
    meta: ['Movement scan', 'Rehab plan'],
    doctors: ['dev', 'rohan']
  },
  {
    id: 'diabetes',
    name: 'Diabetes & Hormones',
    price: 1999,
    tag: 'HbA1c',
    icon: 'i-pill',
    dur: '60 min',
    desc: 'Sugar control, thyroid and hormonal health with a physician-led management plan.',
    meta: ['HbA1c + TSH', 'Care plan'],
    doctors: ['riya', 'vikram']
  },
  {
    id: 'nutrition',
    name: 'Nutrition & Lifestyle',
    price: 799,
    icon: 'i-heart',
    dur: '40 min',
    desc: 'A practical, food-first plan for weight, energy, PCOS or heart health. No crash diets.',
    meta: ['Diet plan', '4-week review'],
    doctors: ['priya', 'sara']
  }
];

const DOCTORS = [
  {
    id: 'vikram',
    docId: 'MP-DOC-1015',
    name: 'Dr. Vikram Nair',
    specialty: 'General Medicine',
    dept: 'General Medicine',
    exp: 22,
    rating: 4.9,
    reviews: 1820,
    fee: 900,
    featured: true,
    defaultCare: 'general',
    langs: 'English · Hindi · Malayalam',
    next: 'Today · 5:00 PM',
    img: 'assets/doctors/vikram.jpg'
  },
  {
    id: 'aarav',
    docId: 'MP-DOC-1042',
    name: 'Dr. Aarav Mehta',
    specialty: 'Interventional Cardiology',
    dept: 'Cardiology',
    exp: 18,
    rating: 4.9,
    reviews: 1240,
    fee: 1200,
    featured: true,
    defaultCare: 'cardiac',
    langs: 'English · Hindi · Marathi',
    next: 'Today · 4:30 PM',
    img: 'assets/doctors/aarav.jpg'
  },
  {
    id: 'meera',
    docId: 'MP-DOC-1077',
    name: 'Dr. Meera Kapoor',
    specialty: 'Obstetrics & Gynaecology',
    dept: 'Obstetrics & Gynaecology',
    exp: 14,
    rating: 4.8,
    reviews: 980,
    fee: 1000,
    featured: true,
    defaultCare: 'mother',
    langs: 'English · Hindi · Punjabi',
    next: 'Tomorrow · 10:00 AM',
    img: 'assets/doctors/meera.jpg'
  },
  {
    id: 'ananya',
    docId: 'MP-DOC-1108',
    name: 'Dr. Ananya Rao',
    specialty: 'Paediatrics & Child Health',
    dept: 'Paediatrics',
    exp: 11,
    rating: 4.9,
    reviews: 760,
    fee: 800,
    featured: true,
    defaultCare: 'mother',
    langs: 'English · Kannada · Telugu',
    next: 'Today · 6:00 PM',
    img: 'assets/doctors/ananya.jpg'
  },
  {
    id: 'isha',
    docId: 'MP-DOC-1168',
    name: 'Dr. Isha Verma',
    specialty: 'Conservative Dentistry',
    dept: 'Dentistry',
    exp: 9,
    rating: 4.9,
    reviews: 640,
    fee: 700,
    featured: true,
    defaultCare: 'dental',
    langs: 'English · Hindi',
    next: 'Tomorrow · 11:30 AM',
    img: 'assets/doctors/isha.jpg'
  },
  {
    id: 'neel',
    docId: 'MP-DOC-1182',
    name: 'Dr. Neel Joshi',
    specialty: 'Ophthalmology',
    dept: 'Ophthalmology',
    exp: 15,
    rating: 4.8,
    reviews: 870,
    fee: 750,
    featured: true,
    defaultCare: 'eye',
    langs: 'English · Hindi · Gujarati',
    next: 'Today · 3:00 PM',
    img: 'assets/doctors/neel.jpg'
  },
  {
    id: 'sara',
    docId: 'MP-DOC-1141',
    name: 'Dr. Sara Khan',
    specialty: 'Dermatology',
    dept: 'Dermatology',
    exp: 12,
    rating: 4.8,
    reviews: 590,
    fee: 850,
    featured: true,
    defaultCare: 'general',
    langs: 'English · Hindi · Urdu',
    next: 'Tomorrow · 12:00 PM',
    img: 'assets/doctors/sara.jpg'
  },
  {
    id: 'tara',
    docId: 'MP-DOC-1195',
    name: 'Dr. Tara Bose',
    specialty: 'Radiology & Imaging',
    dept: 'Radiology',
    exp: 17,
    rating: 4.9,
    reviews: 510,
    fee: 950,
    featured: true,
    defaultCare: 'imaging',
    langs: 'English · Bengali · Hindi',
    next: 'Today · 2:30 PM',
    img: 'assets/doctors/tara.jpg'
  },
  {
    id: 'rohan',
    docId: 'MP-DOC-1093',
    name: 'Dr. Rohan Iyer',
    specialty: 'Orthopaedics',
    dept: 'Orthopaedics',
    exp: 16,
    rating: 4.8,
    reviews: 720,
    fee: 950,
    featured: false,
    defaultCare: 'physio',
    langs: 'English · Tamil · Hindi',
    next: 'Tomorrow · 9:30 AM',
    img: 'assets/doctors/rohan.jpg'
  },
  {
    id: 'kabir',
    docId: 'MP-DOC-1125',
    name: 'Dr. Kabir Shah',
    specialty: 'Neurology',
    dept: 'Neurology',
    exp: 20,
    rating: 4.9,
    reviews: 910,
    fee: 1100,
    featured: false,
    defaultCare: 'general',
    langs: 'English · Hindi · Marathi',
    next: 'Tomorrow · 3:30 PM',
    img: 'assets/doctors/kabir.jpg'
  },
  {
    id: 'naina',
    docId: 'MP-DOC-1210',
    name: 'Dr. Naina Reddy',
    specialty: 'ENT & Sleep Medicine',
    dept: 'ENT',
    exp: 13,
    rating: 4.8,
    reviews: 540,
    fee: 850,
    featured: false,
    defaultCare: 'ent',
    langs: 'English · Telugu · Hindi',
    next: 'Today · 1:30 PM',
    img: 'assets/doctors/naina.jpg'
  },
  {
    id: 'aditya',
    docId: 'MP-DOC-1234',
    name: 'Dr. Aditya Menon',
    specialty: 'Gastroenterology',
    dept: 'Gastroenterology',
    exp: 15,
    rating: 4.9,
    reviews: 680,
    fee: 1050,
    featured: false,
    defaultCare: 'gastro',
    langs: 'English · Malayalam · Hindi',
    next: 'Tomorrow · 11:00 AM',
    img: 'assets/doctors/aditya.jpg'
  },
  {
    id: 'farah',
    docId: 'MP-DOC-1248',
    name: 'Dr. Farah Siddiqui',
    specialty: 'Psychiatry & Mental Health',
    dept: 'Mental Health',
    exp: 12,
    rating: 4.9,
    reviews: 430,
    fee: 1500,
    featured: false,
    defaultCare: 'mental',
    langs: 'English · Hindi · Urdu',
    next: 'Today · 7:00 PM',
    img: 'assets/doctors/farah.jpg'
  },
  {
    id: 'dev',
    docId: 'MP-DOC-1262',
    name: 'Dr. Dev Malhotra',
    specialty: 'Physiotherapy & Rehabilitation',
    dept: 'Physiotherapy',
    exp: 10,
    rating: 4.8,
    reviews: 390,
    fee: 700,
    featured: false,
    defaultCare: 'physio',
    langs: 'English · Hindi · Punjabi',
    next: 'Today · 4:00 PM',
    img: 'assets/doctors/dev.jpg'
  },
  {
    id: 'riya',
    docId: 'MP-DOC-1276',
    name: 'Dr. Riya Deshpande',
    specialty: 'Endocrinology & Diabetes',
    dept: 'Endocrinology',
    exp: 14,
    rating: 4.9,
    reviews: 610,
    fee: 1000,
    featured: false,
    defaultCare: 'diabetes',
    langs: 'English · Marathi · Hindi',
    next: 'Tomorrow · 10:30 AM',
    img: 'assets/doctors/riya.jpg'
  },
  {
    id: 'priya',
    docId: 'MP-DOC-1290',
    name: 'Dr. Priya Sharma',
    specialty: 'Clinical Nutrition',
    dept: 'Nutrition',
    exp: 9,
    rating: 4.8,
    reviews: 350,
    fee: 650,
    featured: false,
    defaultCare: 'nutrition',
    langs: 'English · Hindi · Kannada',
    next: 'Today · 5:30 PM',
    img: 'assets/doctors/priya.jpg'
  }
];

const SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
];

const DEPARTMENTS = [...new Set(DOCTORS.map((d) => d.dept))];

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */

const state = {
  user: store.get(KEYS.session, null),
  doctor: store.get(KEYS.doctor, null),
  pendingIntent: null,
  booking: { careId: null, doctorId: null, date: null, slot: null },
  step: 1,
  docFilter: 'recommended',
  homeDept: 'all',
  navFor: 'me',
  navUrgency: 1,
  pin: '',
  pinOpen: false,
  pinBusy: false,
  authing: false,
  payMethod: 'gpay',
  payRef: '',
  lastBooking: null,
  authTab: 'login',
  timers: []
};

if (state.user && (!state.user.email || !state.user.name)) state.user = null;
if (state.doctor && !DOCTORS.some((d) => d.id === state.doctor.id)) state.doctor = null;

let revealObserver = null;
let audioCtx = null;

/* --------------------------------------------------------------------------
   Small utilities
   -------------------------------------------------------------------------- */

const todayISO = () => isoDate(new Date());

function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDateLong(iso) {
  if (!iso) return '—';
  return parseISODate(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatDateShort(iso) {
  if (!iso) return '—';
  return parseISODate(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function nextDates(count = 12) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

function slotTo24(slot) {
  const [time, period] = String(slot).split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return { h, m };
}

function hashStr(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function isSlotFree(doctorId, iso, slot) {
  return hashStr(`${doctorId || 'clinic'}|${iso}|${slot}`) % 9 !== 0;
}

function isSlotPassed(iso, slot) {
  if (iso !== todayISO()) return false;
  const { h, m } = slotTo24(slot);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m - 10);
}

function currentCare() {
  return CARE_TYPES.find((c) => c.id === state.booking.careId) || null;
}

function currentDoctor() {
  return DOCTORS.find((d) => d.id === state.booking.doctorId) || null;
}

function bookingTotal() {
  const care = currentCare();
  return care ? care.price + PLATFORM_FEE : 0;
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

function getFirstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'friend';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

/* --------------------------------------------------------------------------
   Sessions / UI sync
   -------------------------------------------------------------------------- */

function saveSession(user) {
  state.user = { name: user.name, email: user.email, mobile: user.mobile };
  store.set(KEYS.session, state.user);
  syncAuthUI();
}

function signOut() {
  state.user = null;
  store.remove(KEYS.session);
  syncAuthUI();
  if ($('#visitsOverlay').classList.contains('open')) dismissOverlay($('#visitsOverlay'));
  toast('You have been signed out. See you soon.', 'info');
}

function syncAuthUI() {
  const loggedIn = !!state.user;
  $$('.auth-only').forEach((el) => { el.hidden = loggedIn; });
  $$('.user-only').forEach((el) => { el.hidden = !loggedIn; });
  if (loggedIn) {
    $('#navUserName').textContent = getFirstName(state.user.name);
    $('#navUserInitials').textContent = getInitials(state.user.name);
    const nameField = $('#pName');
    const phoneField = $('#pPhone');
    if (nameField && !nameField.value) nameField.value = state.user.name || '';
    if (phoneField && !phoneField.value) phoneField.value = state.user.mobile || '';
  }
}

/* --------------------------------------------------------------------------
   Overlay helpers
   -------------------------------------------------------------------------- */

function openOverlay(overlay) {
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
  const target = overlay.querySelector('input:not([type="hidden"]), .overlay-close');
  window.setTimeout(() => {
    if (target && overlay.classList.contains('open')) target.focus({ preventScroll: true });
  }, 360);
}

function closeOverlay(overlay) {
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (!$('.overlay.open')) document.body.classList.remove('locked');
}

function dismissOverlay(overlay) {
  if (!overlay) return;
  if (overlay.id === 'authOverlay') state.pendingIntent = null;
  closeOverlay(overlay);
}

function closeTopOverlay() {
  const open = $$('.overlay.open');
  if (!open.length) return;
  const top = open[open.length - 1];
  if (top.id === 'bookingOverlay' && state.authing) {
    toast('Please wait — your payment is being authenticated.', 'info');
    return;
  }
  dismissOverlay(top);
}

function toast(message, type = 'success') {
  const stack = $('#toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const iconName = type === 'error' ? 'i-close' : type === 'info' ? 'i-clock' : 'i-check';
  el.innerHTML = `${icon(iconName)}<div></div>`;
  el.querySelector('div').textContent = message;
  stack.appendChild(el);
  while (stack.children.length > 3) stack.firstElementChild.remove();
  window.setTimeout(() => {
    el.classList.add('removing');
    window.setTimeout(() => el.remove(), 320);
  }, 3800);
}

function setFormMsg(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message || '';
  element.className = message ? `form-msg show ${type}` : 'form-msg';
}

function clearFormMsg(element) {
  if (!element) return;
  element.textContent = '';
  element.className = 'form-msg';
}

function fieldWrap(input) {
  return input ? input.closest('.field') : null;
}

function setFieldError(input, message) {
  const wrap = fieldWrap(input);
  if (!wrap) return;
  wrap.classList.toggle('has-err', !!message);
  const err = wrap.querySelector('.err');
  if (err) err.textContent = message || '';
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function clearFieldErrors(form) {
  if (!form) return;
  $$('.field', form).forEach((wrap) => wrap.classList.remove('has-err'));
  $$('.err', form).forEach((err) => { err.textContent = ''; });
}

async function hashPassword(password) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    /* fall through to the demo-safe fallback */
  }
  try {
    return btoa(unescape(encodeURIComponent(password)));
  } catch (error) {
    return String(password);
  }
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}
/* --------------------------------------------------------------------------
   Rendering — home doctors
   -------------------------------------------------------------------------- */

const HOME_DEPTS = ['All', 'Cardiology', 'Neurology', 'Orthopaedics', 'Paediatrics', 'Dentistry', 'Dermatology', 'General Medicine', 'Mental Health', 'Nutrition'];

function renderHomeDoctors() {
  const grid = $('#doctorGrid');
  if (!grid) return;

  const filters = $('#doctorFiltersHome');
  if (filters) {
    filters.innerHTML = HOME_DEPTS.map((dept) => `
      <button class="chip${state.homeDept === dept ? ' active' : ''}" type="button"
        data-home-dept="${dept}" aria-pressed="${state.homeDept === dept}">${dept}</button>
    `).join('');
  }

  const list = state.homeDept === 'All' ? DOCTORS : DOCTORS.filter((d) => d.dept === state.homeDept);
  const shown = list.length ? list : DOCTORS;

  grid.innerHTML = shown.map((d) => `
    <article class="doc-card doc-slide">
      <div class="doc-photo">
        <img src="${d.img}" alt="${escapeHTML(d.name)}, ${escapeHTML(d.specialty)}" loading="eager" decoding="async" />
        <span class="doc-badge">${escapeHTML(d.next)}</span>
        <span class="doc-rating">${icon('i-star')} ${d.rating}</span>
        <span class="doc-verified">${icon('i-shield')} Verified</span>
      </div>
      <div class="doc-body">
        <span class="doc-dept">${escapeHTML(d.dept)}</span>
        <h3>${escapeHTML(d.name)}</h3>
        <p>${escapeHTML(d.specialty)} · ${d.exp} yrs</p>
        <div class="doc-tags"><span>${escapeHTML((d.langs || '').split(' · ')[0])}</span><span>${d.reviews} reviews</span></div>
        <div class="doc-foot">
          <span class="doc-fee">${money(d.fee)}<small>consult</small></span>
          <button class="btn btn-glass" type="button" data-book-doctor="${d.id}">Book</button>
        </div>
      </div>
    </article>
  `).join('');

  if (grid.scrollLeft > 0) grid.scrollTo({ left: 0, behavior: 'smooth' });
  updateRailProgress('doctorGrid', 'doctorRailProgress');
  observeNewReveals();
}

function updateRailProgress(railId, barId) {
  const rail = document.getElementById(railId);
  const bar = document.getElementById(barId);
  if (!rail || !bar) return;
  const max = rail.scrollWidth - rail.clientWidth;
  const pct = max > 0 ? (rail.scrollLeft / max) * 100 : 100;
  bar.style.width = `${Math.max(8, Math.min(100, pct))}%`;
}

/* --------------------------------------------------------------------------
   Rendering — care types
   -------------------------------------------------------------------------- */

function renderCareTypes() {
  const grid = $('#careGrid');
  if (!grid) return;
  grid.innerHTML = CARE_TYPES.map((care) => `
    <button class="care-card${state.booking.careId === care.id ? ' selected' : ''}"
      type="button" data-care="${care.id}" aria-pressed="${state.booking.careId === care.id}">
      <div class="care-top">
        <span class="care-icon">${icon(care.icon)}</span>
        ${care.tag ? `<span class="care-tag">${escapeHTML(care.tag)}</span>` : ''}
      </div>
      <h3>${escapeHTML(care.name)}</h3>
      <p>${escapeHTML(care.desc)}</p>
      <div class="care-meta">${care.meta.map((m) => `<span>${escapeHTML(m)}</span>`).join('')}</div>
      <div class="care-bottom">
        <strong>${money(care.price)}</strong>
        <span>${escapeHTML(care.dur)}</span>
      </div>
    </button>
  `).join('');
}

/* --------------------------------------------------------------------------
   Rendering — booking doctors
   -------------------------------------------------------------------------- */

function renderBookingDoctors() {
  const grid = $('#bookingDoctorGrid');
  if (!grid) return;
  const care = currentCare();
  const recommendedIds = care ? care.doctors : [];
  let list = DOCTORS;

  if (care && state.docFilter === 'recommended') {
    list = recommendedIds.map((id) => DOCTORS.find((d) => d.id === id)).filter(Boolean);
    if (!list.length) list = DOCTORS;
  }

  if (state.booking.doctorId && !list.some((d) => d.id === state.booking.doctorId)) {
    state.booking.doctorId = null;
  }

  $('#careChip').innerHTML = care ? `For <strong>${escapeHTML(care.name)}</strong>` : '';

  grid.innerHTML = list.map((d) => {
    const isRecommended = recommendedIds.includes(d.id);
    return `
      <button class="bdoc-card${state.booking.doctorId === d.id ? ' selected' : ''}"
        type="button" data-doctor="${d.id}" aria-pressed="${state.booking.doctorId === d.id}">
        ${isRecommended && state.docFilter === 'all' ? '<span class="rec-tag">Recommended</span>' : ''}
        <img src="${d.img}" alt="${escapeHTML(d.name)}" loading="lazy" />
        <div class="bdoc-main">
          <h3>${escapeHTML(d.name)}</h3>
          <p>${escapeHTML(d.specialty)} · ${d.exp} yrs</p>
          <div class="bdoc-meta">
            <span class="tag">★ ${d.rating}</span>
            <span>${escapeHTML(d.langs)}</span>
          </div>
        </div>
        <div class="bdoc-fee">${money(d.fee)}<small>consult</small></div>
        <span class="bdoc-check">${icon('i-check')}</span>
      </button>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   Summary panel
   -------------------------------------------------------------------------- */

function summaryHTML() {
  const care = currentCare();
  const doc = currentDoctor();
  const date = state.booking.date ? formatDateLong(state.booking.date) : '—';
  const total = bookingTotal();

  return `
    <h3>Booking summary</h3>
    <div class="sum-row"><span>Care</span><strong>${care ? escapeHTML(care.name) : 'Select a care type'}</strong></div>
    <div class="sum-row"><span>Specialist</span><strong>${doc ? escapeHTML(doc.name) : 'Select a doctor'}</strong></div>
    <div class="sum-row"><span>Date</span><strong>${date}</strong></div>
    <div class="sum-row"><span>Time</span><strong>${state.booking.slot || '—'}</strong></div>
    <div class="sum-row"><span>Care fee</span><strong>${care ? money(care.price) : '—'}</strong></div>
    <div class="sum-row"><span>Platform fee</span><strong>${money(PLATFORM_FEE)}</strong></div>
    <div class="sum-total"><span>Total</span><strong>${care ? money(total) : '—'}</strong></div>
    <div class="sum-note">
      ${icon('i-shield')}
      <span>Consultation, digital reports and follow-up reminders are included. Free rescheduling up to 4 hours before your slot.</span>
    </div>
  `;
}

function renderSchedule() {
  const doc = currentDoctor();
  const dates = nextDates(12);

  if (!doc) {
    $('#scheduleDoctor').innerHTML = `<p class="fineprint">Choose a specialist to see availability.</p>`;
    $('#dateScroller').innerHTML = '';
    $('#slotGrid').innerHTML = '';
    $('#scheduleSummary').innerHTML = summaryHTML();
    return;
  }

  if (!state.booking.date) state.booking.date = isoDate(dates[0]);
  if (state.booking.date < todayISO()) state.booking.date = isoDate(dates[0]);

  $('#scheduleDoctor').innerHTML = `
    <img src="${doc.img}" alt="${escapeHTML(doc.name)}" loading="lazy" />
    <div>
      <strong>${escapeHTML(doc.name)}</strong>
      <small>${escapeHTML(doc.specialty)} · ${doc.exp} yrs experience</small>
    </div>
    <span class="mini-fee">${money(doc.fee)}</span>
  `;

  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  $('#dateScroller').innerHTML = dates.map((date, i) => {
    const iso = isoDate(date);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : labels[date.getDay()];
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    return `
      <button class="date-chip${state.booking.date === iso ? ' selected' : ''}" type="button" data-date="${iso}">
        <small>${dayName}</small>
        <strong>${date.getDate()}</strong>
        <em>${month}</em>
      </button>
    `;
  }).join('');

  const dateLabel = formatDateShort(state.booking.date);
  $('#selectedDateLabel').textContent = dateLabel;

  if (state.booking.slot) {
    const stillFree = isSlotFree(doc.id, state.booking.date, state.booking.slot) && !isSlotPassed(state.booking.date, state.booking.slot);
    if (!stillFree) state.booking.slot = null;
  }

  $('#slotGrid').innerHTML = SLOTS.map((slot) => {
    const disabled = !isSlotFree(doc.id, state.booking.date, slot) || isSlotPassed(state.booking.date, slot);
    const selected = state.booking.slot === slot;
    return `
      <button class="slot-btn${selected ? ' selected' : ''}" type="button" data-slot="${slot}"
        ${disabled ? 'disabled' : ''} aria-pressed="${selected}">${slot}</button>
    `;
  }).join('');

  $('#scheduleSummary').innerHTML = summaryHTML();
}

/* --------------------------------------------------------------------------
   Review + payment summary
   -------------------------------------------------------------------------- */

function renderReview() {
  const doc = currentDoctor();
  const care = currentCare();
  const summary = $('#reviewSummary');
  if (!summary) return;

  summary.innerHTML = `
    ${summaryHTML()}
    <div class="sum-row"><span>Patient</span><strong>${escapeHTML($('#pName').value.trim() || state.user?.name || '—')}</strong></div>
    <div class="sum-row"><span>Care type</span><strong>${care ? care.dur : '—'}</strong></div>
    <div class="sum-row"><span>Specialist</span><strong>${doc ? doc.docId : '—'}</strong></div>
    <div class="sum-badge">${icon('i-check')} Instant confirmation after payment</div>
  `;
}

function renderPaymentSummary() {
  const summary = $('#paymentSummary');
  if (!summary) return;
  const care = currentCare();
  const doc = currentDoctor();
  const patient = $('#pName').value.trim() || state.user?.name || 'Patient';

  summary.innerHTML = `
    <h3>Order summary</h3>
    <div class="sum-row"><span>Patient</span><strong>${escapeHTML(patient)}</strong></div>
    <div class="sum-row"><span>Care</span><strong>${care ? escapeHTML(care.name) : '—'}</strong></div>
    <div class="sum-row"><span>Specialist</span><strong>${doc ? escapeHTML(doc.name) : '—'}</strong></div>
    <div class="sum-row"><span>Date &amp; time</span><strong>${state.booking.date ? formatDateShort(state.booking.date) : '—'} · ${state.booking.slot || '—'}</strong></div>
    <div class="sum-row"><span>Care fee</span><strong>${care ? money(care.price) : '—'}</strong></div>
    <div class="sum-row"><span>Platform fee</span><strong>${money(PLATFORM_FEE)}</strong></div>
    <div class="sum-total"><span>Total payable</span><strong>${care ? money(bookingTotal()) : '—'}</strong></div>
    <div class="sum-note">
      ${icon('i-lock')}
      <span>Payment is processed through your bank's secure UPI flow. MANTHAN PHARMA never sees or stores your PIN.</span>
    </div>
    <div class="sum-badge">${icon('i-shield')} Free cancellation up to 4 hours before</div>
  `;
}

/* --------------------------------------------------------------------------
   Totals
   -------------------------------------------------------------------------- */

function updateTotals() {
  const care = currentCare();
  const total = bookingTotal();
  const foot = $('#footTotal');
  if (foot) foot.textContent = care ? money(total) : '₹0';
  const payAmount = $('#payAmount');
  if (payAmount) payAmount.textContent = care ? money(total) : '₹0';
  const payBtnAmount = $('#payBtnAmount');
  if (payBtnAmount) payBtnAmount.textContent = care ? money(total) : '₹0';
  const pinAmount = $('#pinAmount');
  if (pinAmount) pinAmount.textContent = care ? money(total) : '₹0';
  if (care) renderPaymentSummary();
}

/* --------------------------------------------------------------------------
   Success + appointments
   -------------------------------------------------------------------------- */

function renderSuccess(booking) {
  $('#successName').textContent = getFirstName(booking.patient);
  $('#successId').textContent = booking.id;
  $('#successCare').textContent = booking.careName;
  $('#successDoctor').textContent = booking.doctorName;
  $('#successDate').textContent = formatDateLong(booking.date);
  $('#successTime').textContent = booking.slot;
  $('#successPatient').textContent = booking.patient;
  $('#successAmount').textContent = money(booking.amount);
}

function renderVisits() {
  const list = $('#visitsList');
  if (!list) return;
  if (!state.user) {
    list.innerHTML = '';
    return;
  }

  const bookings = store.get(KEYS.bookings, [])
    .filter((b) => String(b.userEmail).toLowerCase() === state.user.email.toLowerCase())
    .sort((a, b) => bookingTimestamp(b) - bookingTimestamp(a));

  if (!bookings.length) {
    list.innerHTML = `
      <div class="visits-empty">
        <span class="empty-icon">${icon('i-calendar')}</span>
        <strong>No appointments yet</strong>
        Your future visits, reports and reminders will live here.<br />
        Book your first appointment — it takes about a minute.
      </div>
    `;
    return;
  }

  list.innerHTML = bookings.map((b) => `
    <article class="visit-card">
      <div class="visit-top">
        <div>
          <h3>${escapeHTML(b.careName)}</h3>
          <p>${escapeHTML(b.doctorName)} · ${escapeHTML(b.specialty || 'Specialist')}</p>
        </div>
        <span class="visit-status">${escapeHTML(b.status || 'Confirmed')}</span>
      </div>
      <div class="visit-meta">
        <span>${icon('i-calendar')} ${formatDateLong(b.date)}</span>
        <span>${icon('i-clock')} ${escapeHTML(b.slot)}</span>
        <span>${icon('i-card')} ${money(b.amount)}</span>
        <span>${icon('i-check')} ${escapeHTML(b.id)}</span>
        <button class="link-btn" type="button" data-ics="${escapeHTML(b.id)}">Add to calendar</button>
      </div>
    </article>
  `).join('');
}

function bookingTimestamp(booking) {
  const { h, m } = slotTo24(booking.slot || '09:00 AM');
  return new Date(`${booking.date}T${pad(h)}:${pad(m)}:00`).getTime();
}

/* --------------------------------------------------------------------------
   Doctor dashboard
   -------------------------------------------------------------------------- */

function renderDashboard() {
  const doctor = currentDoctorSession();
  if (!doctor) return;

  $('#dashName').textContent = doctor.name;
  $('#dashMeta').textContent = `${doctor.docId} · ${doctor.dept}`;

  const bookings = store.get(KEYS.bookings, [])
    .filter((b) => b.doctorId === doctor.id)
    .sort((a, b) => bookingTimestamp(a) - bookingTimestamp(b));

  const today = todayISO();
  const todays = bookings.filter((b) => b.date === today);
  const upcoming = bookings.filter((b) => bookingTimestamp(b) >= Date.now() - 15 * 60000);
  const next = upcoming[0];

  $('#dashToday').textContent = todays.length;
  $('#dashTotal').textContent = bookings.length;
  $('#dashNext').textContent = next ? next.slot.replace(' ', '') : '—';

  const list = $('#dashList');
  if (!bookings.length) {
    list.innerHTML = `
      <div class="dash-empty">
        <strong>No appointments yet</strong>
        Bookings made by patients will appear here instantly.<br />
        Try booking with Dr. ${escapeHTML(doctor.name.replace(/^Dr\.\s*/, ''))} from the patient site.
      </div>
    `;
    return;
  }

  list.innerHTML = bookings.slice(0, 10).map((b) => `
    <div class="dash-item">
      <span class="dash-time">${formatDateShort(b.date).replace(/^[A-Za-z]+,?\s*/, '')}<br />${escapeHTML(b.slot)}</span>
      <div class="dash-item-main">
        <strong>${escapeHTML(b.patient)}</strong>
        <small>${escapeHTML(b.careName)} · ${escapeHTML(b.id)}</small>
      </div>
      <span class="dash-status">${escapeHTML(b.status || 'Confirmed')}</span>
    </div>
  `).join('');
}

function currentDoctorSession() {
  if (!state.doctor) return null;
  return DOCTORS.find((d) => d.id === state.doctor.id) || null;
}
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
