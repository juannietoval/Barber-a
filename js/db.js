// ==========================================================================
// CAPA DE BASE DE DATOS ADAPTABLE (SUPABASE + LOCALSTORAGE FALLBACK)
// ==========================================================================

import { CONFIG } from './config.js';

class DatabaseService {
  constructor() {
    this.supabaseClient = null;
    this.isSupabaseEnabled = false;
    this.STORAGE_KEYS = {
      BOOKINGS: 'level_barbershop_bookings',
      BLOCKED: 'level_barbershop_blocked_slots',
      PROFILE: 'level_barbershop_user_profile',
      SERVICES: 'level_barbershop_services'
    };
  }

  // Inicializar cliente (conecta con Supabase si hay credenciales configuradas)
  init() {
    const customConfig = JSON.parse(localStorage.getItem('barber_custom_config') || '{}');
    const sbUrl = customConfig.supabaseUrl || CONFIG.supabase.url;
    const sbKey = customConfig.supabaseKey || CONFIG.supabase.anonKey;

    if (sbUrl && sbKey && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(sbUrl, sbKey);
        this.isSupabaseEnabled = true;
        console.log('✓ Base de datos: Conectado a Supabase en la nube.');
      } catch (err) {
        console.warn('! Error al conectar Supabase, usando LocalStorage fallback:', err);
        this.isSupabaseEnabled = false;
      }
    } else {
      console.log('ℹ Modo Local: Usando LocalStorage de alta fidelidad.');
    }

    // Inicializar datos iniciales en LocalStorage si no existen
    if (!localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) {
      this._seedInitialBookings();
    }
  }

  // 1. Obtener Servicios
  async getServices() {
    if (this.isSupabaseEnabled) {
      const { data, error } = await this.supabaseClient
        .from('servicios')
        .select('*')
        .eq('activo', true)
        .order('id');
      if (!error && data && data.length > 0) return data;
    }
    return CONFIG.services;
  }

  // 2. Obtener Barberos
  async getBarbers() {
    if (this.isSupabaseEnabled) {
      const { data, error } = await this.supabaseClient
        .from('barberos')
        .select('*')
        .eq('activo', true)
        .order('id');
      if (!error && data && data.length > 0) return data;
    }
    return CONFIG.barbers;
  }

  // 3. Consultar disponibilidad de horas (para un barbero en una fecha)
  async getOccupiedSlots(barberId, date) {
    if (!date) return [];

    let occupiedTimes = [];

    if (this.isSupabaseEnabled) {
      try {
        // Consultar reservas activas en Supabase
        let query = this.supabaseClient
          .from('reservas')
          .select('hora')
          .eq('fecha', date)
          .neq('estado', 'CANCELADA');

        if (barberId) {
          query = query.eq('barbero_id', barberId);
        }

        const { data: apts, error: aptErr } = await query;
        if (!aptErr && apts) {
          occupiedTimes = apts.map(a => a.hora);
        }

        // Consultar bloqueos de horarios
        let blockQuery = this.supabaseClient
          .from('bloqueos_horario')
          .select('hora')
          .eq('fecha', date);

        if (barberId) {
          blockQuery = blockQuery.eq('barbero_id', barberId);
        }

        const { data: blocks, error: blkErr } = await blockQuery;
        if (!blkErr && blocks) {
          occupiedTimes = [...occupiedTimes, ...blocks.map(b => b.hora)];
        }

        return [...new Set(occupiedTimes)];
      } catch (err) {
        console.error('Error consultando Supabase, usando fallback:', err);
      }
    }

    // Fallback: LocalStorage
    const allBookings = this._getLocal(this.STORAGE_KEYS.BOOKINGS) || [];
    const allBlocks = this._getLocal(this.STORAGE_KEYS.BLOCKED) || [];

    allBookings.forEach(b => {
      if (b.status !== 'CANCELADA' && b.date === date) {
        if (!barberId || b.barberId == barberId) {
          occupiedTimes.push(b.time);
        }
      }
    });

    allBlocks.forEach(blk => {
      if (blk.date === date) {
        if (!barberId || blk.barberId == barberId) {
          occupiedTimes.push(blk.time);
        }
      }
    });

    return [...new Set(occupiedTimes)];
  }

  // 4. Crear nueva reserva
  async createBooking(booking) {
    if (this.isSupabaseEnabled) {
      try {
        const { data, error } = await this.supabaseClient
          .from('reservas')
          .insert([{
            codigo: booking.code,
            cliente_nombre: booking.clientName,
            cliente_telefono: booking.clientPhone,
            cliente_email: booking.clientEmail,
            barbero_id: booking.barberId,
            servicio_id: booking.serviceId,
            fecha: booking.date,
            hora: booking.time,
            precio: booking.price,
            notas: booking.notes,
            estado: booking.status || 'CONFIRMADA'
          }])
          .select();

        if (error) throw error;
        // También guardar copia local para redundancia
        this._addLocal(this.STORAGE_KEYS.BOOKINGS, booking);
        return { success: true, data: data[0] };
      } catch (err) {
        console.error('Error insertando en Supabase:', err);
      }
    }

    // Guardado Local
    this._addLocal(this.STORAGE_KEYS.BOOKINGS, booking);
    return { success: true, data: booking };
  }

  // 5. Obtener lista de reservas (con filtros opcionales)
  async getBookings(filters = {}) {
    if (this.isSupabaseEnabled) {
      try {
        let query = this.supabaseClient
          .from('reservas')
          .select('*, barberos(nombre, titulo, imagen), servicios(nombre, precio, duracion)')
          .order('fecha', { ascending: false });

        if (filters.barberId && filters.barberId !== 'ALL') {
          query = query.eq('barbero_id', filters.barberId);
        }
        if (filters.status && filters.status !== 'ALL') {
          query = query.eq('estado', filters.status);
        }
        if (filters.date) {
          query = query.eq('fecha', filters.date);
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.error('Error leyendo Supabase:', err);
      }
    }

    // LocalStorage
    let list = this._getLocal(this.STORAGE_KEYS.BOOKINGS) || [];

    if (filters.barberId && filters.barberId !== 'ALL') {
      list = list.filter(b => b.barberId == filters.barberId);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(b => b.status === filters.status);
    }
    if (filters.date) {
      list = list.filter(b => b.date === filters.date);
    }

    // Ordenar de más reciente a más antigua
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  // 6. Actualizar estado de una reserva
  async updateBookingStatus(bookingId, newStatus) {
    if (this.isSupabaseEnabled) {
      await this.supabaseClient
        .from('reservas')
        .update({ estado: newStatus })
        .eq('codigo', bookingId);
    }

    const list = this._getLocal(this.STORAGE_KEYS.BOOKINGS) || [];
    const idx = list.findIndex(b => b.code === bookingId || b.id === bookingId);
    if (idx !== -1) {
      list[idx].status = newStatus;
      this._setLocal(this.STORAGE_KEYS.BOOKINGS, list);
    }
    return true;
  }

  // 7. Eliminar / Cancelar reserva
  async deleteBooking(bookingId) {
    if (this.isSupabaseEnabled) {
      await this.supabaseClient
        .from('reservas')
        .delete()
        .eq('codigo', bookingId);
    }

    let list = this._getLocal(this.STORAGE_KEYS.BOOKINGS) || [];
    list = list.filter(b => b.code !== bookingId && b.id !== bookingId);
    this._setLocal(this.STORAGE_KEYS.BOOKINGS, list);
    return true;
  }

  // 8. Bloquear horario (Admin)
  async blockSlot(blockData) {
    if (this.isSupabaseEnabled) {
      await this.supabaseClient
        .from('bloqueos_horario')
        .insert([{
          barbero_id: blockData.barberId,
          fecha: blockData.date,
          hora: blockData.time,
          motivo: blockData.reason
        }]);
    }

    const blocks = this._getLocal(this.STORAGE_KEYS.BLOCKED) || [];
    blocks.push(blockData);
    this._setLocal(this.STORAGE_KEYS.BLOCKED, blocks);
    return true;
  }

  // 9. Perfil de Usuario
  getUserProfile() {
    return this._getLocal(this.STORAGE_KEYS.PROFILE) || {
      name: 'Juan Silva',
      phone: '3006835915',
      email: 'juan.silva@gmail.com',
      avatarInitial: 'J',
      vipLevel: 'Miembro VIP Gold'
    };
  }

  saveUserProfile(profile) {
    this._setLocal(this.STORAGE_KEYS.PROFILE, profile);
    return true;
  }

  // Métodos auxiliares privados de LocalStorage
  _getLocal(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }

  _setLocal(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  _addLocal(key, item) {
    const list = this._getLocal(key) || [];
    list.unshift(item);
    this._setLocal(key, list);
  }

  _seedInitialBookings() {
    const today = new Date().toISOString().split('T')[0];
    const initial = [
      {
        id: 'LVL-4091',
        code: 'LVL-4091',
        clientName: 'Santiago Vélez',
        clientPhone: '+57 312 890 1234',
        clientEmail: 'santiago.v@gmail.com',
        barberId: 1,
        barberName: 'Alejandro',
        serviceId: 2,
        serviceName: 'Corte Hombre',
        price: 25000,
        date: today,
        time: '11:00 AM',
        status: 'CONFIRMADA',
        createdAt: new Date().toISOString()
      },
      {
        id: 'LVL-4092',
        code: 'LVL-4092',
        clientName: 'Mateo Cárdenas',
        clientPhone: '+57 320 555 4321',
        clientEmail: 'mateo.c@gmail.com',
        barberId: 2,
        barberName: 'David',
        serviceId: 3,
        serviceName: 'Corte con Barba',
        price: 30000,
        date: today,
        time: '02:00 PM',
        status: 'PENDIENTE',
        createdAt: new Date().toISOString()
      }
    ];
    this._setLocal(this.STORAGE_KEYS.BOOKINGS, initial);
  }
}

export const db = new DatabaseService();
