-- ============================================
-- Update asistencias: 4-state attendance + migrate old data
-- ============================================

-- 1. Drop old CHECK constraint
ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_estado_check;

-- 2. Migrate legacy 'Presente' values to 'Presente (Presencial)'
UPDATE asistencias SET estado = 'Presente (Presencial)' WHERE estado = 'Presente';

-- 3. Add new CHECK constraint with 4 states + empty
ALTER TABLE asistencias ADD CONSTRAINT asistencias_estado_check
  CHECK (estado IN ('Presente (Presencial)','Presente (Virtual)','Ausente','Justificado',''));
