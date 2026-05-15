-- ============================================
-- Seguimiento - Schema + Seed para Supabase
-- ============================================

-- 1. TABLAS
-- ============================================

CREATE TABLE IF NOT EXISTS grupos (
  id INT PRIMARY KEY,
  proyecto TEXT NOT NULL,
  comision TEXT,
  practica TEXT NOT NULL DEFAULT 'P2' CHECK (practica IN ('P1','P2','P3','TutoriasPost'))
);

CREATE TABLE IF NOT EXISTS integrantes (
  id SERIAL PRIMARY KEY,
  grupo_id INT REFERENCES grupos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT,
  observacion TEXT
);

CREATE TABLE IF NOT EXISTS encuentros_meta (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  pregunta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS criterios (
  id SERIAL PRIMARY KEY,
  encuentro_meta_id TEXT REFERENCES encuentros_meta(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('FN','DEV','SM')),
  descripcion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluaciones (
  id SERIAL PRIMARY KEY,
  grupo_id INT REFERENCES grupos(id) ON DELETE CASCADE,
  encuentro_meta_id TEXT REFERENCES encuentros_meta(id) ON DELETE CASCADE,
  fn NUMERIC(3,1),
  dev NUMERIC(3,1),
  sm NUMERIC(3,1),
  feedback_fn TEXT DEFAULT '',
  feedback_dev TEXT DEFAULT '',
  feedback_sm TEXT DEFAULT '',
  UNIQUE(grupo_id, encuentro_meta_id)
);

CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  evaluacion_id INT REFERENCES evaluaciones(id) ON DELETE CASCADE,
  integrante_nombre TEXT NOT NULL,
  estado TEXT CHECK (estado IN ('Presente','Ausente','Justificado','')),
  UNIQUE(evaluacion_id, integrante_nombre)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('visitante','alumno','profesor','tutor','profesor_practica','director','admin')),
  nombre TEXT NOT NULL
);

-- 2. RLS (Row Level Security)
-- ============================================

ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuentros_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de solo lectura pública
DROP POLICY IF EXISTS "Public read grupos" ON grupos;
CREATE POLICY "Public read grupos" ON grupos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read integrantes" ON integrantes;
CREATE POLICY "Public read integrantes" ON integrantes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read encuentros" ON encuentros_meta;
CREATE POLICY "Public read encuentros" ON encuentros_meta FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read criterios" ON criterios;
CREATE POLICY "Public read criterios" ON criterios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read evaluaciones" ON evaluaciones;
CREATE POLICY "Public read evaluaciones" ON evaluaciones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read asistencias" ON asistencias;
CREATE POLICY "Public read asistencias" ON asistencias FOR SELECT USING (true);

-- Solo staff puede escribir evaluaciones y asistencias
DROP POLICY IF EXISTS "Staff write evaluaciones" ON evaluaciones;
CREATE POLICY "Staff write evaluaciones" ON evaluaciones 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('profesor_practica','director','admin')
    )
  );

DROP POLICY IF EXISTS "Staff write asistencias" ON asistencias;
CREATE POLICY "Staff write asistencias" ON asistencias 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('profesor_practica','director','admin')
    )
  );

-- Profiles: usuarios solo ven su propio perfil
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Admin puede insertar profiles
DROP POLICY IF EXISTS "Admin insert profiles" ON profiles;
CREATE POLICY "Admin insert profiles" ON profiles 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Staff puede escribir grupos e integrantes
DROP POLICY IF EXISTS "Staff write grupos" ON grupos;
CREATE POLICY "Staff write grupos" ON grupos 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('profesor_practica','director','admin')
    )
  );

DROP POLICY IF EXISTS "Staff write integrantes" ON integrantes;
CREATE POLICY "Staff write integrantes" ON integrantes 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('profesor_practica','director','admin')
    )
  );

-- 3. SEED DATOS
-- ============================================

-- Encuentros
INSERT INTO encuentros_meta (id, nombre, pregunta) VALUES
('E1', 'E1 — Informativo', '¿Cómo vamos a trabajar?'),
('E2', 'E2 — Validación de Dominio', '¿De qué trata esto y tiene sentido el modelo?'),
('E3', 'E3 — Profundización', '¿Está bien construido?'),
('E4', 'E4 — Avance Técnico', '¿Hay algo funcionando?'),
('E5', 'E5 — Integración', '¿Las partes se conectan?'),
('E6', 'E6 — Pre-entrega', '¿Está listo para mostrar?'),
('E7', 'E7 — Presentación Final', '¿Cumplió con lo prometido?')
ON CONFLICT (id) DO NOTHING;

-- Criterios
INSERT INTO criterios (encuentro_meta_id, dimension, descripcion) VALUES
('E1', 'FN', 'Presentación del Proyecto.'),
('E1', 'DEV', 'Presentación del sistema base. Tecnologías elegidas y justificadas.'),
('E1', 'SM', 'Presentación del Sprint 0: equipo, roles, backlog inicial, herramienta.'),
('E2', 'FN', 'Procesos del negocio relevados. Justificación de entidades del DER. Actores identificados.'),
('E2', 'DEV', 'DER con 8-12 entidades. Al menos una entidad transaccional. Relaciones reales.'),
('E2', 'SM', 'Story Map inicial. Template de US definido.'),
('E3', 'FN', 'Casos de uso o flujos funcionales completos.'),
('E3', 'DEV', 'Arquitectura técnica definida. Módulos planificados.'),
('E3', 'SM', 'Sprint 1 planificado con US estimadas.'),
('E4', 'FN', 'Requerimientos actualizados según feedback.'),
('E4', 'DEV', 'Módulo base implementado y demo.'),
('E4', 'SM', 'Retrospectiva Sprint 1. Sprint 2 planificado.'),
('E5', 'FN', 'Escenarios de prueba definidos.'),
('E5', 'DEV', 'Integración de módulos. Base de datos poblada.'),
('E5', 'SM', 'Burndown actualizado. Impedimentos resueltos.'),
('E6', 'FN', 'Manual de usuario borrador.'),
('E6', 'DEV', 'Sistema desplegado o en staging.'),
('E6', 'SM', 'Sprint final planificado.'),
('E7', 'FN', 'Documentación final entregada.'),
('E7', 'DEV', 'Demo completa sin errores críticos.'),
('E7', 'SM', 'Cierre de sprints y lecciones aprendidas.')
ON CONFLICT DO NOTHING;

-- Actualizar grupos existentes a P2 si la columna se acaba de agregar
UPDATE grupos SET practica = 'P2' WHERE practica IS NULL OR practica = '';

-- Grupos
INSERT INTO grupos (id, proyecto, comision, practica) VALUES
(1, 'Teka Manager', '51NMS', 'P2'),
(2, 'SITMAS', '51NMS', 'P2'),
(3, 'YO SOY', '51NMS', 'P2'),
(4, 'NODUS', '51NMS', 'P2'),
(5, 'SocioApp Rancul', '', 'P2'),
(6, 'GeoLocalizacion Biosa', '', 'P2'),
(7, 'Punto Cell', '51', 'P2'),
(8, 'Metalurgica', '51', 'P2'),
(9, 'Condado', '', 'P2'),
(10, 'Salus Aequitas', '', 'P2'),
(11, 'Mapla Joyas', '', 'P2'),
(12, 'Dentisware', '', 'P2'),
(13, 'Arguello Infancias', '', 'P2'),
(14, 'Tamcat', '', 'P2'),
(15, 'Inclusion', '', 'P2'),
(16, 'Daytona Repuesto de Autos', '', 'P2')
ON CONFLICT (id) DO UPDATE SET
  proyecto = EXCLUDED.proyecto,
  comision = EXCLUDED.comision,
  practica = EXCLUDED.practica;

-- Integrantes
INSERT INTO integrantes (grupo_id, nombre, rol, observacion) VALUES
(1, 'Zagales, Mara', 'FN / DEV', NULL),
(1, 'Benetti, Gabriela', 'SM (Scrum Master)', NULL),
(1, 'Pigini, Fernando', 'FN (Análisis)', NULL),
(1, 'Molina, Carlos', 'DEV (Desarrollo)', NULL),
(1, 'Gaitan, Rocio', 'FN (Análisis)', 'Vive en España'),
(2, 'Videla, Juan', 'FN / DEV', NULL),
(2, 'Lopez Diaz, Erika', 'DEV (Desarrollo)', NULL),
(2, 'Rivero, Cristina', 'SM (Scrum Master)', NULL),
(2, 'Cognini, Facundo', 'DEV (Desarrollo)', NULL),
(2, 'Zamora, Ramiro', 'DEV (Desarrollo)', NULL),
(3, 'Herrera Agustin', 'SM (Scrum Master)', NULL),
(3, 'Mantovani, Santiago', 'PO (Product Owner)', NULL),
(3, 'Gallo, Mariana', 'DEV (Desarrollo)', NULL),
(3, 'Armas, Alejandra', 'DEV (Desarrollo)', NULL),
(4, 'Arias, Ayelen', 'DEV / SM', NULL),
(4, 'Arias, Mariana', 'DEV (Desarrollo)', NULL),
(4, 'Cerutti, Franco', 'FN / DEV', NULL),
(4, 'Barros, Claudia', 'FN / DEV', NULL),
(5, 'Emiliano Lafuria', 'SM (Scrum Master)', NULL),
(5, 'Romina Salome', '', NULL),
(5, 'Asis Maleh', '', 'Salió del grupo'),
(5, 'Pereyra Débora Zulema', '', NULL),
(5, 'Fernández Joaquín Tomas', '', NULL),
(5, 'Torralba Silvana Beatriz', '', NULL),
(6, 'Bustamante Danilo', 'SM (Scrum Master)', NULL),
(6, 'Baldironi Tomas', '', NULL),
(6, 'Zurschmittn Maximo', '', NULL),
(6, 'Nieto Samira', '', NULL),
(6, 'Ferrara Melanie', '', 'No cursa más'),
(7, 'Fanara Maximilian', '', NULL),
(7, 'Guerrini Juan Pablo', 'FN (Análisis)', NULL),
(7, 'Sclarandi Leandro Simon', '', NULL),
(7, 'Yona Natan', '', NULL),
(8, 'Noelia Pereyra', 'FN (Análisis)', NULL),
(8, 'Mariana Cepeda', 'SM (Scrum Master)', NULL),
(8, 'Federico Masin', 'DEV (Desarrollo)', NULL),
(8, 'Angel Ceballos', 'DEV (Desarrollo)', NULL),
(9, 'Bustos Pacheco Tomas Ezequiel', 'FN (Análisis)', NULL),
(9, 'Villegas Atoche Dylan Alexis', 'SM (Scrum Master)', NULL),
(9, 'Heredia Maximo', 'DEV (Desarrollo)', NULL),
(9, 'Escudero Mauricio', 'DEV (Desarrollo)', NULL),
(10, 'Samira Nieto', '', NULL),
(10, 'Maximo Zurshmitten', '', NULL),
(10, 'Tomas Baldironi', 'SM (Scrum Master)', NULL),
(10, 'Danilo Bustamente', 'DEV (Desarrollo)', NULL),
(11, 'Fazundo Zambrano', '', NULL),
(11, 'Milagros Cordoba', '', NULL),
(11, 'Belen Insegna', '', NULL),
(11, 'Nazareno Cano', '', NULL),
(11, 'Santiago Castro', '', NULL),
(12, 'Edgar Narvaez Lavalle', '', NULL),
(12, 'Leandro Saiz Zonni', '', NULL),
(12, 'Rodrigo Good Carpio', '', NULL),
(13, 'Lozano Melani', '', NULL),
(13, 'Tolomey Agostina', '', NULL),
(13, 'Galvan Camila Anabel', '', NULL),
(13, 'Marinez Sofia Del Valle', '', NULL),
(13, 'Huansi Jordy', '', NULL),
(14, 'Carballo Juan', '', NULL),
(14, 'Gorosito Ezequiel', '', NULL),
(14, 'Cunningham Luciano', '', NULL),
(14, 'Matias Lopez', '', NULL),
(15, 'Aparicio Fernando', 'DEV (Desarrollo)', NULL),
(15, 'Wlk, Mirko', 'DEV (Desarrollo)', NULL),
(15, 'Del Barrio Sacha', 'FN (Análisis)', NULL),
(15, 'Cochis German', 'FN (Análisis)', NULL),
(15, 'Decalli Mariano', 'SM (Scrum Master)', NULL),
(16, 'Ludueña Sofia', 'DEV / SM', NULL),
(16, 'Pereyra Hernan', 'DEV / SM', NULL)
ON CONFLICT DO NOTHING;

-- 4. EVALUACIONES INICIALES (seed desde datos hardcodeados)
-- ============================================

-- E1
INSERT INTO evaluaciones (grupo_id, encuentro_meta_id, fn, dev, sm, feedback_fn, feedback_dev, feedback_sm) VALUES
(1, 'E1', 10, 10, 10, 'Mueblería. Gestión-Trazabilidad-Ecommerce-Recortes', 'React .Net Sql Server', 'Ok. Viernes'),
(2, 'E1', 10, 10, 10, '', '', 'Martes. OK'),
(3, 'E1', 10, 10, 10, '', '.net - react - n8n - sql server', 'Sabado'),
(4, 'E1', 10, 10, 9, 'Bioingenieria-Mantenimiento-Equipamiento-SoporteVital', 'SQL Server - .net - html-js-css (prob react)', 'Ok')
ON CONFLICT (grupo_id, encuentro_meta_id) DO UPDATE SET
  fn = EXCLUDED.fn, dev = EXCLUDED.dev, sm = EXCLUDED.sm,
  feedback_fn = EXCLUDED.feedback_fn, feedback_dev = EXCLUDED.feedback_dev, feedback_sm = EXCLUDED.feedback_sm;

-- E2
INSERT INTO evaluaciones (grupo_id, encuentro_meta_id, fn, dev, sm, feedback_fn, feedback_dev, feedback_sm) VALUES
(1, 'E2', 10, 10, 10, 'Procesos: 9. Justos', '', ''),
(2, 'E2', 10, 9, 9, '', '', ''),
(3, 'E2', 6, 7, 8, 'Falta gráficos y derivaciones', 'Faltan entidades', 'Falta Story Map'),
(4, 'E2', 6, 7, 8, 'Faltan gráficos', 'Falta armar gráfico', 'Faltó'),
(5, 'E2', 8, 6, 0, 'Procesos sin tomar en los alcances', 'Poca relación entre entidades y procesos', 'No entregaron'),
(7, 'E2', 8, 8, 8, 'Escritos sin gráficos', 'Der algo chico para leerlo bien', 'Podría incorporar más al mvp'),
(8, 'E2', 8, 10, 10, 'No pude ver bien los procesos, solo un resumen', 'Correcto', 'Correcto. Aun creo que se podría agregar un poco más al mvp'),
(9, 'E2', 6, 8, 6, 'Por chat me pasaron solo 4 procesos', 'No me pasan imagen de DER.', 'Por el DER se puede llegar a inferir que no tiene muchas historias'),
(10, 'E2', 9, 8, 4, 'Definidos', 'Justo', 'Cumple pero no se lee, es una captura del Jira'),
(11, 'E2', 8, 8, 10, 'Creo que son pocos y se pueden quedar cortos de requerimientos', 'Justos no se puede leer bien', 'Está correcto. Aunque como derivado de los procesos es algo corto'),
(12, 'E2', 8, 4, 2, 'Procesos correctos pero no se puede apreciar si están bien implementados en el DER', 'DER - El gráfico no corresponde', 'Se presenta un anexo. Pero la imagen no es la de un story map'),
(13, 'E2', 7, 5, 8, 'Redactados', 'No se logra apreciar', 'Está correcta, podría incorporar más cosas al mvp'),
(14, 'E2', 7, 6, 7, '', '', ''),
(15, 'E2', 8, 8, 8, '', '', ''),
(16, 'E2', 4, 4, 4, '', '', '')
ON CONFLICT (grupo_id, encuentro_meta_id) DO UPDATE SET
  fn = EXCLUDED.fn, dev = EXCLUDED.dev, sm = EXCLUDED.sm,
  feedback_fn = EXCLUDED.feedback_fn, feedback_dev = EXCLUDED.feedback_dev, feedback_sm = EXCLUDED.feedback_sm;

-- E3
INSERT INTO evaluaciones (grupo_id, encuentro_meta_id, fn, dev, sm, feedback_fn, feedback_dev, feedback_sm) VALUES
(1, 'E3', 9, 9, 9, '', '', ''),
(2, 'E3', 8, 8, 8, '', '', ''),
(3, 'E3', 5, 6, 6, '', '', ''),
(4, 'E3', 5, 6, 6, '', '', ''),
(6, 'E3', 7, 6, 6, '', '', ''),
(7, 'E3', 5, 6, 7, '', '', ''),
(9, 'E3', 5, 6, 6, '', '', ''),
(11, 'E3', 8, 9, 9, '', '', ''),
(15, 'E3', 9, 8, 9, '', '', ''),
(16, 'E3', 6, 6, 6, '', '', '')
ON CONFLICT (grupo_id, encuentro_meta_id) DO UPDATE SET
  fn = EXCLUDED.fn, dev = EXCLUDED.dev, sm = EXCLUDED.sm,
  feedback_fn = EXCLUDED.feedback_fn, feedback_dev = EXCLUDED.feedback_dev, feedback_sm = EXCLUDED.feedback_sm;

-- E4
INSERT INTO evaluaciones (grupo_id, encuentro_meta_id, fn, dev, sm, feedback_fn, feedback_dev, feedback_sm) VALUES
(6, 'E4', 7, 6, 6, '', '', ''),
(7, 'E4', 9, 9, 10, '', '', ''),
(8, 'E4', 7, 7, 8, '', '', ''),
(9, 'E4', 1, 2, 3, '', '', ''),
(11, 'E4', 4, 5, 5, '', '', '')
ON CONFLICT (grupo_id, encuentro_meta_id) DO UPDATE SET
  fn = EXCLUDED.fn, dev = EXCLUDED.dev, sm = EXCLUDED.sm,
  feedback_fn = EXCLUDED.feedback_fn, feedback_dev = EXCLUDED.feedback_dev, feedback_sm = EXCLUDED.feedback_sm;

-- 5. ASISTENCIAS INICIALES
-- ============================================

-- Helper: insert asistencias for an evaluacion
-- Note: evaluacion_id will be auto-resolved via the unique (grupo_id, encuentro_meta_id)

DO $$
DECLARE
  v_eval_id INT;
BEGIN
  -- E1 asistencias
  SELECT id INTO v_eval_id FROM evaluaciones WHERE grupo_id = 1 AND encuentro_meta_id = 'E1';
  IF FOUND THEN
    INSERT INTO asistencias (evaluacion_id, integrante_nombre, estado) VALUES
    (v_eval_id, 'Zagales, Mara', 'Presente'),
    (v_eval_id, 'Benetti, Gabriela', 'Presente'),
    (v_eval_id, 'Gaitan, Rocio', 'Justificado')
    ON CONFLICT (evaluacion_id, integrante_nombre) DO UPDATE SET estado = EXCLUDED.estado;
  END IF;

  SELECT id INTO v_eval_id FROM evaluaciones WHERE grupo_id = 2 AND encuentro_meta_id = 'E1';
  IF FOUND THEN
    INSERT INTO asistencias (evaluacion_id, integrante_nombre, estado) VALUES
    (v_eval_id, 'Videla, Juan', 'Presente'),
    (v_eval_id, 'Lopez Diaz, Erika', 'Presente'),
    (v_eval_id, 'Rivero, Cristina', 'Presente')
    ON CONFLICT (evaluacion_id, integrante_nombre) DO UPDATE SET estado = EXCLUDED.estado;
  END IF;

  SELECT id INTO v_eval_id FROM evaluaciones WHERE grupo_id = 3 AND encuentro_meta_id = 'E1';
  IF FOUND THEN
    INSERT INTO asistencias (evaluacion_id, integrante_nombre, estado) VALUES
    (v_eval_id, 'Gallo, Mariana', 'Presente'),
    (v_eval_id, 'Armas, Alejandra', 'Presente')
    ON CONFLICT (evaluacion_id, integrante_nombre) DO UPDATE SET estado = EXCLUDED.estado;
  END IF;

  -- E2 asistencias
  SELECT id INTO v_eval_id FROM evaluaciones WHERE grupo_id = 2 AND encuentro_meta_id = 'E2';
  IF FOUND THEN
    INSERT INTO asistencias (evaluacion_id, integrante_nombre, estado) VALUES
    (v_eval_id, 'Videla, Juan', 'Presente'),
    (v_eval_id, 'Lopez Diaz, Erika', 'Presente'),
    (v_eval_id, 'Rivero, Cristina', 'Presente')
    ON CONFLICT (evaluacion_id, integrante_nombre) DO UPDATE SET estado = EXCLUDED.estado;
  END IF;

  SELECT id INTO v_eval_id FROM evaluaciones WHERE grupo_id = 3 AND encuentro_meta_id = 'E2';
  IF FOUND THEN
    INSERT INTO asistencias (evaluacion_id, integrante_nombre, estado) VALUES
    (v_eval_id, 'Gallo, Mariana', 'Presente'),
    (v_eval_id, 'Armas, Alejandra', 'Presente')
    ON CONFLICT (evaluacion_id, integrante_nombre) DO UPDATE SET estado = EXCLUDED.estado;
  END IF;
END $$;
