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
