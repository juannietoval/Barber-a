# LEVEL BARBERSHOP - Sistema de Citas Web

Prototipo web completo y responsive con estética **Dark Luxury** (tonos oscuros y acentos dorados) para agendamiento de turnos, gestión de barberos y notificaciones en tiempo real vía WhatsApp y Gmail.

## 🚀 Cómo probarlo de inmediato

1. Abre el archivo `index.html` con cualquier navegador (doble clic o clic derecho > Abrir con Chrome/Edge).
2. No necesitas instalar dependencias de Node.js ni configurar bases de datos para ver y probar la interacción:
   - Ya cuenta con persistencia local (`localStorage`) que sincroniza en tiempo real.
   - Viene con un botón para cargar datos de prueba (*Mock Data*).

---

## 💎 Características Principales

### 👤 Perfil 1: Modo Cliente (Agendamiento)
- **Selección de Barbero:** Visualiza barbero con foto, especialidad y calificación.
- **Catálogo de Servicios:** Precios y duración estimada de cada servicio (Corte, Barba Spa, Combos).
- **Selector de Fechas Dinámicas:** Calendario con los próximos 14 días.
- **Disponibilidad en Tiempo Real:** Detección automática de horas ocupadas para el barbero y fecha seleccionados.
- **Formulario de Contacto:** Registro de Nombre, WhatsApp, Gmail y Notas.
- **Notificaciones Automáticas:**
  - Envío automático de mensaje estructurado a **WhatsApp**.
  - Preparación de confirmación a **Gmail**.
  - Descarga de evento de calendario compatible con **Google Calendar / Apple Calendar (.ics)**.

### 🛡️ Perfil 2: Modo Barbero / Administrador
- **Dashboard de Métricas:** Citas totales, citas de hoy, ingresos acumulados y citas pendientes.
- **Filtros Avanzados:** Filtrar por barbero, por estado (`Pendiente`, `Confirmada`, `Completada`, `Cancelada`) y por fecha específica.
- **Gestión Rápida:**
  - Cambiar estado de citas al instante.
  - Botón de 1 clic para chatear con el cliente por WhatsApp con mensaje personalizado.
  - Botón de 1 clic para redactar correo a su Gmail.
  - Cancelación y eliminación de citas.
- **Bloqueo de Horarios:** Inhabilitar horas específicas para descansos o almuerzos de cualquier barbero.
- **Exportación:** Exportar todas las citas a formato `.CSV` (Excel).

---

## 🗄️ Estructura del Proyecto

```
barberia-citas/
├── index.html              # Aplicación web completa interactiva
├── supabase-schema.sql     # Script SQL listo para montar la BD en Supabase
├── api-integraciones.md    # Guía detallada de APIs (WhatsApp Cloud API, EmailJS, Supabase)
└── README.md               # Esta documentación
```
