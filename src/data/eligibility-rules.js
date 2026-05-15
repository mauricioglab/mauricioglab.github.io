export const ELIGIBILITY_RULES = {
  a_recurrir: [
    {
      campo: "pp2_estado",
      valores: ["no_cursada", "cursada_no_reg", "debe_recursar"],
      mensaje: "Debe cursar o recursar PP2"
    },
    {
      campo: "pp3_estado",
      valores: ["no_cursada", "cursada_no_reg", "debe_recursar"],
      mensaje: "Debe cursar o recursar PP3",
      condicion_previa: (a) => a.pp2_estado === "regularizada" || a.pp2_estado === "aprobada"
    },
    {
      campo: "materias_a_cursar",
      no_vacio: true,
      mensaje: "Tiene materias que debe cursar o recursar"
    }
  ],

  condicional: [
    {
      campo: "pp3_estado",
      valores: ["no_cursada"],
      mensaje: "PP3 pendiente de cursar",
      condicion_previa: (a) => a.pp2_estado === "regularizada" || a.pp2_estado === "aprobada"
    },
    {
      campo: "materias_pendientes",
      check_vencimiento_meses: 12,
      mensaje: "Tiene materias regulares que podrían vencer pronto"
    }
  ],

  alertas: [
    { campo: "buscando_proyecto", valor: true, tipo: "warning", mensaje: "Sin proyecto" },
    { campo: "buscando_grupo", valor: true, tipo: "warning", mensaje: "Sin grupo" }
  ]
};

export function calcularElegibilidad(alumno) {
  const resultado = {
    estado: "habilitado",
    motivos: [],
    alertas: []
  };

  for (const regla of ELIGIBILITY_RULES.a_recurrir) {
    if (regla.condicion_previa && !regla.condicion_previa(alumno)) continue;

    if (regla.valores) {
      const valor = alumno[regla.campo];
      if (regla.valores.includes(valor)) {
        resultado.estado = "a_recurrir";
        resultado.motivos.push(regla.mensaje);
      }
    }

    if (regla.no_vacio) {
      const arr = alumno[regla.campo];
      if (arr && Array.isArray(arr) && arr.length > 0) {
        resultado.estado = "a_recurrir";
        resultado.motivos.push(regla.mensaje);
      }
    }
  }

  if (resultado.estado === "habilitado") {
    for (const regla of ELIGIBILITY_RULES.condicional) {
      if (regla.condicion_previa && !regla.condicion_previa(alumno)) continue;

      if (regla.valores) {
        const valor = alumno[regla.campo];
        if (regla.valores.includes(valor)) {
          resultado.estado = "condicional";
          resultado.motivos.push(regla.mensaje);
        }
      }

      if (regla.check_vencimiento_meses) {
        const pendientes = alumno[regla.campo];
        if (pendientes && Array.isArray(pendientes)) {
          const ahora = new Date();
          for (const m of pendientes) {
            if (!m.regularizada_en) continue;
            const [mes, anio] = m.regularizada_en.split("/").map(Number);
            const fechaReg = new Date(anio, mes - 1);
            const diffMeses = (ahora.getFullYear() - fechaReg.getFullYear()) * 12 + (ahora.getMonth() - fechaReg.getMonth());
            if (diffMeses >= regla.check_vencimiento_meses) {
              resultado.estado = "condicional";
              resultado.motivos.push(regla.mensaje);
              break;
            }
          }
        }
      }
    }
  }

  for (const alerta of ELIGIBILITY_RULES.alertas) {
    if (alumno[alerta.campo] === alerta.valor) {
      resultado.alertas.push({ tipo: alerta.tipo, mensaje: alerta.mensaje });
    }
  }

  return resultado;
}