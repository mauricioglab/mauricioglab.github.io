-- =============================================
-- Movimiento - Programas + Historial de sesiones
-- Replica el patron de blogs/recursos (RLS admin + lectura publica).
-- programa: una variante de rutina (slot 11/16hs, manana/noche, dia+semana,
-- o fecha concreta para remo/thruster), con config y ejercicios en jsonb.
-- historial: sesiones realizadas por usuario autenticado.
-- =============================================

-- Tabla de programas
CREATE TABLE IF NOT EXISTS public.movimiento_programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidad TEXT NOT NULL CHECK (modalidad IN ('pausas','movilidad','entrenamiento','remo','thruster')),
  selector TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  ejercicios JSONB NOT NULL DEFAULT '[]',
  draft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (modalidad, selector)
);

CREATE INDEX IF NOT EXISTS idx_movimiento_programas_modalidad ON public.movimiento_programas (modalidad, orden);
CREATE INDEX IF NOT EXISTS idx_movimiento_programas_draft ON public.movimiento_programas (draft);

CREATE OR REPLACE FUNCTION public.update_movimiento_programas_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_movimiento_programas ON public.movimiento_programas;
CREATE TRIGGER trg_update_movimiento_programas
  BEFORE UPDATE ON public.movimiento_programas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_movimiento_programas_ts();

-- Tabla de historial (uno por usuario autenticado)
CREATE TABLE IF NOT EXISTS public.movimiento_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  modalidad TEXT NOT NULL CHECK (modalidad IN ('pausas','movilidad','entrenamiento','remo','thruster')),
  selector TEXT NOT NULL DEFAULT '',
  programa_nombre TEXT NOT NULL DEFAULT '',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  completada BOOLEAN NOT NULL DEFAULT TRUE,
  detalle JSONB NOT NULL DEFAULT '{}',
  nota TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimiento_historial_user ON public.movimiento_historial (user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movimiento_historial_modalidad ON public.movimiento_historial (user_id, modalidad, fecha DESC);

-- =============================================
-- RLS Policies - movimiento_programas (patron blogs)
-- =============================================

ALTER TABLE public.movimiento_programas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published movimiento_programas" ON public.movimiento_programas;
CREATE POLICY "Public read published movimiento_programas" ON public.movimiento_programas
  FOR SELECT USING (draft = false);

DROP POLICY IF EXISTS "Admin read all movimiento_programas" ON public.movimiento_programas;
CREATE POLICY "Admin read all movimiento_programas" ON public.movimiento_programas
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin insert movimiento_programas" ON public.movimiento_programas;
CREATE POLICY "Admin insert movimiento_programas" ON public.movimiento_programas
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin update movimiento_programas" ON public.movimiento_programas;
CREATE POLICY "Admin update movimiento_programas" ON public.movimiento_programas
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin delete movimiento_programas" ON public.movimiento_programas;
CREATE POLICY "Admin delete movimiento_programas" ON public.movimiento_programas
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- RLS Policies - movimiento_historial (cada usuario lo suyo, admin todo)
-- =============================================

ALTER TABLE public.movimiento_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User read own movimiento_historial" ON public.movimiento_historial;
CREATE POLICY "User read own movimiento_historial" ON public.movimiento_historial
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User insert own movimiento_historial" ON public.movimiento_historial;
CREATE POLICY "User insert own movimiento_historial" ON public.movimiento_historial
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User update own movimiento_historial" ON public.movimiento_historial;
CREATE POLICY "User update own movimiento_historial" ON public.movimiento_historial
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User delete own movimiento_historial" ON public.movimiento_historial;
CREATE POLICY "User delete own movimiento_historial" ON public.movimiento_historial
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin read all movimiento_historial" ON public.movimiento_historial;
CREATE POLICY "Admin read all movimiento_historial" ON public.movimiento_historial
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
