-- ============================================
-- Etapa 1: Comisiones + Validaciones de Notas
-- ============================================

-- 1. Tabla de comisiones administrable
CREATE TABLE IF NOT EXISTS comisiones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  activa BOOLEAN DEFAULT TRUE
);

-- Comisiones iniciales
INSERT INTO comisiones (id, nombre) VALUES
('51NMS', '51NMS'),
('51NM', '51NM')
ON CONFLICT (id) DO NOTHING;

-- RLS para comisiones
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comisiones" ON comisiones;
CREATE POLICY "Public read comisiones" ON comisiones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff write comisiones" ON comisiones;
CREATE POLICY "Staff write comisiones" ON comisiones 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('profesor_practica','director','admin')
    )
  );

-- 2. Nuevas columnas en evaluaciones para tracking de modificaciones
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS fecha_primera_nota TIMESTAMPTZ;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMPTZ;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS es_modificacion BOOLEAN DEFAULT FALSE;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS override_limite BOOLEAN DEFAULT FALSE;
