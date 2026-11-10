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
