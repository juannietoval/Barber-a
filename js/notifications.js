// ==========================================================================
// MÓDULO DE NOTIFICACIONES: WHATSAPP, GMAIL & CALENDARIO
// ==========================================================================

import { CONFIG, formatCurrency } from './config.js';

export const NotificationService = {

  // 1. WHATSAPP: Mensaje enviado por el Cliente a la Barbería
  sendClientBookingWhatsApp(booking) {
    const formattedPrice = formatCurrency(booking.price);
    const targetNumber = CONFIG.whatsappNumber.replace(/[^0-9]/g, '');

    const message = 
      `💈 *NUEVA RESERVA - ${CONFIG.shopName.toUpperCase()}* 💈%0A%0A` +
      `🔖 *Código:* ${booking.code}%0A` +
      `👤 *Cliente:* ${booking.clientName}%0A` +
      `📱 *Teléfono:* ${booking.clientPhone}%0A` +
      `✂️ *Servicio:* ${booking.serviceName}%0A` +
      `💈 *Barbero Asignado:* ${booking.barberName}%0A` +
      `📅 *Fecha:* ${booking.date}%0A` +
      `⏰ *Hora:* ${booking.time}%0A` +
      `💰 *Total a Pagar:* ${formattedPrice}%0A` +
      (booking.notes ? `📝 *Notas:* ${booking.notes}%0A` : '') +
      `%0A_Hola, acabo de agendar mi turno en la web. ¿Me confirman la disponibilidad en el sistema?_`;

    const url = `https://wa.me/${targetNumber}?text=${message}`;
    window.open(url, '_blank');
    return url;
  },

  // 2. WHATSAPP: Mensaje de confirmación del Barbero al Cliente (Panel Admin)
  sendBarberToClientWhatsApp(booking) {
    const cleanClientPhone = booking.clientPhone.replace(/[^0-9]/g, '');
    const message = 
      `💈 *${CONFIG.shopName.toUpperCase()}* 💈%0A%0A` +
      `¡Hola ${booking.clientName}! 👋%0A` +
      `Te confirmamos que tu cita ha sido *AGENDADA CON ÉXITO*.%0A%0A` +
      `🔖 *Código:* ${booking.code}%0A` +
      `✂️ *Servicio:* ${booking.serviceName}%0A` +
      `💈 *Barbero:* ${booking.barberName}%0A` +
      `📅 *Fecha:* ${booking.date}%0A` +
      `⏰ *Hora:* ${booking.time}%0A` +
      `💰 *Total:* ${formatCurrency(booking.price)}%0A%0A` +
      `📍 *Ubicación:* Calle Principal #12-34%0A` +
      `Te esperamos con 5 minutos de anticipación. ¡Muchas gracias por tu preferencia!`;

    const url = `https://wa.me/${cleanClientPhone}?text=${message}`;
    window.open(url, '_blank');
    return url;
  },

  // 3. GMAIL / CORREO: Generador de Enlace Mailto Prellenado
  openGmailDraft(booking) {
    const clientEmail = booking.clientEmail || CONFIG.shopEmail;
    const subject = encodeURIComponent(`Confirmación de Cita ${booking.code} - ${CONFIG.shopName}`);
    const body = encodeURIComponent(
      `Hola ${booking.clientName},\n\n` +
      `Gracias por reservar en ${CONFIG.shopName}.\n\n` +
      `Detalles de tu cita:\n` +
      `- Código: ${booking.code}\n` +
      `- Servicio: ${booking.serviceName}\n` +
      `- Barbero: ${booking.barberName}\n` +
      `- Fecha: ${booking.date}\n` +
      `- Hora: ${booking.time}\n` +
      `- Total: ${formatCurrency(booking.price)}\n\n` +
      `Si deseas cancelar o reprogramar, por favor comunícate con nosotros por WhatsApp al +${CONFIG.whatsappNumber}.\n\n` +
      `Atentamente,\nEquipo de ${CONFIG.shopName}`
    );

    const mailto = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    return mailto;
  },

  // 4. CALENDARIO: Generar y descargar evento .ICS (Compatible con Google Calendar & iOS)
  downloadCalendarEvent(booking) {
    const [year, month, day] = booking.date.split('-');
    // Estimar horario militar para el archivo ICS
    let hour = parseInt(booking.time.split(':')[0]);
    if (booking.time.includes('PM') && hour !== 12) hour += 12;
    if (booking.time.includes('AM') && hour === 12) hour = 0;
    const hourStr = String(hour).padStart(2, '0');
    const startIso = `${year}${month}${day}T${hourStr}0000`;
    const endIso = `${year}${month}${day}T${String(hour + 1).padStart(2, '0')}0000`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Level VIP Barbershop//Citas//ES',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${booking.code}@levelbarbershop.com`,
      `SUMMARY:Cita: ${booking.serviceName} (${booking.barberName})`,
      `DESCRIPTION:Cita confirmada en ${CONFIG.shopName}. Código: ${booking.code}. Barbero: ${booking.barberName}. Total: ${formatCurrency(booking.price)}`,
      `LOCATION:${CONFIG.shopName}, Calle Principal`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `cita-${booking.code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
