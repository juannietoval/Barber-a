// ==========================================================================
// CONTROLADOR PRINCIPAL DE LA APLICACIÓN (app.js)
// ==========================================================================

import { CONFIG, formatCurrency } from './config.js';
import { db } from './db.js';
import { NotificationService } from './notifications.js';

// --- ESTADO GLOBAL REACTIVO ---
const state = {
  currentScreen: 'services',
  services: [],
  barbers: [],
  selectedService: null,
  selectedBarber: null,
  selectedDate: null,
  selectedTime: null,
  occupiedSlots: [],
  isLoadingSlots: false,
  error: null,
  currentAptTab: 'upcoming', // 'upcoming' o 'history'
  userProfile: null,
  dynamicDays: []
};

// --- INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', async () => {
  db.init();
  state.userProfile = db.getUserProfile();
  state.services = await db.getServices();
  state.barbers = await db.getBarbers();

  generateDynamicDays();
  setupNavigation();
  renderServices();
  renderProfile();
  setupEventListeners();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// ==========================================================================
// 1. GENERACIÓN DINÁMICA DE DÍAS (Calendario siempre actual)
// ==========================================================================
function generateDynamicDays() {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayStr = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    const dayWeek = d.toLocaleDateString('es-ES', { weekday: 'short' });

    days.push({
      num: dayNum,
      abbrev: dayWeek.charAt(0).toUpperCase() + dayWeek.slice(1, 3),
      fullDate: dayStr,
      isToday: i === 0
    });
  }
  state.dynamicDays = days;
}

// ==========================================================================
// 2. NAVEGACIÓN ENTRE PANTALLAS (ANIMACIÓN idéntica a barber_v2)
// ==========================================================================
export function switchScreen(fromId, toId) {
  const fromScreen = document.getElementById(fromId);
  const toScreen = document.getElementById(toId);

  if (!fromScreen || !toScreen) return;

  state.currentScreen = toId.replace('screen-', '');

  // Sincronizar vistas específicas
  if (toId === 'screen-appointments') {
    renderAppointments();
  } else if (toId === 'screen-admin') {
    renderAdminDashboard();
  }

  fromScreen.classList.add('screen-exit');
  toScreen.classList.remove('hidden');
  toScreen.classList.add('screen-enter');

  setTimeout(() => {
    fromScreen.classList.add('hidden');
    fromScreen.classList.remove('screen-exit');
    toScreen.classList.remove('screen-enter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 380);

  if (window.lucide) window.lucide.createIcons();
}

function setupNavigation() {
  // Botones de cabecera
  document.getElementById('btn-profile')?.addEventListener('click', () => switchScreen('screen-services', 'screen-profile'));
  document.getElementById('btn-appointments')?.addEventListener('click', () => switchScreen('screen-services', 'screen-appointments'));
  document.getElementById('btn-admin-access')?.addEventListener('click', () => switchScreen('screen-profile', 'screen-admin'));

  // Botones de regreso
  document.getElementById('btn-back-booking')?.addEventListener('click', () => {
    switchScreen('screen-booking', 'screen-services');
    resetBookingState();
  });
  document.getElementById('btn-back-appointments')?.addEventListener('click', () => switchScreen('screen-appointments', 'screen-services'));
  document.getElementById('btn-back-profile')?.addEventListener('click', () => switchScreen('screen-profile', 'screen-services'));
  document.getElementById('btn-back-admin')?.addEventListener('click', () => switchScreen('screen-admin', 'screen-services'));
  document.getElementById('btn-empty-book')?.addEventListener('click', () => switchScreen('screen-appointments', 'screen-services'));
}

// ==========================================================================
// 3. PANTALLA 1: SERVICIOS
// ==========================================================================
function renderServices() {
  const container = document.getElementById('services-container');
  if (!container) return;

  container.innerHTML = state.services.map((service, index) => `
    <div class="animate-fade-up group bg-white/5 border border-white/5 hover:border-[#F2C94C]/40 rounded-[1.8rem] p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:bg-white/[0.07] backdrop-blur-sm cursor-pointer shadow-lg"
         style="animation-delay: ${index * 0.06}s;"
         onclick="window.appSelectService(${service.id})">
      
      <!-- Imagen y Badges -->
      <div class="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-zinc-900 border border-white/5">
        <img src="${service.image}" alt="${service.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        ${service.popular ? `
          <span class="absolute top-3 right-3 bg-gradient-to-r from-[#F2C94C] to-[#d4af37] text-black text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-wider">
            Popular
          </span>
        ` : ''}
        <span class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-[#F2C94C]"></i> ${service.duration || 40} min
        </span>
      </div>

      <!-- Información del Servicio -->
      <div class="flex-grow">
        <div class="flex justify-between items-baseline mb-2">
          <h3 class="font-bold text-xl text-white group-hover:text-[#F2C94C] transition-colors">${service.name}</h3>
          <span class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F2C94C] to-[#d4af37]">
            ${formatCurrency(service.price)}
          </span>
        </div>
        <p class="text-sm text-gray-400 font-light line-clamp-2 leading-relaxed mb-4">${service.desc}</p>
      </div>

      <!-- Botón de acción -->
      <div class="mt-auto flex items-center justify-between border-t border-white/5 pt-4 group-hover:border-white/10 transition-colors">
        <span class="text-xs text-gray-500 font-medium group-hover:text-[#F2C94C] transition-colors">Reservar este servicio</span>
        <div class="bg-white/5 rounded-full p-2 group-hover:bg-[#F2C94C] group-hover:text-black transition-all duration-300 transform group-hover:-rotate-45">
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.appSelectService = function(serviceId) {
  const service = state.services.find(s => s.id === serviceId);
  if (!service) return;

  state.selectedService = service;
  document.getElementById('header-service-name').innerText = `${service.name} • ${formatCurrency(service.price)}`;
  
  switchScreen('screen-services', 'screen-booking');
  resetBookingState();
  renderBarbers();
};

// ==========================================================================
// 4. PANTALLA 2: RESERVA (PASO A PASO)
// ==========================================================================
function resetBookingState() {
  state.selectedBarber = null;
  state.selectedDate = null;
  state.selectedTime = null;
  state.occupiedSlots = [];
  
  document.getElementById('step-date')?.classList.add('hidden');
  document.getElementById('step-time')?.classList.add('hidden');
  document.getElementById('step-client-data')?.classList.add('hidden');
  
  const footer = document.getElementById('booking-footer');
  if (footer) {
    footer.classList.remove('translate-y-0');
    footer.classList.add('translate-y-full');
  }
}

function renderBarbers() {
  const container = document.getElementById('barbers-container');
  if (!container) return;

  container.innerHTML = state.barbers.map(barber => {
    const isSelected = state.selectedBarber?.id === barber.id;
    return `
      <button type="button" 
              onclick="window.appSelectBarber(${barber.id})"
              class="snap-start shrink-0 flex flex-col items-center p-3 w-28 md:w-32 rounded-2xl transition-all border ${
                isSelected
                  ? 'bg-gradient-to-b from-[#F2C94C]/20 to-transparent border-[#F2C94C] shadow-[0_0_15px_rgba(242,201,76,0.25)]'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
              }">
        <div class="relative w-16 h-16 md:w-20 md:h-20 mb-3">
          <img src="${barber.img}" alt="${barber.name}" class="w-full h-full object-cover rounded-full border-2 ${isSelected ? 'border-[#F2C94C]' : 'border-transparent'}">
          ${isSelected ? `
            <div class="absolute -bottom-1 -right-1 bg-[#F2C94C] rounded-full p-1 shadow-md">
              <i data-lucide="check" class="w-3.5 h-3.5 text-black"></i>
            </div>
          ` : ''}
        </div>
        <span class="font-bold text-sm md:text-base ${isSelected ? 'text-[#F2C94C]' : 'text-white'}">${barber.name}</span>
        <span class="text-[0.65rem] md:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">${barber.role}</span>
      </button>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.appSelectBarber = function(barberId) {
  state.selectedBarber = state.barbers.find(b => b.id === barberId);
  renderBarbers();

  // Desplegar Paso 2 (Fechas)
  const stepDate = document.getElementById('step-date');
  if (stepDate) {
    stepDate.classList.remove('hidden');
    stepDate.classList.add('animate-slide-down');
    renderDays();
    stepDate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

function renderDays() {
  const container = document.getElementById('days-container');
  if (!container) return;

  container.innerHTML = state.dynamicDays.map(day => {
    const isSelected = state.selectedDate === day.fullDate;
    return `
      <button type="button" 
              onclick="window.appSelectDay('${day.fullDate}')"
              class="snap-start shrink-0 flex flex-col items-center justify-center w-[4.5rem] md:w-20 h-24 md:h-28 rounded-2xl transition-all border ${
                isSelected
                  ? 'bg-gradient-to-b from-[#F2C94C] to-[#d4af37] text-black border-[#F2C94C] shadow-[0_0_20px_rgba(242,201,76,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
              }">
        <span class="text-xs md:text-sm uppercase font-semibold tracking-widest ${isSelected ? 'text-black/80' : ''}">${day.abbrev}</span>
        <span class="text-3xl md:text-4xl font-black mt-1">${day.num}</span>
        ${day.isToday ? '<span class="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5">Hoy</span>' : ''}
      </button>
    `;
  }).join('');
}

window.appSelectDay = async function(fullDate) {
  state.selectedDate = fullDate;
  state.selectedTime = null;
  renderDays();

  // Consultar disponibilidad real en BD
  state.isLoadingSlots = true;
  const stepTime = document.getElementById('step-time');
  stepTime?.classList.remove('hidden');
  stepTime?.classList.add('animate-slide-down');

  renderTimes(); // Muestra animación de carga

  try {
    state.occupiedSlots = await db.getOccupiedSlots(state.selectedBarber?.id, fullDate);
  } catch (err) {
    state.error = 'No se pudo sincronizar la disponibilidad con el servidor.';
  } finally {
    state.isLoadingSlots = false;
    renderTimes();
    stepTime?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

function renderTimes() {
  const container = document.getElementById('times-container');
  if (!container) return;

  container.innerHTML = CONFIG.timeSlots.map(time => {
    const isOccupied = state.occupiedSlots.includes(time);
    const isSelected = state.selectedTime === time;

    let baseClass = 'py-3.5 rounded-xl text-sm font-semibold transition-all border tracking-wide flex flex-col items-center justify-center ';
    
    if (isOccupied) {
      baseClass += 'bg-[#111] text-gray-600 border-transparent cursor-not-allowed opacity-60';
      return `
        <button type="button" disabled class="${baseClass}">
          <span class="line-through decoration-gray-600">${time}</span>
          <span class="text-[9px] text-red-500 font-normal">Ocupado</span>
        </button>
      `;
    }

    if (isSelected) {
      baseClass += 'bg-[#F2C94C] text-black border-[#F2C94C] shadow-[0_0_15px_rgba(242,201,76,0.3)] font-bold';
      return `
        <button type="button" onclick="window.appSelectTime('${time}')" class="${baseClass}">
          <span>${time}</span>
          <span class="text-[9px] text-black/80 font-medium">Seleccionado</span>
        </button>
      `;
    }

    baseClass += 'bg-white/5 border-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10';
    return `
      <button type="button" onclick="window.appSelectTime('${time}')" class="${baseClass}">
        <span>${time}</span>
        <span class="text-[9px] text-emerald-400 font-normal">Libre</span>
      </button>
    `;
  }).join('');
}

window.appSelectTime = function(time) {
  state.selectedTime = time;
  renderTimes();

  // Mostrar Paso 4 (Datos del Cliente) y Botón Flotante
  const stepClient = document.getElementById('step-client-data');
  stepClient?.classList.remove('hidden');
  stepClient?.classList.add('animate-slide-down');

  // Llenar datos con perfil previo si existe
  if (state.userProfile) {
    const nameInput = document.getElementById('client-input-name');
    const phoneInput = document.getElementById('client-input-phone');
    const emailInput = document.getElementById('client-input-email');
    if (nameInput && !nameInput.value) nameInput.value = state.userProfile.name || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = state.userProfile.phone || '';
    if (emailInput && !emailInput.value) emailInput.value = state.userProfile.email || '';
  }

  const footer = document.getElementById('booking-footer');
  if (footer) {
    footer.classList.remove('translate-y-full');
    footer.classList.add('translate-y-0');
  }

  stepClient?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// ==========================================================================
// 5. PROCESAR Y CONFIRMAR RESERVA
// ==========================================================================
window.appConfirmBooking = async function() {
  const name = document.getElementById('client-input-name')?.value.trim();
  const phone = document.getElementById('client-input-phone')?.value.trim();
  const email = document.getElementById('client-input-email')?.value.trim();
  const notes = document.getElementById('client-input-notes')?.value.trim();

  if (!state.selectedService || !state.selectedBarber || !state.selectedDate || !state.selectedTime) {
    alert('Por favor completa todos los pasos de la reserva.');
    return;
  }
  if (!name) {
    alert('Por favor ingresa tu nombre completo.');
    document.getElementById('client-input-name')?.focus();
    return;
  }
  if (!phone) {
    alert('Por favor ingresa tu teléfono o WhatsApp.');
    document.getElementById('client-input-phone')?.focus();
    return;
  }

  // Generar Código Único de Cita (Ej. LVL-8392)
  const bookingCode = 'LVL-' + Math.floor(1000 + Math.random() * 9000);

  const booking = {
    id: bookingCode,
    code: bookingCode,
    clientName: name,
    clientPhone: phone,
    clientEmail: email || 'Sin correo',
    barberId: state.selectedBarber.id,
    barberName: state.selectedBarber.name,
    barber: state.selectedBarber,
    serviceId: state.selectedService.id,
    serviceName: state.selectedService.name,
    service: state.selectedService,
    price: state.selectedService.price,
    date: state.selectedDate,
    time: state.selectedTime,
    notes: notes || '',
    status: 'CONFIRMADA',
    createdAt: new Date().toISOString()
  };

  // Guardar en la base de datos
  await db.createBooking(booking);

  // Actualizar perfil local del usuario
  state.userProfile.name = name;
  state.userProfile.phone = phone;
  if (email) state.userProfile.email = email;
  db.saveUserProfile(state.userProfile);

  // Abrir Modal de Confirmación
  showBookingSuccessModal(booking);
};

function showBookingSuccessModal(booking) {
  const modal = document.getElementById('modal-booking-success');
  if (!modal) return;

  document.getElementById('success-code').innerText = booking.code;
  document.getElementById('success-barber').innerText = booking.barberName;
  document.getElementById('success-service').innerText = booking.serviceName;
  document.getElementById('success-datetime').innerText = `${booking.date} a las ${booking.time}`;
  document.getElementById('success-total').innerText = formatCurrency(booking.price);

  // Configurar botones de WhatsApp y Gmail
  const btnWa = document.getElementById('btn-success-wa');
  const btnEmail = document.getElementById('btn-success-email');
  const btnIcs = document.getElementById('btn-success-ics');

  if (btnWa) {
    btnWa.onclick = () => NotificationService.sendClientBookingWhatsApp(booking);
  }
  if (btnEmail) {
    btnEmail.onclick = () => NotificationService.openGmailDraft(booking);
  }
  if (btnIcs) {
    btnIcs.onclick = () => NotificationService.downloadCalendarEvent(booking);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

window.appCloseSuccessModal = function() {
  const modal = document.getElementById('modal-booking-success');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
  switchScreen('screen-booking', 'screen-appointments');
};

// ==========================================================================
// 6. PANTALLA 3: MIS CITAS
// ==========================================================================
async function renderAppointments() {
  const listContainer = document.getElementById('appointments-list');
  const emptyContainer = document.getElementById('appointments-empty');
  if (!listContainer || !emptyContainer) return;

  const bookings = await db.getBookings();
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = bookings.filter(b => {
    if (b.status === 'CANCELADA') return state.currentAptTab === 'history';
    return state.currentAptTab === 'upcoming' ? b.date >= todayStr : b.date < todayStr;
  });

  if (filtered.length === 0) {
    listContainer.classList.add('hidden');
    emptyContainer.classList.remove('hidden');
    document.getElementById('empty-state-text').innerText = state.currentAptTab === 'upcoming'
      ? 'Aún no tienes reservas activas con nuestros barberos.'
      : 'No tienes citas pasadas en tu historial.';
    return;
  }

  listContainer.classList.remove('hidden');
  emptyContainer.classList.add('hidden');

  listContainer.innerHTML = filtered.map((apt, index) => {
    const isUpcoming = state.currentAptTab === 'upcoming' && apt.status !== 'CANCELADA';
    const statusColor = isUpcoming ? 'bg-gradient-to-b from-[#F2C94C] to-[#d4af37]' : 'bg-zinc-600';
    const glowClass = isUpcoming ? 'shadow-[0_0_15px_rgba(242,201,76,0.3)]' : '';
    const badgeText = apt.status || 'Agendada';
    const barberImg = apt.barber?.img || 'https://i.pravatar.cc/150?img=11';

    return `
      <div class="animate-fade-up bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm hover:border-white/20 transition-all"
           style="animation-delay: ${index * 0.08}s;">
        
        <div class="absolute top-0 left-0 w-1.5 h-full ${statusColor} ${glowClass}"></div>
        
        <div class="flex justify-between items-start pl-2">
          <div>
            <span class="text-[10px] font-mono text-[#F2C94C] uppercase tracking-wider font-bold">${apt.code}</span>
            <h4 class="font-bold text-lg md:text-xl text-white tracking-wide mt-0.5">${apt.serviceName}</h4>
            <div class="flex items-center gap-2 mt-1">
              <img src="${barberImg}" class="w-6 h-6 rounded-full border border-white/20 object-cover">
              <span class="text-sm text-gray-400 font-medium">con ${apt.barberName}</span>
            </div>
          </div>
          <span class="text-xs font-semibold px-3 py-1 rounded-full ${isUpcoming ? 'bg-[#F2C94C]/10 text-[#F2C94C] border border-[#F2C94C]/20' : 'bg-white/5 text-gray-400 border border-white/10'}">
            ${badgeText}
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pl-2 pt-2 border-t border-white/5 text-xs">
          <div class="flex items-center gap-4 text-gray-300">
            <span class="flex items-center gap-1.5 font-medium"><i data-lucide="calendar" class="w-4 h-4 text-[#F2C94C]"></i> ${apt.date}</span>
            <span class="flex items-center gap-1.5 font-medium"><i data-lucide="clock" class="w-4 h-4 text-[#F2C94C]"></i> ${apt.time}</span>
          </div>
          <span class="font-black text-white text-base font-display">${formatCurrency(apt.price)}</span>
        </div>

        ${isUpcoming ? `
          <div class="flex items-center justify-end gap-2 pt-1 pl-2">
            <button onclick="window.appCancelBooking('${apt.code}')" class="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
              Cancelar
            </button>
            <button onclick="window.appOpenBookingWhatsApp('${apt.code}')" class="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Avisar WhatsApp
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.appOpenBookingWhatsApp = async function(bookingCode) {
  const bookings = await db.getBookings();
  const apt = bookings.find(b => b.code === bookingCode);
  if (apt) NotificationService.sendClientBookingWhatsApp(apt);
};

window.appCancelBooking = async function(bookingCode) {
  if (confirm(`¿Deseas cancelar la cita ${bookingCode}?`)) {
    await db.updateBookingStatus(bookingCode, 'CANCELADA');
    renderAppointments();
  }
};

// ==========================================================================
// 7. PANTALLA 4: MI PERFIL
// ==========================================================================
function renderProfile() {
  const profile = state.userProfile;
  if (!profile) return;

  const nameEl = document.getElementById('profile-display-name');
  const levelEl = document.getElementById('profile-display-level');
  const avatarEl = document.getElementById('profile-avatar-large');
  const topAvatar = document.getElementById('top-bar-avatar');

  if (nameEl) nameEl.innerText = profile.name || 'Usuario';
  if (levelEl) levelEl.innerText = profile.vipLevel || 'Miembro VIP Gold';
  if (avatarEl) avatarEl.innerText = (profile.name || 'U').charAt(0).toUpperCase();
  if (topAvatar) topAvatar.innerText = (profile.name || 'U').charAt(0).toUpperCase();

  const inputName = document.getElementById('profile-name-input');
  const inputPhone = document.getElementById('profile-phone-input');
  const inputEmail = document.getElementById('profile-email-input');

  if (inputName) inputName.value = profile.name || '';
  if (inputPhone) inputPhone.value = profile.phone || '';
  if (inputEmail) inputEmail.value = profile.email || '';
}

window.appSaveProfile = function(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('profile-name-input')?.value.trim();
  const phone = document.getElementById('profile-phone-input')?.value.trim();
  const email = document.getElementById('profile-email-input')?.value.trim();

  state.userProfile.name = name || 'Usuario';
  state.userProfile.phone = phone || '';
  state.userProfile.email = email || '';

  db.saveUserProfile(state.userProfile);
  renderProfile();
  alert('Perfil actualizado con éxito');
};

// ==========================================================================
// 8. PANTALLA 5: PANEL DE ADMINISTRACIÓN / BARBERO (STAFF)
// ==========================================================================
async function renderAdminDashboard() {
  const bookings = await db.getBookings();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalCount = bookings.length;
  const todayCount = bookings.filter(b => b.date === todayStr && b.status !== 'CANCELADA').length;
  const pendingCount = bookings.filter(b => b.status === 'PENDIENTE').length;
  const revenue = bookings
    .filter(b => b.status === 'CONFIRMADA' || b.status === 'COMPLETADA')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  document.getElementById('admin-stat-total').innerText = totalCount;
  document.getElementById('admin-stat-today').innerText = todayCount;
  document.getElementById('admin-stat-pending').innerText = pendingCount;
  document.getElementById('admin-stat-revenue').innerText = formatCurrency(revenue);

  renderAdminTable();
}

async function renderAdminTable() {
  const tbody = document.getElementById('admin-table-body');
  if (!tbody) return;

  const barberFilter = document.getElementById('admin-filter-barber')?.value || 'ALL';
  const statusFilter = document.getElementById('admin-filter-status')?.value || 'ALL';
  const dateFilter = document.getElementById('admin-filter-date')?.value || '';

  const bookings = await db.getBookings({
    barberId: barberFilter,
    status: statusFilter,
    date: dateFilter
  });

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-gray-500 text-sm">
          No hay reservas que coincidan con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs">
      <td class="py-3.5 px-3 font-mono font-bold text-[#F2C94C]">${b.code}</td>
      <td class="py-3.5 px-3">
        <div class="font-bold text-white">${b.clientName}</div>
        <div class="text-[11px] text-gray-400">${b.clientPhone}</div>
      </td>
      <td class="py-3.5 px-3 font-medium text-gray-300">${b.barberName}</td>
      <td class="py-3.5 px-3 text-gray-300">${b.serviceName}</td>
      <td class="py-3.5 px-3">
        <div class="text-white font-semibold">${b.date}</div>
        <div class="text-[11px] text-[#F2C94C]">${b.time}</div>
      </td>
      <td class="py-3.5 px-3 font-bold text-white">${formatCurrency(b.price)}</td>
      <td class="py-3.5 px-3">
        <select onchange="window.appAdminChangeStatus('${b.code}', this.value)" class="bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-white text-[11px] outline-none">
          <option value="CONFIRMADA" ${b.status === 'CONFIRMADA' ? 'selected' : ''}>Confirmada</option>
          <option value="PENDIENTE" ${b.status === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
          <option value="COMPLETADA" ${b.status === 'COMPLETADA' ? 'selected' : ''}>Completada</option>
          <option value="CANCELADA" ${b.status === 'CANCELADA' ? 'selected' : ''}>Cancelada</option>
        </select>
      </td>
      <td class="py-3.5 px-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <!-- Notificar por WhatsApp al Cliente -->
          <button onclick="window.appAdminNotifyWhatsApp('${b.code}')" title="Confirmar al cliente por WhatsApp" class="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
          </button>
          <!-- Enviar Correo Gmail -->
          <button onclick="window.appAdminNotifyEmail('${b.code}')" title="Enviar Confirmación por Correo" class="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all">
            <i data-lucide="mail" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.appAdminChangeStatus = async function(bookingCode, newStatus) {
  await db.updateBookingStatus(bookingCode, newStatus);
  renderAdminDashboard();
};

window.appAdminNotifyWhatsApp = async function(bookingCode) {
  const bookings = await db.getBookings();
  const b = bookings.find(item => item.code === bookingCode);
  if (b) NotificationService.sendBarberToClientWhatsApp(b);
};

window.appAdminNotifyEmail = async function(bookingCode) {
  const bookings = await db.getBookings();
  const b = bookings.find(item => item.code === bookingCode);
  if (b) NotificationService.openGmailDraft(b);
};

// ==========================================================================
// 9. LISTENERS DE TABS & MODALES
// ==========================================================================
function setupEventListeners() {
  // Tabs en Mis Citas
  const tabUp = document.getElementById('tab-upcoming');
  const tabHist = document.getElementById('tab-history');

  tabUp?.addEventListener('click', () => {
    state.currentAptTab = 'upcoming';
    tabUp.className = 'flex-1 py-2 text-sm font-semibold rounded-lg bg-[#F2C94C] text-black transition-all duration-300 z-10 shadow-[0_2px_10px_rgba(242,201,76,0.3)]';
    tabHist.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-gray-400 hover:text-white transition-all duration-300 z-10';
    renderAppointments();
  });

  tabHist?.addEventListener('click', () => {
    state.currentAptTab = 'history';
    tabHist.className = 'flex-1 py-2 text-sm font-semibold rounded-lg bg-[#F2C94C] text-black transition-all duration-300 z-10 shadow-[0_2px_10px_rgba(242,201,76,0.3)]';
    tabUp.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-gray-400 hover:text-white transition-all duration-300 z-10';
    renderAppointments();
  });

  // Filtros de Admin
  document.getElementById('admin-filter-barber')?.addEventListener('change', renderAdminTable);
  document.getElementById('admin-filter-status')?.addEventListener('change', renderAdminTable);
  document.getElementById('admin-filter-date')?.addEventListener('change', renderAdminTable);

  // Formulario de perfil
  document.getElementById('form-profile')?.addEventListener('submit', window.appSaveProfile);
}
