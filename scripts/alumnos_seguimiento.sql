-- =============================================
-- Seguimiento Alumnos - Tabla para Supabase
-- =============================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS alumnos_seguimiento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  nombre_completo TEXT NOT NULL,
  dni TEXT,
  email TEXT,
  telefono TEXT,
  usuario_teams TEXT,
  comision TEXT,
  
  pp2_estado TEXT DEFAULT 'no_cursada'
    CHECK (pp2_estado IN ('no_cursada', 'cursada_no_reg', 'regularizada', 'aprobada', 'debe_recursar')),
  pp2_mes_regularizada TEXT,
  
  pp3_estado TEXT DEFAULT 'no_cursada'
    CHECK (pp3_estado IN ('no_cursada', 'cursada_no_reg', 'regularizada', 'aprobada', 'debe_recursar')),
  pp3_mes_regularizada TEXT,
  
  tiene_proyecto BOOLEAN DEFAULT FALSE,
  proyecto_nombre TEXT,
  proyecto_tutor TEXT,
  buscando_proyecto BOOLEAN DEFAULT FALSE,
  
  tiene_grupo BOOLEAN DEFAULT FALSE,
  grupo_detalle TEXT,
  grupo_miembros_anteriores JSONB DEFAULT '[]',
  buscando_grupo BOOLEAN DEFAULT FALSE,
  
  materias_a_cursar JSONB DEFAULT '[]',
  materias_pendientes JSONB DEFAULT '[]',
  
  estado TEXT DEFAULT 'pendiente_revision'
    CHECK (estado IN ('pendiente_revision', 'habilitado', 'condicional', 'a_recurrir')),
  puede_aspirar BOOLEAN,
  motivo_inhabilitacion TEXT,
  observaciones_admin TEXT,
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busqueda por nombre y comision
CREATE INDEX IF NOT EXISTS idx_alumnos_nombre ON alumnos_seguimiento (nombre_completo);
CREATE INDEX IF NOT EXISTS idx_alumnos_comision ON alumnos_seguimiento (comision);
CREATE INDEX IF NOT EXISTS idx_alumnos_estado ON alumnos_seguimiento (estado);

-- Trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION update_alumnos_seguimiento_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_alumnos_seguimiento ON alumnos_seguimiento;
CREATE TRIGGER trg_update_alumnos_seguimiento
  BEFORE UPDATE ON alumnos_seguimiento
  FOR EACH ROW
  EXECUTE FUNCTION update_alumnos_seguimiento_ts();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE alumnos_seguimiento ENABLE ROW LEVEL SECURITY;

-- Alumnos pueden insertar sus datos (formulario publico)
CREATE POLICY "Alumnos pueden insertar" ON alumnos_seguimiento
  FOR INSERT WITH CHECK (true);

-- Admins pueden leer todo
CREATE POLICY "Admins pueden leer" ON alumnos_seguimiento
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('profesor_practica', 'director', 'admin')
    )
  );

-- Admins pueden modificar
CREATE POLICY "Admins pueden modificar" ON alumnos_seguimiento
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('profesor_practica', 'director', 'admin')
    )
  );

-- Admins pueden eliminar
CREATE POLICY "Admins pueden eliminar" ON alumnos_seguimiento
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('profesor_practica', 'director', 'admin')
    )
  );

-- Si la tabla profiles no tiene la columna role, agregarla:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'visitante';