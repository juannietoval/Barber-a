# Guía de Integración de APIs para el Sistema de Citas

Este documento detalla las opciones y códigos para consumir APIs existentes para **WhatsApp**, **Gmail** y la base de datos **Supabase**.

---

## 1. Integración con WhatsApp

### Opción A: Enlace Dinámico Directo (Sin costo, implementado en el prototipo)
Abre directamente la aplicación de WhatsApp o WhatsApp Web del cliente con el mensaje preformateado hacia el número de la barbería o viceversa:
```javascript
const waUrl = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
window.open(waUrl, '_blank');
```

### Opción B: WhatsApp Cloud API Oficial (Meta for Developers)
Para enviar mensajes automáticos desde el servidor sin interacción manual:
1. Crear cuenta en [Meta for Developers](https://developers.facebook.com/).
2. Configurar la WhatsApp Business Cloud API.
3. Enviar mensaje de plantilla mediante un `POST`:
```javascript
async function sendWhatsAppTemplate(clienteTelefono, bookingCode, fecha, hora) {
  const response = await fetch('https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: clienteTelefono,
      type: 'template',
      template: {
        name: 'confirmacion_cita',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: bookingCode },
              { type: 'text', text: fecha },
              { type: 'text', text: hora }
            ]
          }
        ]
      }
    })
  });
  return await response.json();
}
```

---

## 2. Integración con Gmail / Correo Electrónico

### Opción A: EmailJS (Frontend Directo sin Backend)
Permite enviar correos reales desde el navegador a la cuenta de Gmail del cliente usando tu cuenta de Google:
1. Regístrate gratis en [EmailJS.com](https://www.emailjs.com/).
2. Conecta tu servicio de Gmail.
3. Crea una plantilla de correo (Template).
4. Código para enviar:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
  emailjs.init("TU_USER_PUBLIC_KEY");

  function sendConfirmationEmail(booking) {
    emailjs.send("service_gmail", "template_reserva", {
      client_name: booking.clientName,
      client_email: booking.clientEmail,
      barber_name: booking.barberName,
      service_name: booking.serviceName,
      booking_date: booking.date,
      booking_time: booking.time,
      booking_code: booking.code,
      total_price: booking.price
    }).then(
      response => console.log('Correo enviado con éxito!', response.status),
      error => console.error('Error enviando correo:', error)
    );
  }
</script>
```

### Opción B: Google Apps Script Webhook (Totalmente Gratuito)
Puedes crear un script dentro de tu cuenta de Google que envíe correos directamente mediante `GmailApp.sendEmail()` con una llamada `fetch()`.

---

## 3. Conexión con Supabase

El archivo `supabase-schema.sql` contiene las tablas listas.
Para conectar este prototipo directamente a tu Supabase en `index.html`:
```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script>
  const supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

  // Consultar citas de un barbero en una fecha
  async function fetchOccupiedSlots(barberId, date) {
    const { data, error } = await supabase
      .from('reservas')
      .select('hora')
      .eq('barbero_id', barberId)
      .eq('fecha', date)
      .neq('estado', 'CANCELADA');
    return data ? data.map(d => d.hora) : [];
  }
</script>
```
