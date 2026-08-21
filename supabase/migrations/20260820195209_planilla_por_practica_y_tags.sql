-- Planilla por práctica + encuentro (criterios FN/DEV/SM)
create table if not exists public.planilla (
  id bigint generated always as identity primary key,
  practica text not null check (practica in ('P1','P2','P3','TutoriasPost')),
  encuentro text not null check (encuentro in ('E1','E2','E3','E4','E5','E6','E7')),
  nombre text not null default '',
  pregunta text not null default '',
  criterio_fn text not null default '',
  criterio_dev text not null default '',
  criterio_sm text not null default '',
  unique (practica, encuentro)
);

alter table public.planilla enable row level security;
create policy "Public read planilla" on public.planilla for select using (true);
create policy "Staff write planilla" on public.planilla for all
  using (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')))
  with check (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')));

-- PP2 = planilla actual (E1..E7)
insert into public.planilla (practica, encuentro, nombre, pregunta, criterio_fn, criterio_dev, criterio_sm) values
('P2','E1','E1 — Informativo','¿Cómo vamos a trabajar?','Presentación del Proyecto.','Presentación del sistema base. Tecnologías elegidas y justificadas.','Presentación del Sprint 0: equipo, roles, backlog inicial, herramienta.'),
('P2','E2','E2 — Validación de Dominio','¿De qué trata esto y tiene sentido el modelo?','Procesos del negocio relevados. Justificación de entidades del DER. Actores identificados.','DER con 8-12 entidades. Al menos una entidad transaccional. Relaciones reales.','Story Map inicial. Template de US definido.'),
('P2','E3','E3 — Datos Base','¿Puedo cargar los datos base del sistema?','Casos de uso. ABMs justificados por actor. Diccionario de datos. Maestras/transaccionales.','ABM completo de TODAS las entidades con persistencia real. Validaciones de integridad.','Sprint 1 documentado. Backlog consistente. Daily meetings. Retrospectiva.'),
('P2','E4','E4 — Identidad del Sistema','¿Puedo entrar y el sistema sabe quién soy?','Diagrama de actores. Cada rol surge de un actor real. Permisos justificados.','Login funcionando. Mínimo 2 roles con vistas distintas. Landing por rol. ABMs previos OK.','Sprint 2 documentado. Roles validados con el cliente. Backlog actualizado.'),
('P2','E5','E5 — Lógica de Negocio','¿El sistema hace lo que dice que hace?','Reglas de negocio documentadas. Diagrama BPMN del proceso principal. Trazabilidad.','Proceso central de punta a punta. Lógica de negocio real. Al menos una automatización.','Sprint 3 documentado. Bloqueos con cliente documentados. Métricas del sprint.'),
('P2','E6','E6 — Casos Borde','¿Qué pasa cuando algo sale mal?','Diagramas de estado. Casos borde desde estados. Lista de excepciones justificadas.','Validaciones reales. Sistema rechaza y explica por qué. Casos borde demostrables.','Sprint 4 documentado. Casos borde validados. Retrospectiva con decisiones concretas.'),
('P2','E7','E7 — Entregables del Sistema','¿El sistema produce algo que el cliente puede llevarse?','Especificación de cada reporte: quién lo pide, para qué decisión, con qué datos.','Reportes/exportaciones funcionando. Datos en info útil. Todo lo anterior en conjunto.','Sprint 5 documentado. Estado honesto del backlog. Plan de entrega a Práctica III.')
on conflict (practica, encuentro) do update set
  nombre = excluded.nombre, pregunta = excluded.pregunta,
  criterio_fn = excluded.criterio_fn, criterio_dev = excluded.criterio_dev, criterio_sm = excluded.criterio_sm;

-- PP3 = planilla nueva (E1..E6)
insert into public.planilla (practica, encuentro, nombre, pregunta, criterio_fn, criterio_dev, criterio_sm) values
('P3','E1','E1 — Herencia y Planificación','¿Qué funcionalidades faltan y qué diferencia a este sistema?','Presenta los Casos de Uso y el borrador de FODA.','Presenta el estado técnico heredado (DER, auditoría, deuda técnica) y el backlog técnico.','Presenta el Story Map y el plan del Sprint N.'),
('P3','E2','E2 — Proceso Real y Casos Borde','¿Qué tan a fondo automatizamos todos los procesos, no solo el camino feliz?','Valida contra el proceso real.','Demuestra el proceso metiendo un caso borde en vivo.','Reporta avance con las estadísticas del sprint.'),
('P3','E3','E3 — Trazabilidad y Dashboards','¿Se puede reconstruir quién hizo qué y cuándo, y el dashboard lo refleja bien?','Certifica que el dashboard responde la pregunta real.','Demuestra trazabilidad con un caso real (auditar una acción concreta hasta el usuario y la hora).','Reporta el backlog de trazabilidad/dashboards y los bugs surgidos en retrospectiva.'),
('P3','E4','E4 — FODA y Diferenciación','¿Qué logra este sistema que el negocio no podría lograr sin él, frente al mercado?','Presenta y defiende el FODA con datos de mercado reales, no supuestos.','Muestra la aplicación consumida y el ejemplo de funcionalidad diferencial.','Confirma que el Backlog de Producto está por debajo del 20% pendiente.'),
('P3','E5','E5 — Cierre Técnico','¿Terminamos de construir, y arrancamos el cierre técnico?','Presenta el backlog cerrado, los Casos de Uso reducidos y el Diagrama de Despliegue actualizado.','Demuestra el sistema funcionalmente completo (procesos, dashboards, API).','Presenta el Story Map final y justifica el punto de corte del grupo; sin este check no avanza al Cierre Técnico.'),
('P3','E6','E6 — Aceptación y Entrega','¿Cómo se sostiene esto en producción y está probado de verdad?','Valida la aceptación con el cliente y presenta los Diagramas de Clases y de Transición de Estados actualizados.','Lidera el testing y aporta la evidencia técnica.','Coordina el cierre, presenta las métricas de cobertura y la Capacitación ejecutada.')
on conflict (practica, encuentro) do update set
  nombre = excluded.nombre, pregunta = excluded.pregunta,
  criterio_fn = excluded.criterio_fn, criterio_dev = excluded.criterio_dev, criterio_sm = excluded.criterio_sm;

-- PP1 y TutoriasPost: copian la estructura de PP2 como plantilla editable
insert into public.planilla (practica, encuentro, nombre, pregunta, criterio_fn, criterio_dev, criterio_sm)
select 'P1', encuentro, nombre, pregunta, criterio_fn, criterio_dev, criterio_sm from public.planilla where practica = 'P2'
on conflict (practica, encuentro) do update set
  nombre = excluded.nombre, pregunta = excluded.pregunta,
  criterio_fn = excluded.criterio_fn, criterio_dev = excluded.criterio_dev, criterio_sm = excluded.criterio_sm;

insert into public.planilla (practica, encuentro, nombre, pregunta, criterio_fn, criterio_dev, criterio_sm)
select 'TutoriasPost', encuentro, nombre, pregunta, criterio_fn, criterio_dev, criterio_sm from public.planilla where practica = 'P2'
on conflict (practica, encuentro) do update set
  nombre = excluded.nombre, pregunta = excluded.pregunta,
  criterio_fn = excluded.criterio_fn, criterio_dev = excluded.criterio_dev, criterio_sm = excluded.criterio_sm;

-- Borrado lógico de grupos
alter table public.grupos add column if not exists activo boolean not null default true;

-- Tags de integrantes (practica + estado)
alter table public.integrantes add column if not exists tags text[] not null default '{}';
