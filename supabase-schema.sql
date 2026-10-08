-- ========================================================================
-- SCHEMA DE BASE DE DATOS PARA LEVEL VIP BARBER SHOP (SUPABASE / POSTGRESQL)
-- Compatible 100% con los datos y pantallas de barber_v2
-- ========================================================================

-- 1. Tabla de Barberos
CREATE TABLE IF NOT EXISTS public.barberos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    titulo VARCHAR(100) NOT NULL, -- Ej: 'Master Barber', 'Barber VIP'
    especialidad TEXT,
    telefono VARCHAR(30),
    imagen TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Servicios
CREATE TABLE IF NOT EXISTS public.servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    duracion_minutos INT DEFAULT 40,
    imagen TEXT,
    popular BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Reservas / Citas
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    cliente_nombre VARCHAR(120) NOT NULL,
    cliente_telefono VARCHAR(40) NOT NULL,
    cliente_email VARCHAR(120),
    barbero_id INT REFERENCES public.barberos(id) ON DELETE SET NULL,
    servicio_id INT REFERENCES public.servicios(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora VARCHAR(20) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    notas TEXT,
    estado VARCHAR(30) DEFAULT 'CONFIRMADA', -- PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA
    notificado_whatsapp BOOLEAN DEFAULT FALSE,
    notificado_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Bloqueos de Horario (Almuerzos, Descansos, Ausencias)
CREATE TABLE IF NOT EXISTS public.bloqueos_horario (
    id SERIAL PRIMARY KEY,
    barbero_id INT REFERENCES public.barberos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora VARCHAR(20) NOT NULL,
    motivo VARCHAR(200) DEFAULT 'Descanso o bloqueo administrativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inserción de Datos Iniciales (Barberos oficiales de barber_v2)
INSERT INTO public.barberos (nombre, titulo, especialidad, imagen, telefono) VALUES
('Alejandro', 'Master Barber', 'Degradados precisos, tijera y perfilado milimétrico', 'https://i.pravatar.cc/150?img=11', '573006835915'),
('David', 'Barber VIP', 'Ritual de toalla caliente, vapor de ozono y barba', 'https://i.pravatar.cc/150?img=68', '573006835915'),
('Camilo', 'Especialista', 'Cortes modernos, texturizado y diseño de cejas', 'https://i.pravatar.cc/150?img=33', '573006835915')
ON CONFLICT DO NOTHING;

-- 6. Inserción de Servicios oficiales de barber_v2
INSERT INTO public.servicios (nombre, descripcion, precio, duracion_minutos, imagen, popular) VALUES
('Corte Niño', 'Corte de cabello para niños, con paciencia, cuidado y estilo profesional.', 25000, 35, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4PszUUwdHViEGW3-jeGbe5ehbqk2DbE0M2Q&s', false),
('Corte Hombre', 'Asesoría de imagen, corte a tijera o máquina y peinado con productos profesionales.', 25000, 40, 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600', false),
('Corte con Barba', 'Servicio completo. Incluye ritual de toalla caliente, perfilado y vapor de ozono.', 30000, 60, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600', false),
('Barba', 'Alineación precisa, toalla caliente y aplicación de aceites esenciales para hidratar.', 10000, 30, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600', false),
('Corte con Barba y Cejas', 'La experiencia total: Corte, barba, cejas y mascarilla de limpieza facial negra.', 32000, 75, 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600', true),
('Corte con Cejas', 'Corte impecable de cabello acompañado de un perfilado limpio y detallado de cejas.', 27000, 45, 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&q=80&w=600', false),
('Diseño de Cejas', 'Diseño, perfilado y limpieza de cejas para resaltar la mirada y facciones del rostro.', 10000, 20, 'https://2356021.fs1.hubspotusercontent-na1.net/hubfs/2356021/linea%20en%20la%20ceja%20hombre%20barberia%202.webp', false)
ON CONFLICT DO NOTHING;

-- 7. Políticas de Seguridad RLS (Row Level Security)
ALTER TABLE public.barberos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueos_horario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de barberos activos" ON public.barberos FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública de servicios activos" ON public.servicios FOR SELECT USING (activo = true);
CREATE POLICY "Creación pública de reservas" ON public.reservas FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública de reservas para verificar turnos" ON public.reservas FOR SELECT USING (true);
CREATE POLICY "Lectura pública de bloqueos de horario" ON public.bloqueos_horario FOR SELECT USING (true);
