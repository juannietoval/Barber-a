// ==========================================================================
// CONFIGURACIÓN CENTRALIZADA - LEVEL VIP BARBERSHOP
// ==========================================================================

export const CONFIG = {
  shopName: 'Level VIP Barber Shop',
  shopSubtitle: 'Tradición & Estilo Urbano',
  whatsappNumber: '573006835915', // Teléfono destino WhatsApp (Colombia)
  shopEmail: 'levelbarbershop@gmail.com',
  currency: 'COP', // Peso colombiano
  currencySymbol: '$',

  // Credenciales de Supabase (Opcional - Si están vacías, usa LocalStorage automáticamente)
  supabase: {
    url: '', // Ej: 'https://xyzcompany.supabase.co'
    anonKey: '' // Tu llave pública anon
  },

  // Horarios de atención diarios
  timeSlots: [
    '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ],

  // Barberos del equipo (Tomados del diseño original)
  barbers: [
    {
      id: 1,
      name: 'Alejandro',
      role: 'Master Barber',
      img: 'https://i.pravatar.cc/150?img=11',
      rating: '4.9 ★',
      specialty: 'Degradados precisos, tijera y perfilado milimétrico'
    },
    {
      id: 2,
      name: 'David',
      role: 'Barber VIP',
      img: 'https://i.pravatar.cc/150?img=68',
      rating: '4.8 ★',
      specialty: 'Ritual de toalla caliente, vapor de ozono y barba'
    },
    {
      id: 3,
      name: 'Camilo',
      role: 'Especialista',
      img: 'https://i.pravatar.cc/150?img=33',
      rating: '5.0 ★',
      specialty: 'Cortes modernos, texturizado y diseño de cejas'
    }
  ],

  // Catálogo de Servicios oficial de barber_v2
  services: [
    { 
      id: 1, 
      name: 'Corte Niño', 
      price: 25000, 
      duration: 35,
      desc: 'Corte de cabello para niños, con paciencia, cuidado y estilo profesional.', 
      icon: 'smile', 
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4PszUUwdHViEGW3-jeGbe5ehbqk2DbE0M2Q&s',
      popular: false 
    },
    { 
      id: 2, 
      name: 'Corte Hombre', 
      price: 25000, 
      duration: 40,
      desc: 'Asesoría de imagen, corte a tijera o máquina y peinado con productos profesionales.', 
      icon: 'scissors', 
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600',
      popular: false 
    },
    { 
      id: 3, 
      name: 'Corte con Barba', 
      price: 30000, 
      duration: 60,
      desc: 'Servicio completo. Incluye ritual de toalla caliente, perfilado y vapor de ozono.', 
      icon: 'star', 
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600',
      popular: false 
    },
    { 
      id: 4, 
      name: 'Barba', 
      price: 10000, 
      duration: 30,
      desc: 'Alineación precisa, toalla caliente y aplicación de aceites esenciales para hidratar.', 
      icon: 'droplet', 
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
      popular: false 
    },
    { 
      id: 5, 
      name: 'Corte con Barba y Cejas', 
      price: 32000, 
      duration: 75,
      desc: 'La experiencia total: Corte, barba, cejas y mascarilla de limpieza facial negra.', 
      icon: 'crown', 
      image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600',
      popular: true 
    },
    { 
      id: 6, 
      name: 'Corte con Cejas', 
      price: 27000, 
      duration: 45,
      desc: 'Corte impecable de cabello acompañado de un perfilado limpio y detallado de cejas.', 
      icon: 'eye', 
      image: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&q=80&w=600',
      popular: false 
    },
    { 
      id: 7, 
      name: 'Diseño de Cejas', 
      price: 10000, 
      duration: 20,
      desc: 'Diseño, perfilado y limpieza de cejas para resaltar la mirada y facciones del rostro.', 
      icon: 'sparkles', 
      image: 'https://2356021.fs1.hubspotusercontent-na1.net/hubfs/2356021/linea%20en%20la%20ceja%20hombre%20barberia%202.webp',
      popular: false 
    }
  ]
};

// Formateador de moneda en pesos colombianos
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}
