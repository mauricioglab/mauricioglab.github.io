const Model = window.SurveyCore?.Model || window.Survey?.Model;
const render = window.renderSurvey;
import { getSurveySchema } from "../../data/survey-schema.js";
import { calcularElegibilidad } from "../../data/eligibility-rules.js";
import { supabase } from "../../lib/supabase.js";

const PP_ESTADO_LABELS = {
  no_cursada: "No la cursé",
  cursada_no_reg: "La cursé pero no regularicé",
  regularizada: "La regularicé",
  aprobada: "La aprobé",
  debe_recursar: "Tengo que recursarla"
};

function buildResumenHTML(survey) {
  const d = survey.data;
  let html = "";

  html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">Datos personales</h3>';
  html += `<p><strong>Nombre:</strong> ${d.nombre_completo || "—"}</p>`;
  html += `<p><strong>DNI:</strong> ${d.dni || "—"}</p>`;
  html += `<p><strong>Email:</strong> ${d.email || "—"}</p>`;
  html += `<p><strong>Teléfono:</strong> ${d.telefono || "—"}</p>`;
  html += `<p><strong>Teams:</strong> ${d.usuario_teams || "—"}</p>`;
  html += `<p><strong>Comisión:</strong> ${d.comision || "—"}</p>`;

  html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
  html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">PP2</h3>';
  html += `<p><strong>Estado:</strong> ${PP_ESTADO_LABELS[d.pp2_estado] || d.pp2_estado || "—"}</p>`;
  if (d.pp2_mes_regularizada) {
    html += `<p><strong>Regularizada en:</strong> ${d.pp2_mes_regularizada}</p>`;
  }

  if (d.pp2_estado === "regularizada" || d.pp2_estado === "aprobada") {
    html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
    html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">PP3</h3>';
    html += `<p><strong>Estado:</strong> ${PP_ESTADO_LABELS[d.pp3_estado] || d.pp3_estado || "—"}</p>`;
    if (d.pp3_mes_regularizada) {
      html += `<p><strong>Regularizada en:</strong> ${d.pp3_mes_regularizada}</p>`;
    }
  }

  if (d.tiene_materias_a_cursar && d.materias_a_cursar && d.materias_a_cursar.length > 0) {
    html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
    html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">Materias a cursar/recursar</h3>';
    html += "<ul>";
    for (const m of d.materias_a_cursar) {
      html += `<li>${m.nombre}</li>`;
    }
    html += "</ul>";
  }

  if (d.tiene_materias_pendientes && d.materias_pendientes && d.materias_pendientes.length > 0) {
    html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
    html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">Materias pendientes de final</h3>';
    html += "<ul>";
    for (const m of d.materias_pendientes) {
      html += `<li>${m.nombre} — regularizada en ${m.regularizada_en}</li>`;
    }
    html += "</ul>";
  }

  html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
  html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">Proyecto</h3>';
  if (d.tiene_proyecto) {
    html += `<p><strong>Tiene proyecto:</strong> Sí</p>`;
    html += `<p><strong>Nombre:</strong> ${d.proyecto_nombre || "—"}</p>`;
    html += `<p><strong>Tutor:</strong> ${d.proyecto_tutor || "—"}</p>`;
  } else {
    html += `<p><strong>Tiene proyecto:</strong> No${d.buscando_proyecto ? " (buscando)" : ""}</p>`;
  }

  html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
  html += '<h3 style="margin:0 0 8px;font-weight:700;font-size:15px;">Grupo</h3>';
  if (d.tiene_grupo) {
    html += `<p><strong>Tiene grupo:</strong> Sí</p>`;
    html += `<p><strong>Integrantes:</strong> ${d.grupo_detalle || "—"}</p>`;
    if (d.grupo_miembros_anteriores && d.grupo_miembros_anteriores.length > 0) {
      html += "<p><strong>Miembros anteriores:</strong></p><ul>";
      for (const m of d.grupo_miembros_anteriores) {
        html += `<li>${m.nombre}${m.contacto ? ` — ${m.contacto}` : ""}</li>`;
      }
      html += "</ul>";
    }
  } else {
    html += `<p><strong>Tiene grupo:</strong> No${d.buscando_grupo ? " (buscando)" : ""}</p>`;
  }

  const alumnoData = {
    pp2_estado: d.pp2_estado || "no_cursada",
    pp3_estado: d.pp3_estado || "no_cursada",
    materias_a_cursar: d.materias_a_cursar || [],
    materias_pendientes: d.materias_pendientes || [],
    tiene_proyecto: d.tiene_proyecto,
    buscando_proyecto: d.buscando_proyecto,
    tiene_grupo: d.tiene_grupo,
    buscando_grupo: d.buscando_grupo
  };
  const resultado = calcularElegibilidad(alumnoData);

  html += '<hr style="border-color:#e5e7eb;margin:12px 0">';
  const estadoColors = { habilitado: "#10b981", condicional: "#f59e0b", a_recurrir: "#ef4444" };
  const estadoLabels = { habilitado: "Habilitado", condicional: "Condicional", a_recurrir: "A recursar" };
  const color = estadoColors[resultado.estado] || "#9ca3af";
  const label = estadoLabels[resultado.estado] || resultado.estado;
  html += `<div style="padding:12px;border-radius:8px;border:2px solid ${color};background:${color}11;margin-top:8px">`;
  html += `<h3 style="margin:0 0 4px;font-weight:700;font-size:15px;color:${color}">Estado: ${label}</h3>`;
  if (resultado.motivos.length > 0) {
    html += "<ul style='margin:4px 0;padding-left:20px;'>";
    for (const m of resultado.motivos) {
      html += `<li style="color:${color}">${m}</li>`;
    }
    html += "</ul>";
  }
  if (resultado.alertas.length > 0) {
    html += "<ul style='margin:4px 0;padding-left:20px;'>";
    for (const a of resultado.alertas) {
      html += `<li style="color:#6366f1">⚠ ${a.mensaje}</li>`;
    }
    html += "</ul>";
  }
  html += "</div>";

  return html;
}

export function initSurvey(containerId) {
  console.log('initSurvey called, containerId:', containerId);
  const schema = getSurveySchema();
  const survey = new Model(schema);

  survey.applyTheme({
    cssVariables: {
      "--sjs-primary-backcolor": "#6366f1",
      "--sjs-primary-backcolor-dark": "#4f46e5",
      "--sjs-primary-forecolor": "#ffffff",
      "--sjs-primary-forecolor-light": "#e0e7ff",
      "--sjs-border-default": "#d1d5db",
      "--sjs-border-light": "#e5e7eb",
      "--sjs-general-backcolor-dim": "#f9fafb",
      "--sjs-font-questiontitle-size": "14px",
      "--sjs-font-pagetitle-size": "18px",
    }
  });

  let currentContainer = null;

  survey.onAfterRenderPage.add((sender) => {
    const el = document.getElementById("resumen-dinamico");
    if (el && sender.currentPage && sender.currentPage.name === "resumen") {
      el.innerHTML = buildResumenHTML(sender);
    }
  });

  survey.onValueChanged.add((sender) => {
    const el = document.getElementById("resumen-dinamico");
    if (el && sender.currentPage && sender.currentPage.name === "resumen") {
      el.innerHTML = buildResumenHTML(sender);
    }
  });

  survey.onComplete.add(async (sender) => {
    const d = sender.data;
    const alumnoData = {
      pp2_estado: d.pp2_estado || "no_cursada",
      pp3_estado: d.pp2_estado === "regularizada" || d.pp2_estado === "aprobada" ? (d.pp3_estado || "no_cursada") : "no_cursada",
      materias_a_cursar: d.materias_a_cursar || [],
      materias_pendientes: d.materias_pendientes || [],
      tiene_proyecto: d.tiene_proyecto || false,
      buscando_proyecto: d.buscando_proyecto || false,
      tiene_grupo: d.tiene_grupo || false,
      buscando_grupo: d.buscando_grupo || false
    };
    const resultado = calcularElegibilidad(alumnoData);

    const payload = {
      nombre_completo: d.nombre_completo,
      dni: d.dni || null,
      email: d.email || null,
      telefono: d.telefono || null,
      usuario_teams: d.usuario_teams,
      comision: d.comision || null,
      pp2_estado: d.pp2_estado || "no_cursada",
      pp2_mes_regularizada: d.pp2_mes_regularizada || null,
      pp3_estado: alumnoData.pp3_estado,
      pp3_mes_regularizada: d.pp3_mes_regularizada || null,
      tiene_proyecto: d.tiene_proyecto || false,
      proyecto_nombre: d.tiene_proyecto ? (d.proyecto_nombre || null) : null,
      proyecto_tutor: d.tiene_proyecto ? (d.proyecto_tutor || null) : null,
      buscando_proyecto: !d.tiene_proyecto ? (d.buscando_proyecto || false) : false,
      tiene_grupo: d.tiene_grupo || false,
      grupo_detalle: d.tiene_grupo ? (d.grupo_detalle || null) : null,
      grupo_miembros_anteriores: d.tiene_grupo && d.grupo_miembros_anteriores ? d.grupo_miembros_anteriores : [],
      buscando_grupo: !d.tiene_grupo ? (d.buscando_grupo || false) : false,
      materias_a_cursar: d.tiene_materias_a_cursar ? (d.materias_a_cursar || []) : [],
      materias_pendientes: d.tiene_materias_pendientes ? (d.materias_pendientes || []) : [],
      estado: resultado.estado,
      puede_aspirar: resultado.estado === "habilitado" || resultado.estado === "condicional",
      motivo_inhabilitacion: resultado.motivos.join("; ") || null
    };

    const resultEl = document.getElementById("survey-result");
    try {
      const { error } = await supabase.from("alumnos_seguimiento").insert([payload]);
      if (error) throw error;
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:16px">✓</div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#111827">Datos enviados</h2>
            <p style="color:#6b7280;font-size:14px">Tu información fue registrada correctamente.</p>
            <p style="color:#6b7280;font-size:14px;margin-top:4px">Estado: <strong style="color:${resultado.estado === "habilitado" ? "#10b981" : resultado.estado === "condicional" ? "#f59e0b" : "#ef4444"}">${resultado.estado === "habilitado" ? "Habilitado" : resultado.estado === "condicional" ? "Condicional" : "A recursar"}</strong></p>
            ${resultado.motivos.length ? '<p style="color:#6b7280;font-size:13px;margin-top:8px">Motivos: ' + resultado.motivos.join(", ") + "</p>" : ""}
            ${resultado.alertas.length ? '<p style="color:#6366f1;font-size:13px;margin-top:4px">Alertas: ' + resultado.alertas.map(a => a.mensaje).join(", ") + "</p>" : ""}
          </div>`;
      }
    } catch (e) {
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:16px">✕</div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#ef4444">Error al enviar</h2>
            <p style="color:#6b7280;font-size:14px">${e.message || "Intentá de nuevo más tarde."}</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px">Reintentar</button>
          </div>`;
      }
    }
  });

  const container = document.getElementById(containerId);
  console.log('Container element:', container);
  if (container) {
    try {
      currentContainer = render(survey, container);
      console.log('Survey rendered successfully');
    } catch (e) {
      console.error('Error rendering survey:', e);
      container.innerHTML = '<p class="text-red-600 text-center p-4">Error al cargar el formulario. Recargá la página.</p>';
    }
  } else {
    console.error('Container not found:', containerId);
  }

  return { survey, container: currentContainer };
}