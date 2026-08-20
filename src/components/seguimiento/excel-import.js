import * as XLSX from 'xlsx';

const ENCUESTA_IDS = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'];

const ASISTENCIA_MAP = {
  'Presente (Presencial)': 'Presente (Presencial)',
  'Presente': 'Presente (Presencial)',
  'Presente (Virtual)': 'Presente (Virtual)',
  'Ausente': 'Ausente',
  'Justificado': 'Justificado',
};

function normalizeAsistencia(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '0' || str === '' || str === '—') return '';
  if (ASISTENCIA_MAP[str]) return ASISTENCIA_MAP[str];
  const lower = str.toLowerCase();
  if (lower.includes('presente') && lower.includes('virtual')) return 'Presente (Virtual)';
  if (lower.includes('presente')) return 'Presente (Presencial)';
  if (lower.includes('justificado')) return 'Justificado';
  if (lower.includes('ausente')) return 'Ausente';
  return '';
}

function sheetToArray(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
}

function cleanStr(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const data = parseWorkbook(wb);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsArrayBuffer(file);
  });
}

function parseWorkbook(wb) {
  const result = {
    grupos: [],
    evaluaciones: [],
    asistencias: [],
  };

  if (wb.SheetNames.includes('Grupos')) {
    result.grupos = parseGruposSheet(wb.Sheets['Grupos']);
  }

  ENCUESTA_IDS.forEach((encId) => {
    if (wb.SheetNames.includes(encId)) {
      const parsed = parseEncuentroSheet(wb.Sheets[encId], encId);
      result.evaluaciones.push(...parsed.evaluaciones);
      result.asistencias.push(...parsed.asistencias);
    }
  });

  return result;
}

function parseGruposSheet(sheet) {
  const rows = sheetToArray(sheet);
  const grupos = [];
  let currentGroup = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const col0 = cleanStr(row[0]);
    const col1 = cleanStr(row[1]);
    const col2 = cleanStr(row[2]);
    const col3 = cleanStr(row[3]);

    // Detect group header: "Grupo N" in col0, project name in col1
    const groupMatch = col0.match(/^Grupo\s+(\d+)$/i);
    if (groupMatch && col1) {
      // Push previous group
      if (currentGroup && currentGroup.proyecto && currentGroup.proyecto !== '0' && currentGroup.proyecto !== '') {
        grupos.push(currentGroup);
      }

      const groupId = parseInt(groupMatch[1], 10);
      const projectParts = col1.split(/[–—]/);
      const proyecto = projectParts[0].trim();
      let comision = projectParts.length > 1 ? projectParts[1].replace(/Comisión:/i, '').trim() : '';
      if (!comision && col2) {
        comision = String(col2);
      }

      currentGroup = {
        id: groupId,
        proyecto: proyecto,
        comision: comision || '',
        practica: 'P2',
        integrantes: [],
      };
      continue;
    }

    // Detect integrante row: has a name in col0 or col1, and it's a numbered row or after "Nombre completo" header
    if (currentGroup && col1 && col1 !== '' && col0 !== '') {
      // Skip headers and empty/separators
      if (col1 === 'Nombre completo' || col1 === '#') continue;
      if (col0 === '#') continue;

      const nombre = col1.trim();
      if (nombre && nombre !== '—' && nombre !== '' && !nombre.startsWith('◀')) {
        const rol = col2 || '';
        const observacion = col3 || '';
        currentGroup.integrantes.push({
          nombre: nombre,
          rol: rol,
          observacion: observacion,
        });
      }
    }
  }

  // Push last group
  if (currentGroup && currentGroup.proyecto && currentGroup.proyecto !== '0' && currentGroup.proyecto !== '') {
    grupos.push(currentGroup);
  }

  return grupos;
}

function parseEncuentroSheet(sheet, encId) {
  const rows = sheetToArray(sheet);
  const evaluaciones = [];
  const asistencias = [];

  let currentGroupId = null;
  let inEvalSection = false;
  let inAsistSection = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const col0 = cleanStr(row[0]);
    const col1 = cleanStr(row[1]);
    const col2 = cleanStr(row[2]);
    const col3 = row[3] !== undefined && row[3] !== null ? row[3] : '';
    const col4 = row[4] !== undefined && row[4] !== null ? row[4] : '';

    // Detect group header: "GRUPO N" pattern
    const groupMatch = col0.match(/^GRUPO\s+(\d+)$/i);
    if (groupMatch) {
      currentGroupId = parseInt(groupMatch[1], 10);
      inEvalSection = false;
      inAsistSection = false;
      continue;
    }

    if (!currentGroupId) continue;

    // Detect evaluation section start
    if (col0.includes('EVALUACIÓN DE DIMENSIONES') || col0.includes('EVALUACIÓN')) {
      inEvalSection = true;
      inAsistSection = false;
      continue;
    }

    // Detect evaluation header row
    if (inEvalSection && (col0 === 'Dimensión' || col0 === 'Dimension')) {
      continue;
    }

    // Detect "Integrante" header row (start of attendance section)
    if (col0 === 'Integrante') {
      inAsistSection = true;
      inEvalSection = false;
      continue;
    }

    // Parse evaluation row: FN/DEV/SM dimension with score
    if (inEvalSection && currentGroupId) {
      const dimLower = col0.toLowerCase();
      let dim = null;
      if (dimLower.startsWith('fn')) dim = 'FN';
      else if (dimLower.startsWith('dev')) dim = 'DEV';
      else if (dimLower.startsWith('sm') || dimLower.startsWith('sm/po')) dim = 'SM';

      if (dim) {
        const puntaje = col2 !== '' ? Number(col2) : null;
        const feedback = cleanStr(col3);

        if (puntaje !== null && !isNaN(puntaje) && puntaje > 0) {
          evaluaciones.push({
            grupo_id: currentGroupId,
            encuentro_meta_id: encId,
            dimension: dim,
            puntaje: puntaje,
            feedback: feedback,
          });
        }
        continue;
      }
    }

    // Parse attendance row: name in col0, role in col1, asistencia in col2
    if (currentGroupId && col0 && col0.trim() !== '' && !col0.startsWith('%') && !col0.startsWith('Nota') && !col0.startsWith('Fecha') && !col0.startsWith('Pregunta')) {
      const nombre = col0.trim();
      const rol = col1.trim();
      const asistRaw = String(col2).trim();
      const observacion = col3 !== '' ? String(col3).trim() : '';

      // Skip if nombre is empty or separator
      if (!nombre || nombre === '—' || nombre === '') continue;
      if (nombre === 'Rol' || nombre === 'Asistencia' || nombre === 'Observaciones') continue;
      if (nombre.startsWith('◀')) continue;

      // Parse asistencia value - could be in col2 or might need different column detection
      const estado = normalizeAsistencia(asistRaw);

      if (estado) {
        asistencias.push({
          grupo_id: currentGroupId,
          encuentro_meta_id: encId,
          integrante_nombre: nombre,
          estado: estado,
        });
      }
    }
  }

  return { evaluaciones, asistencias };
}

export function buildDiff(excelData, currentGrupos, currentData, evalMeta, integrantesByGrupo) {
  const diff = {
    grupos: { added: [], modified: [], unchanged: [] },
    integrantes: { added: [], modified: [], unchanged: [] },
    evaluaciones: { added: [], modified: [], unchanged: [] },
    asistencias: { added: [], modified: [], unchanged: [] },
  };

  const currentGruposMap = new Map(currentGrupos.map(g => [g.id, g]));
  const currentIntegrantesMap = new Map();
  (integrantesByGrupo || []).forEach(i => {
    const key = `${i.grupo_id}::${i.nombre}`;
    currentIntegrantesMap.set(key, i);
  });

  // --- GRUPOS ---
  excelData.grupos.forEach(eg => {
    const existing = currentGruposMap.get(eg.id);
    if (!existing) {
      diff.grupos.added.push(eg);
    } else {
      const changes = [];
      if (eg.proyecto !== existing.proyecto) {
        changes.push({ field: 'proyecto', from: existing.proyecto, to: eg.proyecto });
      }
      if ((eg.comision || '') !== (existing.comision || '')) {
        changes.push({ field: 'comision', from: existing.comision || '', to: eg.comision || '' });
      }
      if (changes.length > 0) {
        diff.grupos.modified.push({ ...eg, changes });
      } else {
        diff.grupos.unchanged.push(eg);
      }
    }
  });

  // --- INTEGRANTES ---
  excelData.grupos.forEach(eg => {
    eg.integrantes.forEach(ei => {
      if (!ei.nombre || ei.nombre.trim() === '' || ei.nombre.trim() === '—') return;
      const key = `${eg.id}::${ei.nombre.trim()}`;
      const existing = currentIntegrantesMap.get(key);
      if (!existing) {
        diff.integrantes.added.push({
          grupo_id: eg.id,
          nombre: ei.nombre.trim(),
          rol: ei.rol || '',
          observacion: ei.observacion || '',
        });
      } else {
        const changes = [];
        if ((ei.rol || '') !== (existing.rol || '')) {
          changes.push({ field: 'rol', from: existing.rol || '', to: ei.rol || '' });
        }
        const existingObs = existing.observacion || existing.obs || '';
        if ((ei.observacion || '') !== existingObs) {
          changes.push({ field: 'observacion', from: existingObs, to: ei.observacion || '' });
        }
        if (changes.length > 0) {
          diff.integrantes.modified.push({
            grupo_id: eg.id,
            nombre: ei.nombre.trim(),
            rol: ei.rol || '',
            observacion: ei.observacion || '',
            changes,
          });
        } else {
          diff.integrantes.unchanged.push({
            grupo_id: eg.id,
            nombre: ei.nombre.trim(),
          });
        }
      }
    });
  });

  // --- EVALUACIONES ---
  // Group evaluaciones by grupo_id + encuentro
  const evalByGrupoEnc = {};
  excelData.evaluaciones.forEach(e => {
    const key = `${e.grupo_id}_${e.encuentro_meta_id}`;
    if (!evalByGrupoEnc[key]) evalByGrupoEnc[key] = {};
    evalByGrupoEnc[key][e.dimension] = { puntaje: e.puntaje, feedback: e.feedback };
  });

  // Build a lookup for current evaluations by grupo+encuentro
  const currentEvalLookup = {};
  Object.keys(currentData).forEach(encId => {
    Object.keys(currentData[encId] || {}).forEach(gId => {
      const gid = parseInt(gId, 10);
      const entry = currentData[encId][gid];
      if (entry && (entry.FN || entry.DEV || entry.SM || entry.fb)) {
        currentEvalLookup[`${gid}_${encId}`] = entry;
      }
    });
  });

  Object.entries(evalByGrupoEnc).forEach(([key, dims]) => {
    const idx = key.indexOf('_');
    const grupoId = parseInt(key.substring(0, idx), 10);
    const encId = key.substring(idx + 1);

    const existingData = currentData[encId]?.[grupoId];
    let allNew = true;
    const changes = [];

    ['FN', 'DEV', 'SM'].forEach(dim => {
      const excelDim = dims[dim];
      if (!excelDim) return;

      const existingVal = existingData?.[dim];
      const existingFb = existingData?.fb?.[dim];

      if (existingVal === undefined || existingVal === null || existingVal === '') {
        changes.push({ dimension: dim, type: 'nota_added', value: excelDim.puntaje });
      } else if (Number(existingVal) !== excelDim.puntaje) {
        allNew = false;
        changes.push({ dimension: dim, type: 'nota_modified', from: Number(existingVal), to: excelDim.puntaje });
      } else {
        allNew = false;
      }

      if (excelDim.feedback && excelDim.feedback.trim()) {
        const fbText = excelDim.feedback.trim();
        const truncLen = 60;
        const truncated = fbText.length > truncLen ? fbText.substring(0, truncLen) + '...' : fbText;
        if (!existingFb || existingFb.trim() === '') {
          changes.push({ dimension: dim, type: 'fb_added', value: truncated, fullValue: fbText });
        } else if (fbText !== existingFb.trim()) {
          const fromTrunc = existingFb.trim().length > truncLen ? existingFb.trim().substring(0, truncLen) + '...' : existingFb.trim();
          changes.push({ dimension: dim, type: 'fb_modified', from: fromTrunc, to: truncated, fullTo: fbText, fullFrom: existingFb.trim() });
        }
      }
    });

    const evalEntry = { grupo_id: grupoId, encuentro_meta_id: encId, dimensions: dims };

    if (!existingData || (!existingData.FN && !existingData.DEV && !existingData.SM)) {
      diff.evaluaciones.added.push(evalEntry);
    } else if (changes.length > 0) {
      diff.evaluaciones.modified.push({ ...evalEntry, changes });
    } else {
      diff.evaluaciones.unchanged.push(evalEntry);
    }
  });

  // --- ASISTENCIAS ---
  excelData.asistencias.forEach(ea => {
    const existingAsist = currentData[ea.encuentro_meta_id]?.[ea.grupo_id]?.asistencia?.[ea.integrante_nombre];
    if (!existingAsist || existingAsist === '' || existingAsist === '0') {
      diff.asistencias.added.push(ea);
    } else if (existingAsist !== ea.estado) {
      diff.asistencias.modified.push({ ...ea, from: existingAsist });
    } else {
      diff.asistencias.unchanged.push(ea);
    }
  });

  return diff;
}

export async function applyDiffToSupabase(diff, supabase) {
  const results = { grupos: 0, integrantes: 0, evaluaciones: 0, asistencias: 0, errors: [] };

  // --- Apply new grupos + their integrantes ---
  for (const eg of diff.grupos.added) {
    try {
      const { error } = await supabase.from('grupos').upsert({
        id: eg.id,
        proyecto: eg.proyecto,
        comision: eg.comision || '',
        practica: eg.practica || 'P2',
      }, { onConflict: 'id' });
      if (error) throw error;
      results.grupos++;

      const intRows = (eg.integrantes || [])
        .filter(ei => ei.nombre && ei.nombre.trim() && ei.nombre.trim() !== '—')
        .map(ei => ({
          grupo_id: eg.id,
          nombre: ei.nombre.trim(),
          rol: ei.rol || '',
          observacion: ei.observacion || '',
        }));
      if (intRows.length > 0) {
        const { error: intErr } = await supabase.from('integrantes').insert(intRows);
        if (intErr) throw intErr;
        results.integrantes += intRows.length;
      }
    } catch (e) {
      results.errors.push(`Grupo ${eg.id}: ${e.message}`);
    }
  }

  // --- Apply modified grupos ---
  for (const eg of diff.grupos.modified) {
    try {
      const { error } = await supabase.from('grupos').update({
        proyecto: eg.proyecto,
        comision: eg.comision || '',
      }).eq('id', eg.id);
      if (error) throw error;
      results.grupos++;
    } catch (e) {
      results.errors.push(`Grupo ${eg.id} (mod): ${e.message}`);
    }
  }

  // --- Apply new integrantes ---
  for (const ei of diff.integrantes.added) {
    try {
      const { error } = await supabase.from('integrantes').insert({
        grupo_id: ei.grupo_id,
        nombre: ei.nombre,
        rol: ei.rol || '',
        observacion: ei.observacion || '',
      });
      if (error) throw error;
      results.integrantes++;
    } catch (e) {
      results.errors.push(`Integrante ${ei.nombre} (G${ei.grupo_id}): ${e.message}`);
    }
  }

  // --- Apply modified integrantes ---
  for (const ei of diff.integrantes.modified) {
    try {
      const { data: matches, error: findErr } = await supabase
        .from('integrantes')
        .select('id')
        .eq('grupo_id', ei.grupo_id)
        .eq('nombre', ei.nombre)
        .limit(1);
      if (findErr) throw findErr;
      if (matches && matches.length > 0) {
        const { error } = await supabase.from('integrantes').update({
          rol: ei.rol || '',
          observacion: ei.observacion || '',
        }).eq('id', matches[0].id);
        if (error) throw error;
        results.integrantes++;
      }
    } catch (e) {
      results.errors.push(`Integrante ${ei.nombre} (G${ei.grupo_id}) mod: ${e.message}`);
    }
  }

  // --- Apply evaluaciones (both added and modified) ---
  const allEvals = [...diff.evaluaciones.added, ...diff.evaluaciones.modified];

  for (const ev of allEvals) {
    try {
      const dims = ev.dimensions;
      const { data: existing, error: findErr } = await supabase
        .from('evaluaciones')
        .select('id, fecha_primera_nota')
        .eq('grupo_id', ev.grupo_id)
        .eq('encuentro_meta_id', ev.encuentro_meta_id)
        .maybeSingle();
      if (findErr) throw findErr;

      const now = new Date().toISOString();
      if (existing) {
        const updatePayload = { es_modificacion: true, fecha_modificacion: now };
        if (dims.FN) { updatePayload.fn = dims.FN.puntaje; if (dims.FN.feedback) updatePayload.feedback_fn = dims.FN.feedback; }
        if (dims.DEV) { updatePayload.dev = dims.DEV.puntaje; if (dims.DEV.feedback) updatePayload.feedback_dev = dims.DEV.feedback; }
        if (dims.SM) { updatePayload.sm = dims.SM.puntaje; if (dims.SM.feedback) updatePayload.feedback_sm = dims.SM.feedback; }
        if (!existing.fecha_primera_nota) {
          updatePayload.fecha_primera_nota = now;
        }
        const { error } = await supabase.from('evaluaciones').update(updatePayload).eq('id', existing.id);
        if (error) throw error;
        results.evaluaciones++;
      } else {
        const payload = {
          grupo_id: ev.grupo_id,
          encuentro_meta_id: ev.encuentro_meta_id,
          fn: dims.FN?.puntaje || null,
          dev: dims.DEV?.puntaje || null,
          sm: dims.SM?.puntaje || null,
          feedback_fn: dims.FN?.feedback || '',
          feedback_dev: dims.DEV?.feedback || '',
          feedback_sm: dims.SM?.feedback || '',
          fecha_primera_nota: now,
          es_modificacion: false,
          override_limite: false,
        };
        const { error } = await supabase.from('evaluaciones').insert(payload);
        if (error) throw error;
        results.evaluaciones++;
      }
    } catch (e) {
      results.errors.push(`Eval G${ev.grupo_id} ${ev.encuentro_meta_id}: ${e.message}`);
    }
  }

  // --- Apply asistencias ---
  const allAsist = [...diff.asistencias.added, ...diff.asistencias.modified];

  for (const ea of allAsist) {
    try {
      const { data: evalRow, error: findErr } = await supabase
        .from('evaluaciones')
        .select('id')
        .eq('grupo_id', ea.grupo_id)
        .eq('encuentro_meta_id', ea.encuentro_meta_id)
        .maybeSingle();
      if (findErr) throw findErr;
      if (evalRow) {
        const { error } = await supabase.from('asistencias').upsert({
          evaluacion_id: evalRow.id,
          integrante_nombre: ea.integrante_nombre,
          estado: ea.estado,
        }, { onConflict: 'evaluacion_id,integrante_nombre' });
        if (error) throw error;
        results.asistencias++;
      }
    } catch (e) {
      results.errors.push(`Asistencia G${ea.grupo_id} ${ea.encuentro_meta_id} ${ea.integrante_nombre}: ${e.message}`);
    }
  }

  return results;
}