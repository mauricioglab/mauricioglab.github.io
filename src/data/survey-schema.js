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

export function getSurveySchema() {
  return {
    showProgressBar: "top",
    progressBarType: "percentage",
    title: "Seguimiento de Alumnos — Trabajo Final",
    description: "Completá tus datos para que podamos conocer tu situación actual y acompañarte.",
    pages: [
      {
        name: "datos_personales",
        title: "Datos personales",
        elements: [
          { type: "text", name: "nombre_completo", title: "Nombre completo", isRequired: true, placeholder: "Ej: García, María" },
          { type: "text", name: "dni", title: "DNI", placeholder: "Ej: 12345678", validators: [{ type: "numeric" }] },
          { type: "text", name: "email", title: "Email", inputType: "email", placeholder: "Ej: maria@email.com" },
          { type: "text", name: "telefono", title: "Teléfono", placeholder: "Ej: 261 555-1234" },
          { type: "text", name: "usuario_teams", title: "Usuario de Microsoft Teams", isRequired: true, placeholder: "Ej: maria.garcia@institucion.edu.ar", description: "Lo necesitamos para contactarte." },
          { type: "text", name: "comision", title: "Comisión", placeholder: "Ej: 51NMS" }
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
            choices: generarMeses()
          }
        ]
      },
      {
        name: "pp3",
        title: "Práctica Profesionalizante III",
        description: "Contanos cuál es tu situación con PP3.",
        visibleIf: "{pp2_estado} = 'regularizada' or {pp2_estado} = 'aprobada'",
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
              { value: "aprobada", text: "La aprobé" },
              { value: "debe_recursar", text: "Tengo que recursarla" }
            ]
          },
          {
            type: "dropdown",
            name: "pp3_mes_regularizada",
            title: "¿Cuándo la regularizaste?",
            visibleIf: "{pp3_estado} = 'regularizada' or {pp3_estado} = 'aprobada'",
            choices: generarMeses()
          }
        ]
      },
      {
        name: "materias_cursar",
        title: "Materias a cursar o recursar",
        description: "¿Tenés materias que debés cursar o recursar antes de poder aspirar al Trabajo Final?",
        elements: [
          {
            type: "boolean",
            name: "tiene_materias_a_cursar",
            title: "¿Tenés materias que debés cursar o recursar?",
            isRequired: true,
            labelTrue: "Sí",
            labelFalse: "No"
          },
          {
            type: "panel",
            name: "materias_a_cursar_panel",
            visibleIf: "{tiene_materias_a_cursar} = true",
            elements: [
              {
                type: "matrixdynamic",
                name: "materias_a_cursar",
                title: "Listá las materias que debés cursar o recursar",
                columns: [
                  { name: "nombre", title: "Nombre de la materia", cellType: "text", isRequired: true }
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
        name: "materias_pendientes",
        title: "Materias pendientes de final",
        description: "Materias que ya regularizaste pero todavía no rendiste el final.",
        elements: [
          {
            type: "boolean",
            name: "tiene_materias_pendientes",
            title: "¿Te queda alguna materia por rendir (final)?",
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
                title: "Indicá las materias regulares que te quedan por rendir y cuándo las regularizaste",
                columns: [
                  { name: "nombre", title: "Materia", cellType: "text", isRequired: true },
                  {
                    name: "regularizada_en",
                    title: "Cuándo la regularizaste",
                    cellType: "dropdown",
                    isRequired: true,
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
            title: "¿Tenés un proyecto de Trabajo Final?",
            isRequired: true,
            labelTrue: "Sí",
            labelFalse: "No"
          },
          {
            type: "text",
            name: "proyecto_nombre",
            title: "Nombre del proyecto",
            visibleIf: "{tiene_proyecto} = true",
            isRequired: true
          },
          {
            type: "text",
            name: "proyecto_tutor",
            title: "Tutor del proyecto",
            visibleIf: "{tiene_proyecto} = true"
          },
          {
            type: "boolean",
            name: "buscando_proyecto",
            title: "¿Estás buscando proyecto?",
            visibleIf: "{tiene_proyecto} = false",
            defaultValue: true
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
            type: "text",
            name: "grupo_detalle",
            title: "Detalle del grupo (nombres de los integrantes)",
            visibleIf: "{tiene_grupo} = true",
            isRequired: true
          },
          {
            type: "matrixdynamic",
            name: "grupo_miembros_anteriores",
            title: "Compañeros que ya no están en el grupo (para poder contactarlos)",
            visibleIf: "{tiene_grupo} = true",
            columns: [
              { name: "nombre", title: "Nombre", cellType: "text", isRequired: true },
              { name: "contacto", title: "Contacto (Teams / Email)", cellType: "text" }
            ],
            rowCount: 0,
            addRowText: "Agregar miembro anterior",
            removeRowText: "Eliminar"
          },
          {
            type: "boolean",
            name: "buscando_grupo",
            title: "¿Estás buscando grupo?",
            visibleIf: "{tiene_grupo} = false",
            defaultValue: true
          }
        ]
      },
      {
        name: "resumen",
        title: "Resumen",
        description: "Revisá tus datos antes de enviar.",
        elements: [
          {
            type: "html",
            name: "resumen_html",
            html: '<div id="resumen-dinamico" style="padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;"></div>'
          }
        ]
      }
    ],
    questionTitleLocation: "top",
    showQuestionNumbers: "off",
    completeText: "Enviar",
    pagePrevText: "Anterior",
    pageNextText: "Siguiente"
  };
}