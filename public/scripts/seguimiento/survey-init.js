function generarMeses() {
  const meses = [];
  const ahora = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    meses.push({ value: `${mm}/${yyyy}`, text: `${mm}/${yyyy}` });
  }
  return meses;
}

function getSurveySchema() {
  return {
    showProgressBar: "top",
    progressBarType: "percentage",
    pages: [
      {
        name: "datos_personales",
        title: "Datos personales",
        elements: [
          { type: "text", name: "nombre_completo", title: "Nombre completo", isRequired: true, placeholder: "Ej: García, María", validators: [{ type: "regex", regex: "^([a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}\\s+)+[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}$", text: "Ingresá al menos nombre y apellido (mínimo 3 letras cada uno)" }] },
          { type: "text", name: "dni", title: "DNI", placeholder: "Ej: 12345678", validators: [{ type: "regex", regex: "^\\d{7,8}$", text: "El DNI debe tener 7 u 8 dígitos numéricos" }], startWithNewLine: false },
          { type: "text", name: "email", title: "Email", inputType: "email", placeholder: "Ej: maria@email.com", validators: [{ type: "regex", regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", text: "Ingresá un email válido" }] },
          { type: "text", name: "telefono", title: "Teléfono", placeholder: "Ej: 261 555-1234", startWithNewLine: false },
          { type: "text", name: "usuario_teams", title: "Usuario de Microsoft Teams", isRequired: true, placeholder: "Ej: maria.garcia@institucion.edu.ar", description: "Lo necesitamos para contactarte." },
          { type: "text", name: "comision", title: "Comisión", placeholder: "Ej: 51NMS", startWithNewLine: false }
        ]
      },
      {
        name: "pp2",
        title: "Práctica Profesionalizante II",
        description: "Contanos cuál es tu situación con PP2.",
        elements: [
          {
            type: "radiogroup",
            name: "pp2_estado",
            title: "¿Cuál es tu situación con PP2?",
            isRequired: true,
            choices: [
              { value: "no_cursada", text: "No la cursé" },
              { value: "cursada_no_reg", text: "La cursé pero no regularicé" },
              { value: "regularizada", text: "La regularicé" },
              { value: "aprobada", text: "La aprobé" },
              { value: "debe_recursar", text: "Tengo que recursarla" }
            ]
          },
          {
            type: "dropdown",
            name: "pp2_mes_regularizada",
            title: "¿Cuándo la regularizaste?",
            visibleIf: "{pp2_estado} = 'regularizada' or {pp2_estado} = 'aprobada'",
            isRequired: true,
            choices: generarMeses()
          }
        ]
      },
      {
        name: "pp3",
        title: "Práctica Profesionalizante III",
        description: "Contanos cuál es tu situación con PP3.",
        visibleIf: "{pp2_estado} = 'regularizada'",
        elements: [
          {
            type: "radiogroup",
            name: "pp3_estado",
            title: "¿Cuál es tu situación con PP3?",
            isRequired: true,
            choices: [
              { value: "no_cursada", text: "No la cursé" },
              { value: "cursada_no_reg", text: "La cursé pero no regularicé" },
              { value: "regularizada", text: "La regularicé" },
              { value: "debe_recursar", text: "Tengo que recursarla" }
            ]
          },
          {
            type: "dropdown",
            name: "pp3_mes_regularizada",
            title: "¿Cuándo la regularizaste?",
            visibleIf: "{pp3_estado} = 'regularizada'",
            isRequired: true,
            choices: generarMeses()
          }
        ]
      },
      {
        name: "materias",
        title: "Materias pendientes",
        description: "¿Tenés materias que debés cursar, recursar o rendir final?",
        visibleIf: "{pp2_estado} = 'regularizada' or {pp2_estado} = 'aprobada' or {pp2_estado} = 'debe_recursar'",
        elements: [
          {
            type: "boolean",
            name: "tiene_materias_pendientes",
            title: "¿Tenés materias pendientes (a cursar, recursar o rendir final)?",
            isRequired: true,
            labelTrue: "Sí",
            labelFalse: "No"
          },
          {
            type: "panel",
            name: "materias_pendientes_panel",
            visibleIf: "{tiene_materias_pendientes} = true",
            elements: [
              {
                type: "matrixdynamic",
                name: "materias_pendientes",
                title: "Listá las materias que tenés pendientes",
                columns: [
                  { name: "nombre", title: "Nombre de la materia", cellType: "text", isRequired: true },
                  {
                    name: "estado",
                    title: "Estado",
                    cellType: "dropdown",
                    isRequired: true,
                    choices: [
                      { value: "a_cursar", text: "A cursar / recursar" },
                      { value: "regularizada_pendiente_final", text: "Regularizada, pendiente de final" }
                    ]
                  },
                  {
                    name: "regularizada_en",
                    title: "Cuándo la regularizaste",
                    cellType: "dropdown",
                    visibleIf: "{row.estado} = 'regularizada_pendiente_final'",
                    choices: generarMeses()
                  }
                ],
                rowCount: 1,
                addRowText: "Agregar materia",
                removeRowText: "Eliminar"
              }
            ]
          }
        ]
      },
      {
        name: "proyecto",
        title: "Proyecto",
        description: "Contanos sobre tu proyecto de Trabajo Final.",
        elements: [
          {
            type: "boolean",
            name: "tiene_proyecto",
            title: "¿Tenés un proyecto para el sistema de trabajo final?",
            isRequired: true,
            labelTrue: "Sí",
            labelFalse: "No"
          },
          {
            type: "text",
            name: "proyecto_nombre",
            title: "Nombre del sistema",
            visibleIf: "{tiene_proyecto} = true",
            isRequired: true
          },
          {
            type: "comment",
            name: "proyecto_objetivo",
            title: "Objetivo del sistema",
            visibleIf: "{tiene_proyecto} = true",
            isRequired: true,
            rows: 3
          },
          {
            type: "text",
            name: "proyecto_tutor",
            title: "Tutor del proyecto",
            visibleIf: "{tiene_proyecto} = true"
          }
        ]
      },
      {
        name: "grupo",
        title: "Grupo",
        description: "Contanos sobre tu equipo de trabajo.",
        elements: [
          {
            type: "boolean",
            name: "tiene_grupo",
            title: "¿Tenés grupo/armaste equipo para el Trabajo Final?",
            isRequired: true,
            labelTrue: "Sí",
            labelFalse: "No"
          },
          {
            type: "comment",
            name: "grupo_detalle",
            title: "Nombres de los integrantes del grupo",
            visibleIf: "{tiene_grupo} = true",
            isRequired: true,
            rows: 3
          }
        ]
      },
    ],
    questionTitleLocation: "top",
    showQuestionNumbers: "off",
    completeText: "Enviar",
    pagePrevText: "Anterior",
    pageNextText: "Siguiente"
  };
}

const PP_ESTADO_LABELS = {
  no_cursada: "No la cursé",
  cursada_no_reg: "La cursé pero no regularicé",
  regularizada: "La regularicé",
  aprobada: "La aprobé",
  debe_recursar: "Tengo que recursarla"
};

function calcularElegibilidad(data) {
  const reglas = {
    habilitado: { motivos: [], alertas: [] },
    condicional: { motivos: [], alertas: [] },
    a_recurrir: { motivos: [], alertas: [] }
  };

  if (data.pp2_estado !== "regularizada" && data.pp2_estado !== "aprobada") {
    reglas.a_recurrir.motivos.push("PP2 no está regularizada ni aprobada");
  }

  const pp3Needed = data.pp2_estado === "regularizada";
  if (pp3Needed && data.pp3_estado !== "regularizada" && data.pp3_estado !== "aprobada") {
    reglas.a_recurrir.motivos.push("PP3 no está regularizada");
  }

  if (data.materias_pendientes && data.materias_pendientes.length > 0) {
    const tieneParaCursar = data.materias_pendientes.some(function(m) {
      return m.estado === "a_cursar";
    });
    if (tieneParaCursar) {
      reglas.a_recurrir.motivos.push("Tenés materias para cursar/recursar");
    } else {
      reglas.condicional.alertas.push({ mensaje: "Tenés materias pendientes de final" });
    }
  }

  let estado = "habilitado";
  if (reglas.a_recurrir.motivos.length > 0) estado = "a_recurrir";
  else if (reglas.condicional.motivos.length > 0 || reglas.condicional.alertas.length > 0) estado = "condicional";

  return { estado, motivos: reglas[estado].motivos, alertas: reglas[estado].alertas };
}

window.initSurvey = function(containerId) {
  console.log('initSurvey called, containerId:', containerId);

  const Model = window.SurveyCore?.Model || window.Survey?.Model;

  if (!Model) {
    console.error('SurveyJS Model not found');
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  const schema = getSurveySchema();
  const survey = new Model(schema);

  survey.locale = 'es';
  survey.platform = 'js-ui';
  survey.render(container);

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

  survey.onComplete.add(async function(sender) {
    const d = sender.data;
    const alumnoData = {
      pp2_estado: d.pp2_estado || "no_cursada",
      pp3_estado: d.pp2_estado === "regularizada" ? (d.pp3_estado || "no_cursada") : "no_cursada",
      materias_pendientes: d.materias_pendientes || [],
      tiene_proyecto: d.tiene_proyecto || false,
      tiene_grupo: d.tiene_grupo || false
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
      tiene_grupo: d.tiene_grupo || false,
      grupo_detalle: d.tiene_grupo ? (d.grupo_detalle || null) : null,
      materias_pendientes: d.tiene_materias_pendientes ? (d.materias_pendientes || []) : [],
      estado: resultado.estado,
      puede_aspirar: resultado.estado === "habilitado" || resultado.estado === "condicional",
      motivo_inhabilitacion: resultado.motivos.join("; ") || null
    };

    const resultEl = document.getElementById("survey-result");
    try {
      const { createClient } = window.supabase || {};
      if (!createClient) {
        throw new Error('Supabase client not loaded');
      }
      const supabase = createClient(
        'https://rnejgcdfpbkqbdoadeib.supabase.co',
        'sb_publishable_wQef0RztvyMcq52QckV7Uw_BcXEdBqI'
      );
      const { error } = await supabase.from("alumnos_seguimiento").insert([payload]);
      if (error) throw error;
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:16px">✓</div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#111827">Datos enviados</h2>
            <p style="color:#6b7280;font-size:14px">Tu información fue registrada correctamente.</p>
            <p style="color:#6b7280;font-size:14px;margin-top:4px">Te contactaremos a la brevedad.</p>
          </div>`;
      }
    } catch (e) {
      console.error('Error al enviar:', e);
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:16px">✕</div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#ef4444">No se pudieron guardar los datos</h2>
            <p style="color:#6b7280;font-size:14px">Hubo un problema de conexión. Por favor, intentá de nuevo en unos minutos.</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:8px">Si el problema persiste, contactá al administrador.</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px">Reintentar</button>
          </div>`;
      }
    }
  });

};
