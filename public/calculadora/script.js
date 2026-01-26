// Only execute in browser environment (not during SSR/build)
if (typeof window === 'undefined' && typeof document === 'undefined') {
    // Export empty object during build to prevent errors
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {};
    }
}

// Reference values for quick setup
const REF = {
    precioKg: 20000,
    precioKwh: 234,
    consumoW: 120,
    desgasteHoras: 15000,
    valorImpresora: 1363990,
    margenError: 30,
    comisionML: 30
};

// Current entry for naming
let entradaActual = null;

// Function to format numbers in Argentine style (1.234,56)
function formatoArgentino(numero) {
    return numero.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Function to round prices to hundreds and format without decimals
function formatoPrecioFinal(numero) {
    const redondeado = Math.round(numero / 100) * 100;
    return redondeado.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Function to generate general market alert
function generarAlertaGeneral(precioVentaPersona, precioMLCompetencia, precioMLSinCompetencia) {
    if (typeof document === 'undefined') return '';
    const precioMercadoLibre = parseFloat(document.getElementById('precioMercadoLibre')?.value) || 0;
    
    if (precioMercadoLibre === 0) {
        return ''; // No mostrar alertas si no hay precio de ML
    }
    
    // Lógica simple según especificaciones
    if (precioMercadoLibre < precioMLCompetencia) {
        // Caso 1: ML menor que ML Competencia - quizás no conviene ML
        return `
            <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span class="text-sm font-semibold text-yellow-800">⚠️ ADVERTENCIA</span>
                </div>
                <p class="text-xs text-yellow-700 mt-1">
                    El precio de MercadoLibre ($${formatoPrecioFinal(precioMercadoLibre)}) es menor que tu ML Competencia ($${formatoPrecioFinal(precioMLCompetencia)}). Quizás no conviene ir por MercadoLibre.
                </p>
            </div>
        `;
    } else if (precioMercadoLibre >= precioMLCompetencia && precioMercadoLibre <= precioMLSinCompetencia) {
        // Caso 2: ML entre ML Competencia y ML Sin Competencia
        const diferenciaPorcentaje = ((precioMercadoLibre - precioMLCompetencia) / precioMLCompetencia) * 100;
        
        if (diferenciaPorcentaje <= 10) {
            // Diferencia pequeña - ajustar precio
            return `
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span class="text-sm font-semibold text-blue-800">💡 RECOMENDACIÓN</span>
                    </div>
                    <p class="text-xs text-blue-700 mt-1">
                        El precio de MercadoLibre ($${formatoPrecioFinal(precioMercadoLibre)}) es ${diferenciaPorcentaje.toFixed(1)}% mayor que tu ML Competencia. Debes ajustar el precio por encima del valor ML Competencia ($${formatoPrecioFinal(precioMLCompetencia)}) pero no exceder el valor de MercadoLibre ($${formatoPrecioFinal(precioMercadoLibre)}).
                    </p>
                </div>
            `;
        } else {
            // Diferencia grande - ajustar precio
            return `
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span class="text-sm font-semibold text-blue-800">💡 RECOMENDACIÓN</span>
                    </div>
                    <p class="text-xs text-blue-700 mt-1">
                        El precio de MercadoLibre ($${formatoPrecioFinal(precioMercadoLibre)}) es ${diferenciaPorcentaje.toFixed(1)}% mayor que tu ML Competencia. Debes ajustar el precio por encima del valor ML Competencia ($${formatoPrecioFinal(precioMLCompetencia)}) pero no exceder el valor de MercadoLibre ($${formatoPrecioFinal(precioMercadoLibre)}).
                    </p>
                </div>
            `;
        }
    } else {
        // Caso 3: ML mayor que ML Sin Competencia - ajustar por encima de ML Sin Competencia
        return `
            <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-green-500"></div>
                    <span class="text-sm font-semibold text-green-800">💡 OPORTUNIDAD</span>
                </div>
                <p class="text-xs text-green-700 mt-1">
                    El precio de MercadoLibre ($${formatoPrecioFinal(precioMercadoLibre)}) es mayor que tu ML Sin Competencia ($${formatoPrecioFinal(precioMLSinCompetencia)}). Debes ajustar el precio por encima del valor ML Sin Competencia ($${formatoPrecioFinal(precioMLSinCompetencia)}).
                </p>
            </div>
        `;
    }
}

// Function to generate simple alert for test tables
function generarAlertaSimple(precioCalculado, precioML) {
    if (precioML === 0) return '';
    
    const diferencia = ((precioCalculado - precioML) / precioML) * 100;
    
    if (diferencia > 50) {
        return '<br><small class="text-red-600 font-semibold">⚠️ CUIDADO</small>';
    }
    
    return '';
}

// Initialize application
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        cargarDatos();
        cargarHistorial();
        cargarDebugMode();
    });
}

// Debug mode management
function cargarDebugMode() {
    const debugMode = sessionStorage.getItem('debugMode') === 'true';
    const debugCheckbox = document.getElementById('debugMode');
    if (debugCheckbox) {
        debugCheckbox.checked = debugMode;
        toggleDebugMode();
    } else {
        // Si no hay modo debug guardado, ocultar el botón Test ML por defecto
        const testButton = document.querySelector('button[onclick="toggleTestInterno()"]');
        if (testButton) {
            testButton.classList.add('hidden');
        }
    }
}

function toggleDebugMode() {
    const debugCheckbox = document.getElementById('debugMode');
    const testButton = document.querySelector('button[onclick="toggleTestInterno()"]');
    const testSection = document.getElementById('testInterno');
    
    if (debugCheckbox) {
        const isDebugMode = debugCheckbox.checked;
        sessionStorage.setItem('debugMode', isDebugMode);
        
        if (testButton) {
            if (isDebugMode) {
                testButton.classList.remove('hidden');
            } else {
                testButton.classList.add('hidden');
            }
        }
        
        if (!isDebugMode && testSection && !testSection.classList.contains('hidden')) {
            testSection.classList.add('hidden');
        }
    }
}

// History management functions
function toggleHistorial() {
    const historial = document.getElementById('historial');
    if (historial.classList.contains('hidden')) {
        historial.classList.remove('hidden');
        mostrarHistorial();
    } else {
        historial.classList.add('hidden');
    }
}

// Test Interno functions
function toggleTestInterno() {
    // Ejecutar directamente los tests y mostrar la modal
    ejecutarTests();
}

// Test data from MercadoLibre examples
const TESTS_ML = [
    {
        nombre: "10 Llaveros",
        horas: 2,
        minutos: 24,
        gramos: 32,
        cantidad: 10,
        precioML: 13500,
        descripcion: "10 llaveros - 32g total, 2h24m"
    },
    {
        nombre: "Fénix",
        horas: 4,
        minutos: 4,
        gramos: 30,
        cantidad: 1,
        precioML: 16500,
        descripcion: "Figura Fénix - 30g, 4h4m"
    },
    {
        nombre: "Shiva",
        horas: 2,
        minutos: 29,
        gramos: 35,
        cantidad: 1,
        precioML: 23210,
        descripcion: "Figura Shiva - 35g, 2h29m"
    },
    {
        nombre: "Ovillero Gato",
        horas: 4,
        minutos: 55,
        gramos: 108,
        cantidad: 1,
        precioML: 14000, // Promedio entre 8k-20k
        descripcion: "Ovillero forma gato - 108g, 4h55m"
    },
    {
        nombre: "Bandeja",
        horas: 3,
        minutos: 20,
        gramos: 89.3,
        cantidad: 1,
        precioML: 7500,
        descripcion: "Bandeja - 89.3g, 3h20m"
    },
    {
        nombre: "Porta Sahumerio Samurai",
        horas: 1,
        minutos: 24,
        gramos: 23,
        cantidad: 1,
        precioML: 4600,
        descripcion: "Porta sahumerio samurai - 23g, 1h24m"
    },
    {
        nombre: "Decoración Día Madre",
        horas: 1,
        minutos: 37,
        gramos: 34,
        cantidad: 1,
        precioML: 3990,
        descripcion: "Decoración regalo día madre - 34g, 1h37m"
    },
    {
        nombre: "Porta Tarjetas",
        horas: 1,
        minutos: 37,
        gramos: 33,
        cantidad: 1,
        precioML: 7000,
        descripcion: "Porta tarjetas de crédito - 33g, 1h37m"
    }
];

function mostrarTests() {
    const lista = document.getElementById('testLista');
    
    lista.innerHTML = TESTS_ML.map((test, index) => `
        <div class="test-item">
            <div class="test-item-header">
                <span class="test-item-title">${test.nombre}</span>
                <span class="test-item-ml">ML: $${formatoPrecioFinal(test.precioML)}</span>
            </div>
            <div class="test-item-details">
                ${test.descripcion}
            </div>
        </div>
    `).join('');
}


function obtenerResultadoCalculado() {
    // Simular el cálculo sin mostrar resultados
    if (typeof document === 'undefined') return { totalUnitario: 0, precioML: 0, totalML: 0, ganancia: 0 };
    const precioKg = parseFloat(document.getElementById('costoFilamento')?.value) || 0;
    const precioKwh = parseFloat(document.getElementById('precioKwh')?.value) || 0;
    const consumoW = parseFloat(document.getElementById('consumoW')?.value) || 0;
    const desgasteHoras = parseFloat(document.getElementById('desgasteHoras')?.value) || 0;
    const valorImpresora = parseFloat(document.getElementById('valorImpresora')?.value) || 0;
    const margenErrorPct = (parseFloat(document.getElementById('margenError')?.value) || 0) / 100;
    const comisionMLPct = (parseFloat(document.getElementById('comisionML')?.value) || 30) / 100;
    
    const horas = parseFloat(document.getElementById('horasImpresion')?.value) || 0;
    const minutos = parseFloat(document.getElementById('minutosImpresion')?.value) || 0;
    const tiempoTotalHoras = horas + (minutos / 60);
    
    const gramos = parseFloat(document.getElementById('gramosFilamento')?.value) || 0;
    const insumos = parseFloat(document.getElementById('insumos')?.value) || 0;
    
    const cantidad = parseFloat(document.getElementById('cantidad')?.value) || 1;
    
    // Cálculos
    const costoMaterial = (precioKg / 1000) * gramos;
    const costoElectricidad = ((consumoW / 1000) * precioKwh) * tiempoTotalHoras;
    const valorDepreciable = valorImpresora * 0.7;
    const costoDesgaste = desgasteHoras > 0 ? (valorDepreciable / desgasteHoras) * tiempoTotalHoras : 0;
    const costoBase = costoMaterial + costoElectricidad + costoDesgaste;
    const margenError = costoBase * margenErrorPct;
    const costoConMargen = costoBase + margenError;
    
    // Calcular precios ML
    const gananciaCompetencia = parseFloat(localStorage.getItem('gananciaCompetencia')) || 175;
    const multiplicadorCompetencia = 1 + (gananciaCompetencia / 100);
    const costoConGananciaCompetencia = costoConMargen * multiplicadorCompetencia;
    const totalCobrarCompetencia = costoConGananciaCompetencia + insumos;
    const precioMLCompetencia = totalCobrarCompetencia / (1 - comisionMLPct);
    
        // Calcular venta a persona
        const descuentoVentaPersona = typeof document !== 'undefined' ? (parseFloat(document.getElementById('descuentoVentaPersona')?.value) || 20) : 20;
    const totalCobrar = precioMLCompetencia * (1 - descuentoVentaPersona / 100);
    
    return {
        totalUnitario: totalCobrar,
        precioML: precioMLCompetencia,
        totalML: precioMLCompetencia * cantidad,
        ganancia: totalCobrar - (costoConMargen + insumos)
    };
}


function ejecutarTests() {
    let resultados = [];
    
    TESTS_ML.forEach((test, index) => {
        // Guardar valores actuales
        const valoresOriginales = {
            horas: document.getElementById('horasImpresion').value,
            minutos: document.getElementById('minutosImpresion').value,
            gramos: document.getElementById('gramosFilamento').value,
            cantidad: document.getElementById('cantidad').value
        };
        
        // Cargar valores del test
        document.getElementById('horasImpresion').value = test.horas;
        document.getElementById('minutosImpresion').value = test.minutos;
        document.getElementById('gramosFilamento').value = test.gramos;
        document.getElementById('cantidad').value = test.cantidad;
        
        // Calcular
        const resultado = obtenerResultadoCalculado();
        
        // Guardar resultado
        resultados.push({
            test: test,
            resultado: resultado,
            diferencia: resultado.precioML - test.precioML,
            porcentajeDiferencia: ((resultado.precioML - test.precioML) / test.precioML) * 100
        });
        
        // Restaurar valores originales
        document.getElementById('horasImpresion').value = valoresOriginales.horas;
        document.getElementById('minutosImpresion').value = valoresOriginales.minutos;
        document.getElementById('gramosFilamento').value = valoresOriginales.gramos;
        document.getElementById('cantidad').value = valoresOriginales.cantidad;
    });
    
    // Mostrar resumen
    mostrarResumenTests(resultados);
}

function mostrarResumenTests(resultados) {
    // Obtener valores de los inputs o usar valores por defecto
    const gananciaNormal = parseFloat(document.getElementById('gananciaCompetenciaTest')?.value) || parseFloat(localStorage.getItem('gananciaCompetencia')) || 175;
    const gananciaExclusiva = parseFloat(document.getElementById('gananciaSinCompetenciaTest')?.value) || parseFloat(localStorage.getItem('gananciaSinCompetencia')) || 700;
    
    // Obtener costos base
    const precioKg = parseFloat(document.getElementById('costoFilamento').value) || 0;
    const precioKwh = parseFloat(document.getElementById('precioKwh').value) || 0;
    const consumoW = parseFloat(document.getElementById('consumoW').value) || 0;
    const desgasteHoras = parseFloat(document.getElementById('desgasteHoras').value) || 0;
    const valorImpresora = parseFloat(document.getElementById('valorImpresora').value) || 0;
    const margenErrorPct = (parseFloat(document.getElementById('margenError').value) || 0) / 100;
    const comisionMLPct = (parseFloat(document.getElementById('comisionML').value) || 30) / 100;
    const insumos = parseFloat(document.getElementById('insumos').value) || 0;
    
    let html = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-3">⚙️ Ajustar Porcentajes</h4>
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2">
                        <label for="descuentoVentaPersonaTest" class="font-semibold text-green-600">Descuento Venta Persona:</label>
                        <input type="number" id="descuentoVentaPersonaTest" value="${parseFloat(localStorage.getItem('descuentoVentaPersonaTest')) || 5}" min="0" max="50" step="1" 
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" 
                               onchange="guardarGananciasTest()">
                        <span class="text-green-600">%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="gananciaCompetenciaTest" class="font-semibold text-blue-600">ML Competencia:</label>
                        <input type="number" id="gananciaCompetenciaTest" value="${parseFloat(localStorage.getItem('gananciaCompetencia')) || 175}" min="50" max="1000" step="1" 
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" 
                               onchange="guardarGananciasTest()">
                        <span class="text-blue-600">%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="gananciaSinCompetenciaTest" class="font-semibold text-orange-600">ML Sin Competencia:</label>
                        <input type="number" id="gananciaSinCompetenciaTest" value="${parseFloat(localStorage.getItem('gananciaSinCompetencia')) || 700}" min="100" max="1500" step="1" 
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" 
                               onchange="guardarGananciasTest()">
                        <span class="text-orange-600">%</span>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full border-collapse text-xs border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100 font-bold">
                            <th class="border border-gray-300 p-1 sm:p-2 text-left min-w-[100px]">Producto</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[50px]">Gr</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[60px]">H:M</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">ML Real</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Venta Persona (-${parseFloat(localStorage.getItem('descuentoVentaPersonaTest')) || 5}%)</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">ML Competencia (${gananciaNormal}%)</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">ML Sin Competencia (${gananciaExclusiva}%)</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Gan. Persona</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Gan. Competencia</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Gan. Sin Competencia</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    resultados.forEach(r => {
        const horas = r.test.horas;
        const minutos = r.test.minutos;
        const tiempoTotalHoras = horas + (minutos / 60);
        const gramos = r.test.gramos;
        
        // Cálculos base
        const costoMaterial = (precioKg / 1000) * gramos;
        const costoElectricidad = ((consumoW / 1000) * precioKwh) * tiempoTotalHoras;
        const valorDepreciable = valorImpresora * 0.7;
        const costoDesgaste = desgasteHoras > 0 ? (valorDepreciable / desgasteHoras) * tiempoTotalHoras : 0;
        const costoBase = costoMaterial + costoElectricidad + costoDesgaste;
        const margenError = costoBase * margenErrorPct;
        const costoConMargen = costoBase + margenError;
        
        // Precios y ganancias
        const descuentoVentaPersonaTest = parseFloat(localStorage.getItem('descuentoVentaPersonaTest')) || 5;
        
        const multiplicadorNormal = 1 + (gananciaNormal / 100);
        const costoConGananciaNormal = costoConMargen * multiplicadorNormal;
        const totalCobrarNormal = costoConGananciaNormal + insumos;
        const precioMLNormal = totalCobrarNormal / (1 - comisionMLPct);
        
        const multiplicadorExclusivo = 1 + (gananciaExclusiva / 100);
        const costoConGananciaExclusivo = costoConMargen * multiplicadorExclusivo;
        const totalCobrarExclusivo = costoConGananciaExclusivo + insumos;
        const precioMLExclusivo = totalCobrarExclusivo / (1 - comisionMLPct);
        
        // Calcular venta a persona (descuento sobre ML Competencia)
        const totalCobrarPersona = precioMLNormal * (1 - descuentoVentaPersonaTest / 100);
        
        // Redondear precios a centenas
        const totalCobrarPersonaRedondeado = Math.round(totalCobrarPersona / 100) * 100;
        const precioMLNormalRedondeado = Math.round(precioMLNormal / 100) * 100;
        const precioMLExclusivoRedondeado = Math.round(precioMLExclusivo / 100) * 100;
        
        // Calcular ganancias reales basadas en precios redondeados
        const costoTotal = costoConMargen + insumos;
        const gananciaPersonaMonto = totalCobrarPersonaRedondeado - costoTotal;
        // Para ML, restar la comisión del precio
        const ingresoMLNormal = precioMLNormalRedondeado * (1 - comisionMLPct);
        const ingresoMLExclusivo = precioMLExclusivoRedondeado * (1 - comisionMLPct);
        const gananciaNormalMonto = ingresoMLNormal - costoTotal;
        const gananciaExclusivoMonto = ingresoMLExclusivo - costoTotal;
        
        // Diferencias
        const diferenciaNormal = precioMLNormalRedondeado - r.test.precioML;
        const diferenciaExclusivo = precioMLExclusivoRedondeado - r.test.precioML;
        const porcentajeNormal = ((diferenciaNormal / r.test.precioML) * 100).toFixed(1);
        const porcentajeExclusivo = ((diferenciaExclusivo / r.test.precioML) * 100).toFixed(1);
        
        const colorNormal = diferenciaNormal > 0 ? '#e74c3c' : '#27ae60';
        const colorExclusivo = diferenciaExclusivo > 0 ? '#e74c3c' : '#27ae60';
        
        html += `
            <tr class="hover:bg-gray-50">
                <td class="border border-gray-300 p-1 sm:p-2 font-bold">${r.test.nombre}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center">${gramos}g</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center">${horas}:${minutos.toString().padStart(2,'0')}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-blue-600">$${formatoPrecioFinal(r.test.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-600">$${formatoPrecioFinal(totalCobrarPersonaRedondeado)}${generarAlertaSimple(totalCobrarPersonaRedondeado, r.test.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center" style="color:${colorNormal}">$${formatoPrecioFinal(precioMLNormalRedondeado)}<br><small>(${porcentajeNormal}%)</small>${generarAlertaSimple(precioMLNormalRedondeado, r.test.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center" style="color:${colorExclusivo}">$${formatoPrecioFinal(precioMLExclusivoRedondeado)}<br><small>(${porcentajeExclusivo}%)</small>${generarAlertaSimple(precioMLExclusivoRedondeado, r.test.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-600">$${Math.round(gananciaPersonaMonto).toLocaleString('es-AR')}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-gray-600">$${Math.round(gananciaNormalMonto).toLocaleString('es-AR')}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-orange-600">$${Math.round(gananciaExclusivoMonto).toLocaleString('es-AR')}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-4 p-3 bg-gray-50 rounded text-xs">
                <strong class="text-gray-800">📊 Resumen:</strong><br>
                • <span class="text-gray-600">Competencia (${gananciaNormal}%):</span> Precio competitivo para mercados con competencia<br>
                • <span class="text-green-600">Sin Competencia (${gananciaExclusiva}%):</span> Precio premium para productos únicos<br>
                • <span class="text-blue-600">ML Real:</span> Precios actuales en MercadoLibre
            </div>
        </div>
    `;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'modalTests'; // Agregar ID único
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div class="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-800">🧪 Resultados de Tests</h3>
                <button onclick="document.getElementById('modalTests').remove()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200">✕</button>
            </div>
            <div class="p-4" id="modalTestsContent">
                ${html}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function guardarGananciasTest() {
    // Guardar los valores en localStorage
    const descuentoVentaPersonaTest = parseFloat(document.getElementById('descuentoVentaPersonaTest')?.value) || 5;
    const gananciaCompetencia = parseFloat(document.getElementById('gananciaCompetenciaTest')?.value) || 175;
    const gananciaSinCompetencia = parseFloat(document.getElementById('gananciaSinCompetenciaTest')?.value) || 700;
    
    localStorage.setItem('descuentoVentaPersonaTest', descuentoVentaPersonaTest);
    localStorage.setItem('gananciaCompetencia', gananciaCompetencia);
    localStorage.setItem('gananciaSinCompetencia', gananciaSinCompetencia);
    
    // Recalcular automáticamente
    recalcularTests();
}

function recalcularTests() {
    // Obtener el contenedor del modal por ID
    const modalContent = document.getElementById('modalTestsContent');
    if (!modalContent) return;
    
    // Obtener los nuevos valores de los inputs
    const descuentoVentaPersonaTest = parseFloat(document.getElementById('descuentoVentaPersonaTest')?.value) || parseFloat(localStorage.getItem('descuentoVentaPersonaTest')) || 5;
    const gananciaNormal = parseFloat(document.getElementById('gananciaCompetenciaTest')?.value) || parseFloat(localStorage.getItem('gananciaCompetencia')) || 175;
    const gananciaExclusiva = parseFloat(document.getElementById('gananciaSinCompetenciaTest')?.value) || parseFloat(localStorage.getItem('gananciaSinCompetencia')) || 700;
    
    // Obtener costos base
    const precioKg = parseFloat(document.getElementById('costoFilamento').value) || 0;
    const precioKwh = parseFloat(document.getElementById('precioKwh').value) || 0;
    const consumoW = parseFloat(document.getElementById('consumoW').value) || 0;
    const desgasteHoras = parseFloat(document.getElementById('desgasteHoras').value) || 0;
    const valorImpresora = parseFloat(document.getElementById('valorImpresora').value) || 0;
    const margenErrorPct = (parseFloat(document.getElementById('margenError').value) || 0) / 100;
    const comisionMLPct = (parseFloat(document.getElementById('comisionML').value) || 30) / 100;
    const insumos = parseFloat(document.getElementById('insumos').value) || 0;
    
    // Recalcular la tabla
    let html = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-3">⚙️ Ajustar Porcentajes</h4>
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2">
                        <label for="descuentoVentaPersonaTest" class="font-semibold text-green-600">Descuento Venta Persona:</label>
                        <input type="number" id="descuentoVentaPersonaTest" value="${descuentoVentaPersonaTest}" min="0" max="50" step="1" 
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" 
                               onchange="guardarGananciasTest()">
                        <span class="text-green-600">%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="gananciaCompetenciaTest" class="font-semibold text-blue-600">ML Competencia:</label>
                        <input type="number" id="gananciaCompetenciaTest" value="${gananciaNormal}" min="50" max="1000" step="1" 
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" 
                               onchange="guardarGananciasTest()">
                        <span class="text-blue-600">%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="gananciaSinCompetenciaTest" class="font-semibold text-orange-600">ML Sin Competencia:</label>
                        <input type="number" id="gananciaSinCompetenciaTest" value="${gananciaExclusiva}" min="100" max="1500" step="1" 
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" 
                               onchange="guardarGananciasTest()">
                        <span class="text-orange-600">%</span>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full border-collapse text-xs border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100 font-bold">
                            <th class="border border-gray-300 p-1 sm:p-2 text-left min-w-[100px]">Producto</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[50px]">Gr</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[60px]">H:M</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">ML Real</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Venta Persona (-${parseFloat(localStorage.getItem('descuentoVentaPersonaTest')) || 5}%)</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">ML Competencia (${gananciaNormal}%)</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">ML Sin Competencia (${gananciaExclusiva}%)</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Gan. Persona</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Gan. Competencia</th>
                            <th class="border border-gray-300 p-1 sm:p-2 text-center min-w-[80px]">Gan. Sin Competencia</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Recalcular cada producto
    TESTS_ML.forEach(r => {
        const horas = r.horas;
        const minutos = r.minutos;
        const tiempoTotalHoras = horas + (minutos / 60);
        const gramos = r.gramos;
        
        // Cálculos base
        const costoMaterial = (precioKg / 1000) * gramos;
        const costoElectricidad = ((consumoW / 1000) * precioKwh) * tiempoTotalHoras;
        const valorDepreciable = valorImpresora * 0.7;
        const costoDesgaste = desgasteHoras > 0 ? (valorDepreciable / desgasteHoras) * tiempoTotalHoras : 0;
        const costoBase = costoMaterial + costoElectricidad + costoDesgaste;
        const margenError = costoBase * margenErrorPct;
        const costoConMargen = costoBase + margenError;
        
        // Precios y ganancias con nuevos porcentajes
        const multiplicadorNormal = 1 + (gananciaNormal / 100);
        const costoConGananciaNormal = costoConMargen * multiplicadorNormal;
        const totalCobrarNormal = costoConGananciaNormal + insumos;
        const precioMLNormal = totalCobrarNormal / (1 - comisionMLPct);
        
        const multiplicadorExclusivo = 1 + (gananciaExclusiva / 100);
        const costoConGananciaExclusivo = costoConMargen * multiplicadorExclusivo;
        const totalCobrarExclusivo = costoConGananciaExclusivo + insumos;
        const precioMLExclusivo = totalCobrarExclusivo / (1 - comisionMLPct);
        
        // Calcular venta a persona (descuento sobre ML Competencia)
        const totalCobrarPersona = precioMLNormal * (1 - descuentoVentaPersonaTest / 100);
        
        // Redondear precios a centenas
        const totalCobrarPersonaRedondeado = Math.round(totalCobrarPersona / 100) * 100;
        const precioMLNormalRedondeado = Math.round(precioMLNormal / 100) * 100;
        const precioMLExclusivoRedondeado = Math.round(precioMLExclusivo / 100) * 100;
        
        // Calcular ganancias reales basadas en precios redondeados
        const costoTotal = costoConMargen + insumos;
        const gananciaPersonaMonto = totalCobrarPersonaRedondeado - costoTotal;
        // Para ML, restar la comisión del precio
        const ingresoMLNormal = precioMLNormalRedondeado * (1 - comisionMLPct);
        const ingresoMLExclusivo = precioMLExclusivoRedondeado * (1 - comisionMLPct);
        const gananciaNormalMonto = ingresoMLNormal - costoTotal;
        const gananciaExclusivoMonto = ingresoMLExclusivo - costoTotal;
        
        // Diferencias
        const diferenciaNormal = precioMLNormalRedondeado - r.precioML;
        const diferenciaExclusivo = precioMLExclusivoRedondeado - r.precioML;
        const porcentajeNormal = ((diferenciaNormal / r.precioML) * 100).toFixed(1);
        const porcentajeExclusivo = ((diferenciaExclusivo / r.precioML) * 100).toFixed(1);
        
        const colorNormal = diferenciaNormal > 0 ? '#e74c3c' : '#27ae60';
        const colorExclusivo = diferenciaExclusivo > 0 ? '#e74c3c' : '#27ae60';
        
        html += `
            <tr class="hover:bg-gray-50">
                <td class="border border-gray-300 p-1 sm:p-2 font-bold">${r.nombre}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center">${gramos}g</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center">${horas}:${minutos.toString().padStart(2,'0')}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-blue-600">$${formatoPrecioFinal(r.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-600">$${formatoPrecioFinal(totalCobrarPersonaRedondeado)}${generarAlertaSimple(totalCobrarPersonaRedondeado, r.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center" style="color:${colorNormal}">$${formatoPrecioFinal(precioMLNormalRedondeado)}<br><small>(${porcentajeNormal}%)</small>${generarAlertaSimple(precioMLNormalRedondeado, r.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center" style="color:${colorExclusivo}">$${formatoPrecioFinal(precioMLExclusivoRedondeado)}<br><small>(${porcentajeExclusivo}%)</small>${generarAlertaSimple(precioMLExclusivoRedondeado, r.precioML)}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-600">$${Math.round(gananciaPersonaMonto).toLocaleString('es-AR')}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-gray-600">$${Math.round(gananciaNormalMonto).toLocaleString('es-AR')}</td>
                <td class="border border-gray-300 p-1 sm:p-2 text-center text-orange-600">$${Math.round(gananciaExclusivoMonto).toLocaleString('es-AR')}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-4 p-3 bg-gray-50 rounded text-xs">
                <strong class="text-gray-800">📊 Resumen:</strong><br>
                • <span class="text-gray-600">Competencia (${gananciaNormal}%):</span> Precio competitivo para mercados con competencia<br>
                • <span class="text-green-600">Sin Competencia (${gananciaExclusiva}%):</span> Precio premium para productos únicos<br>
                • <span class="text-blue-600">ML Real:</span> Precios actuales en MercadoLibre
            </div>
        </div>
    `;
    
    // Actualizar el contenido del modal directamente
    modalContent.innerHTML = html;
}

function guardarEnHistorial(datos) {
    let historial = JSON.parse(localStorage.getItem('historial3D') || '[]');
    
    const item = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        nombre: `${datos.entrada.pieza.gramosFilamento}g - ${datos.entrada.pieza.tiempoTotalHoras.toFixed(1)}h`,
        datos: datos
    };
    
    historial.unshift(item);
    entradaActual = item;
    
    if (historial.length > 30) {
        historial = historial.slice(0, 30);
    }
    
    localStorage.setItem('historial3D', JSON.stringify(historial));
}

function nombrarEntrada() {
    if (!entradaActual) {
        alert('Primero calcula algo para poder nombrarlo');
        return;
    }
    
    const nuevoNombre = prompt('Ingresa un nombre para esta entrada:', entradaActual.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
        let historial = JSON.parse(localStorage.getItem('historial3D') || '[]');
        const item = historial.find(h => h.id === entradaActual.id);
        if (item) {
            item.nombre = nuevoNombre.trim();
            localStorage.setItem('historial3D', JSON.stringify(historial));
            if (!document.getElementById('historial').classList.contains('hidden')) {
                mostrarHistorial();
            }
        }
    }
}

function cargarHistorial() {
    // Initialize if doesn't exist
    if (!localStorage.getItem('historial3D')) {
        localStorage.setItem('historial3D', '[]');
    }
}

function mostrarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial3D') || '[]');
    const lista = document.getElementById('historialLista');
    
    if (historial.length === 0) {
        lista.innerHTML = '<p class="text-center text-gray-500 py-5">No hay cálculos guardados</p>';
        return;
    }
    
    lista.innerHTML = historial.map(item => `
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
            <div class="flex justify-between items-start mb-2">
                <span class="font-semibold text-gray-800">${item.nombre}</span>
                <span class="text-sm text-gray-500">${item.fecha}</span>
            </div>
            <div class="text-sm text-gray-600 mb-3">
                💵 $${item.datos.resultados.precios.totalUnitario.toFixed(0)} | 
                🛒 ML: $${item.datos.resultados.precios.precioML.toFixed(0)}
            </div>
            <div class="flex gap-2">
                <button onclick="cargarDesdeHistorial(${item.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200">Cargar</button>
                <button onclick="verJSON(${item.id})" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200">Ver JSON</button>
                <button onclick="eliminarDelHistorial(${item.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function cargarDesdeHistorial(id) {
    const historial = JSON.parse(localStorage.getItem('historial3D') || '[]');
    const item = historial.find(h => h.id === id);
    
    if (!item) return;
    
    const entrada = item.datos.entrada;
    
    // Load fixed costs
    document.getElementById('costoFilamento').value = entrada.costosFijos.precioKg;
    document.getElementById('precioKwh').value = entrada.costosFijos.precioKwh;
    document.getElementById('consumoW').value = entrada.costosFijos.consumoW;
    document.getElementById('desgasteHoras').value = entrada.costosFijos.desgasteHoras;
    document.getElementById('valorImpresora').value = entrada.costosFijos.valorImpresora;
    document.getElementById('margenError').value = entrada.costosFijos.margenError;
    document.getElementById('comisionML').value = entrada.costosFijos.comisionML;
    
    // Load piece data
    document.getElementById('horasImpresion').value = entrada.pieza.horasImpresion;
    document.getElementById('minutosImpresion').value = entrada.pieza.minutosImpresion;
    document.getElementById('gramosFilamento').value = entrada.pieza.gramosFilamento;
    
    // Load production data
    document.getElementById('cantidad').value = entrada.produccion.cantidad;
    
    // Load extras
    document.getElementById('insumos').value = entrada.extras.insumos;
    document.getElementById('precioCadena').value = entrada.extras.precioCadena;
    document.getElementById('cantidadCadenas').value = entrada.extras.cantidadCadenas;
    
    // Load profit
    document.getElementById('ganancia').value = entrada.ganancia.porcentaje;
    
    alert('Datos cargados del historial');
    toggleHistorial();
    calcular();
}

function verJSON(id) {
    const historial = JSON.parse(localStorage.getItem('historial3D') || '[]');
    const item = historial.find(h => h.id === id);
    
    if (!item) return;
    
    const jsonString = JSON.stringify(item.datos, null, 2);
    
    navigator.clipboard.writeText(jsonString).then(() => {
        alert('JSON copiado al portapapeles!');
    }).catch(() => {
        prompt('Copia este JSON:', jsonString);
    });
}

function eliminarDelHistorial(id) {
    if (!confirm('¿Eliminar este cálculo del historial?')) return;
    
    let historial = JSON.parse(localStorage.getItem('historial3D') || '[]');
    historial = historial.filter(h => h.id !== id);
    localStorage.setItem('historial3D', JSON.stringify(historial));
    mostrarHistorial();
}

function limpiarHistorial() {
    if (!confirm('¿Eliminar TODO el historial?')) return;
    
    localStorage.setItem('historial3D', '[]');
    mostrarHistorial();
}


function toggleCostosFijos() {
    const costosFijos = document.getElementById('costosFijos');
    
    if (costosFijos.classList.contains('hidden')) {
        costosFijos.classList.remove('hidden');
    } else {
        costosFijos.classList.add('hidden');
    }
}

function toggleCollapsible(id) {
    const content = document.getElementById(id);
    const header = event.target.closest('[onclick*="toggleCollapsible"]');
    const icon = header.querySelector('.toggle-icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.textContent = '▲';
    } else {
        content.classList.add('hidden');
        icon.textContent = '▼';
    }
}

function showTab(tabId) {
    // Hide all tab contents
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.add('hidden'));
    
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.tab-button');
    allButtons.forEach(button => {
        button.classList.remove('active', 'border-b-2', 'border-green-500', 'border-blue-500', 'border-orange-500', 'text-gray-700', 'bg-white');
        button.classList.add('text-gray-500');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    const clickedButton = event.target;
    clickedButton.classList.add('active', 'text-gray-700', 'bg-white');
    clickedButton.classList.remove('text-gray-500');
    
    // Add appropriate border color based on tab
    if (tabId === 'venta-persona') {
        clickedButton.classList.add('border-b-2', 'border-green-500');
    } else if (tabId === 'ml-competencia') {
        clickedButton.classList.add('border-b-2', 'border-blue-500');
    } else if (tabId === 'ml-sin-competencia') {
        clickedButton.classList.add('border-b-2', 'border-orange-500');
    }
}

// Reference loading function
function cargarReferencias() {
    document.getElementById('costoFilamento').value = REF.precioKg;
    document.getElementById('precioKwh').value = REF.precioKwh;
    document.getElementById('consumoW').value = REF.consumoW;
    document.getElementById('desgasteHoras').value = REF.desgasteHoras;
    document.getElementById('valorImpresora').value = REF.valorImpresora;
    document.getElementById('margenError').value = REF.margenError;
    document.getElementById('comisionML').value = REF.comisionML;
    guardarDatos();
    alert('Referencias cargadas\nPLA: $20k/kg | kWh: $234\nConsumo: 120W | Vida útil: 15.000h\nImpresora: $1.363.990 | Comisión ML: 30%');
}

// Main calculation function
function calcular() {
    // Get input values
    const precioKg = parseFloat(document.getElementById('costoFilamento').value) || 0;
    const precioKwh = parseFloat(document.getElementById('precioKwh').value) || 0;
    const consumoW = parseFloat(document.getElementById('consumoW').value) || 0;
    const desgasteHoras = parseFloat(document.getElementById('desgasteHoras').value) || 0;
    const valorImpresora = parseFloat(document.getElementById('valorImpresora').value) || 0;
    const margenErrorPct = (parseFloat(document.getElementById('margenError').value) || 0) / 100;
    const comisionMLPct = (parseFloat(document.getElementById('comisionML').value) || 30) / 100;
    
    const horas = parseFloat(document.getElementById('horasImpresion').value) || 0;
    const minutos = parseFloat(document.getElementById('minutosImpresion').value) || 0;
    const tiempoTotalHoras = horas + (minutos / 60);
    
    const gramos = parseFloat(document.getElementById('gramosFilamento').value) || 0;
    const insumos = parseFloat(document.getElementById('insumos').value) || 0;
    let descuentoVentaPersona = parseFloat(document.getElementById('descuentoVentaPersona')?.value) || 20;
    // Validar que el descuento esté entre 0 y 50%
    if (descuentoVentaPersona < 0) descuentoVentaPersona = 0;
    if (descuentoVentaPersona > 50) descuentoVentaPersona = 50;

    // New fields
    const cantidad = parseFloat(document.getElementById('cantidad').value) || 1;
    const precioCadena = parseFloat(document.getElementById('precioCadena').value) || 0;
    const cantidadCadenas = parseFloat(document.getElementById('cantidadCadenas').value) || 0;

    // Validation
    if (precioKg === 0 || gramos === 0) {
        alert('Ingresa precio filamento y gramos');
        return;
    }

    // 1. MATERIAL COST
    const costoMaterial = (precioKg / 1000) * gramos;
    
    // 2. ELECTRICITY COST
    const costoElectricidad = ((consumoW / 1000) * precioKwh) * tiempoTotalHoras;
    
    // 3. WEAR (with 30% residual value)
    const valorDepreciable = valorImpresora * 0.7;
    const costoDesgaste = desgasteHoras > 0 ? (valorDepreciable / desgasteHoras) * tiempoTotalHoras : 0;
    
    // 4. BASE COST
    const costoBase = costoMaterial + costoElectricidad + costoDesgaste;
    
    // 5. ERROR MARGIN
    const margenError = costoBase * margenErrorPct;
    const costoConMargen = costoBase + margenError;
    
    // 6. CALCULAR PRECIOS ML (COMPETENCIA Y SIN COMPETENCIA)
    const gananciaCompetencia = parseFloat(localStorage.getItem('gananciaCompetencia')) || 175;
    const gananciaSinCompetencia = parseFloat(localStorage.getItem('gananciaSinCompetencia')) || 700;
    
    const multiplicadorCompetencia = 1 + (gananciaCompetencia / 100);
    const costoConGananciaCompetencia = costoConMargen * multiplicadorCompetencia;
    const totalCobrarCompetencia = costoConGananciaCompetencia + insumos;
    const precioMLCompetencia = totalCobrarCompetencia / (1 - comisionMLPct);
    
    const multiplicadorSinCompetencia = 1 + (gananciaSinCompetencia / 100);
    const costoConGananciaSinCompetencia = costoConMargen * multiplicadorSinCompetencia;
    const totalCobrarSinCompetencia = costoConGananciaSinCompetencia + insumos;
    const precioMLSinCompetencia = totalCobrarSinCompetencia / (1 - comisionMLPct);
    
    // 7. CALCULAR VENTA A PERSONA (descuento sobre ML Competencia)
    const totalCobrar = precioMLCompetencia * (1 - descuentoVentaPersona / 100);
    
    // 9. COST PER HOUR
    const costoPorHora = tiempoTotalHoras > 0 ? (costoElectricidad + costoDesgaste) / tiempoTotalHoras : 0;

    // 10. ROUND FINAL PRICES TO HUNDREDS
    const totalCobrarRedondeado = Math.round(totalCobrar / 100) * 100;
    const precioMLCompetenciaRedondeado = Math.round(precioMLCompetencia / 100) * 100;
    const precioMLSinCompetenciaRedondeado = Math.round(precioMLSinCompetencia / 100) * 100;
    
    // 11. CALCULATE REAL PROFIT BASED ON ROUNDED PRICES
    const costoTotal = costoConMargen + insumos;
    const gananciaReal = totalCobrarRedondeado - costoTotal;
    // Para ML, restar la comisión del precio
    const ingresoMLCompetencia = precioMLCompetenciaRedondeado * (1 - comisionMLPct);
    const ingresoMLSinCompetencia = precioMLSinCompetenciaRedondeado * (1 - comisionMLPct);
    const gananciaMLCompetencia = ingresoMLCompetencia - costoTotal;
    const gananciaMLSinCompetencia = ingresoMLSinCompetencia - costoTotal;
    
    // 12. FINAL CALCULATIONS WITH QUANTITY AND CHAINS
    const costoCadenas = precioCadena * cantidadCadenas;
    const totalDirecto = (totalCobrarRedondeado * cantidad) + costoCadenas;
    const totalMLCompetenciaFinal = (precioMLCompetenciaRedondeado * cantidad) + costoCadenas;
    const totalMLSinCompetenciaFinal = (precioMLSinCompetenciaRedondeado * cantidad) + costoCadenas;

    // 11. Calcular ratio de material
    const ratioMaterial = (costoMaterial / costoBase) * 100;
    let advertenciaHTML = '';

    // Generate results HTML
    let html = `
        ${advertenciaHTML}
        <!-- Tabs Navigation -->
        <div class="mt-4">
            <div class="flex flex-wrap border-b border-gray-200 mb-4">
                <button onclick="showTab('venta-persona')" class="tab-button active px-4 py-2 text-sm font-medium text-gray-700 bg-white border-b-2 border-green-500 focus:outline-none">
                    💵 Venta a Persona (-${descuentoVentaPersona}%)
                </button>
                <button onclick="showTab('ml-competencia')" class="tab-button px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">
                    🛒 ML Competencia (${gananciaCompetencia}%)
                </button>
                <button onclick="showTab('ml-sin-competencia')" class="tab-button px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">
                    ⭐ ML Sin Competencia (${gananciaSinCompetencia}%)
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="venta-persona" class="tab-content">
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-green-800 mb-3">💵 Venta a Persona (-${descuentoVentaPersona}% sobre ML Competencia)</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-green-200">
                            <span class="text-green-700">📊 Suma de Costos:</span>
                            <span class="font-bold text-green-800">$ ${Math.round(costoTotal).toLocaleString('es-AR')}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-green-200">
                            <span class="text-green-700">💰 Ganancia:</span>
                            <span class="font-bold text-green-800">$ ${Math.round(gananciaReal).toLocaleString('es-AR')}</span>
                        </div>
                        <div class="flex justify-between items-center py-3 bg-green-100 rounded px-3">
                            <span class="text-lg font-bold text-green-800">💵 Precio Final:</span>
                            <span class="text-xl font-bold text-green-800">$ ${formatoPrecioFinal(totalCobrarRedondeado)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="ml-competencia" class="tab-content hidden">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-blue-800 mb-3">🛒 ML Competencia (${gananciaCompetencia}%)</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-blue-200">
                            <span class="text-blue-700">📊 Suma de Costos:</span>
                            <span class="font-bold text-blue-800">$ ${Math.round(costoTotal).toLocaleString('es-AR')}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-blue-200">
                            <span class="text-blue-700">💰 Ganancia:</span>
                            <span class="font-bold text-blue-800">$ ${Math.round(gananciaMLCompetencia).toLocaleString('es-AR')}</span>
                        </div>
                        <div class="flex justify-between items-center py-3 bg-blue-100 rounded px-3">
                            <span class="text-lg font-bold text-blue-800">💵 Precio Final:</span>
                            <span class="text-xl font-bold text-blue-800">$ ${formatoPrecioFinal(precioMLCompetenciaRedondeado)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="ml-sin-competencia" class="tab-content hidden">
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-orange-800 mb-3">⭐ ML Sin Competencia (${gananciaSinCompetencia}%)</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-orange-200">
                            <span class="text-orange-700">📊 Suma de Costos:</span>
                            <span class="font-bold text-orange-800">$ ${Math.round(costoTotal).toLocaleString('es-AR')}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-orange-200">
                            <span class="text-orange-700">💰 Ganancia:</span>
                            <span class="font-bold text-orange-800">$ ${Math.round(gananciaMLSinCompetencia).toLocaleString('es-AR')}</span>
                        </div>
                        <div class="flex justify-between items-center py-3 bg-orange-100 rounded px-3">
                            <span class="text-lg font-bold text-orange-800">💵 Precio Final:</span>
                            <span class="text-xl font-bold text-orange-800">$ ${formatoPrecioFinal(precioMLSinCompetenciaRedondeado)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        ${generarAlertaGeneral(totalCobrarRedondeado, precioMLCompetenciaRedondeado, precioMLSinCompetenciaRedondeado)}
        
        <div class="mt-6">
            <div class="cursor-pointer p-3 bg-gray-50 border-l-4 border-gray-400 rounded-t flex justify-between items-center" onclick="toggleCollapsible('detalle-costos')">
                <span class="font-semibold text-gray-800">📊 Ver Desglose de Costos</span>
                <span class="toggle-icon text-gray-600">▼</span>
            </div>
            <div class="collapsible-content hidden p-4 bg-gray-50 rounded-b" id="detalle-costos">
                <div class="space-y-2">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-700">Material (${gramos}g):</span>
                        <span class="font-semibold text-gray-800">$ ${formatoArgentino(costoMaterial)}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-700">Electricidad (${tiempoTotalHoras.toFixed(2)}h):</span>
                        <span class="font-semibold text-gray-800">$ ${formatoArgentino(costoElectricidad)}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-700">Desgaste:</span>
                        <span class="font-semibold text-gray-800">$ ${formatoArgentino(costoDesgaste)}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 bg-gray-100 rounded px-3">
                        <span class="font-bold text-gray-800">💰 Costo Base:</span>
                        <span class="font-bold text-gray-800">$ ${formatoArgentino(costoBase)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <div class="cursor-pointer p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-t flex justify-between items-center" onclick="toggleCollapsible('detalle-margen')">
                <span class="font-semibold text-gray-800">⚠️ Ver Margen de Error</span>
                <span class="toggle-icon text-yellow-600">▼</span>
            </div>
            <div class="collapsible-content hidden p-4 bg-yellow-50 rounded-b" id="detalle-margen">
                <div class="space-y-2">
                    <div class="flex justify-between items-center py-2 border-b border-yellow-200">
                        <span class="text-gray-700">Margen de Error ${(margenErrorPct*100).toFixed(0)}%:</span>
                        <span class="font-semibold text-gray-800">$ ${formatoArgentino(margenError)}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 bg-yellow-100 rounded px-3">
                        <span class="font-bold text-gray-800">Con Margen de Error:</span>
                        <span class="font-bold text-gray-800">$ ${formatoArgentino(costoConMargen)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <div class="cursor-pointer p-3 bg-blue-50 border-l-4 border-blue-400 rounded-t flex justify-between items-center" onclick="toggleCollapsible('detalle-ganancia')">
                <span class="font-semibold text-gray-800">💰 Ver Detalle de Ganancia</span>
                <span class="toggle-icon text-blue-600">▼</span>
            </div>
            <div class="collapsible-content hidden p-4 bg-blue-50 rounded-b" id="detalle-ganancia">
                <div class="overflow-x-auto mt-2">
                    <table class="min-w-full border-collapse text-xs bg-white rounded shadow-sm overflow-hidden">
                        <thead>
                            <tr class="bg-gray-100 font-bold">
                                <th class="border border-gray-300 p-1 sm:p-2 text-left bg-gray-200 min-w-[100px]">Concepto</th>
                                <th class="border border-gray-300 p-1 sm:p-2 text-center bg-green-100 text-green-800 min-w-[80px]">💵 Venta a Persona</th>
                                <th class="border border-gray-300 p-1 sm:p-2 text-center bg-blue-100 text-blue-800 min-w-[80px]">🛒 ML Competencia</th>
                                <th class="border border-gray-300 p-1 sm:p-2 text-center bg-orange-100 text-orange-800 min-w-[80px]">⭐ ML Sin Competencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 p-1 sm:p-2 font-bold">💰 Ganancia Neta</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-700">$ ${Math.round(gananciaReal).toLocaleString('es-AR')}</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-700">$ ${Math.round(gananciaMLCompetencia).toLocaleString('es-AR')}</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-700">$ ${Math.round(gananciaMLSinCompetencia).toLocaleString('es-AR')}</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 p-1 sm:p-2 font-bold">📊 Recuperación Costos</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-yellow-700">$ ${Math.round(costoTotal).toLocaleString('es-AR')}</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-yellow-700">$ ${Math.round(costoTotal).toLocaleString('es-AR')}</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-yellow-700">$ ${Math.round(costoTotal).toLocaleString('es-AR')}</td>
                            </tr>
                            <tr class="bg-gray-50 hover:bg-gray-100 font-bold">
                                <td class="border border-gray-300 p-1 sm:p-2">💵 Total Recibido</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-green-700">$ ${formatoPrecioFinal(totalCobrarRedondeado)}</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-blue-700">$ ${formatoPrecioFinal(precioMLCompetenciaRedondeado)}</td>
                                <td class="border border-gray-300 p-1 sm:p-2 text-center text-orange-700">$ ${formatoPrecioFinal(precioMLSinCompetenciaRedondeado)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <div class="cursor-pointer p-3 bg-green-50 border-l-4 border-green-400 rounded-t flex justify-between items-center" onclick="toggleCollapsible('detalle-insumos')">
                <span class="font-semibold text-gray-800">🔧 Ver Insumos</span>
                <span class="toggle-icon text-green-600">▼</span>
            </div>
            <div class="collapsible-content hidden p-4 bg-green-50 rounded-b" id="detalle-insumos">
                <div class="flex justify-between items-center py-2 bg-green-100 rounded px-3">
                    <span class="font-bold text-gray-800">Insumos:</span>
                    <span class="font-bold text-gray-800">$ ${formatoArgentino(insumos)}</span>
                </div>
            </div>
        </div>
    `;

    // ADD QUANTITY TOTALS SECTION IF QUANTITY > 1 OR CHAINS
    if (cantidad > 1 || costoCadenas > 0) {
        html += `
        <div style="margin-top:20px">
            <h3 style="margin:0 0 15px 0;color:#495057">📦 Totales por Cantidad</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full border-collapse text-xs sm:text-sm bg-white rounded-lg shadow-sm overflow-hidden">
                    <thead>
                        <tr class="bg-gray-100 font-bold">
                            <th class="border border-gray-300 p-2 sm:p-3 text-left bg-gray-200 min-w-[120px]">Concepto</th>
                            <th class="border border-gray-300 p-2 sm:p-3 text-center bg-green-100 text-green-800 min-w-[100px]">💵 Venta a Persona</th>
                            <th class="border border-gray-300 p-2 sm:p-3 text-center bg-blue-100 text-blue-800 min-w-[100px]">🛒 ML Competencia</th>
                            <th class="border border-gray-300 p-2 sm:p-3 text-center bg-orange-100 text-orange-800 min-w-[100px]">⭐ ML Sin Competencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="hover:bg-gray-50">
                            <td class="border border-gray-300 p-2 sm:p-3 font-bold">📊 Cantidad</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center">${cantidad} unidades</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center">${cantidad} unidades</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center">${cantidad} unidades</td>
                        </tr>`;
        
        if (costoCadenas > 0) {
            html += `
                        <tr class="hover:bg-gray-50">
                            <td class="border border-gray-300 p-2 sm:p-3 font-bold">🔗 Cadenas</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center text-yellow-700">$ ${Math.round(costoCadenas).toLocaleString('es-AR')}</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center text-yellow-700">$ ${Math.round(costoCadenas).toLocaleString('es-AR')}</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center text-yellow-700">$ ${Math.round(costoCadenas).toLocaleString('es-AR')}</td>
                        </tr>`;
        }
        
        html += `
                        <tr class="bg-gray-50 hover:bg-gray-100 font-bold">
                            <td class="border border-gray-300 p-2 sm:p-3">💵 TOTAL FINAL</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center text-green-700 text-sm sm:text-lg">$ ${formatoPrecioFinal(totalDirecto)}</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center text-blue-700 text-sm sm:text-lg">$ ${formatoPrecioFinal(totalMLCompetenciaFinal)}</td>
                            <td class="border border-gray-300 p-2 sm:p-3 text-center text-orange-700 text-sm sm:text-lg">$ ${formatoPrecioFinal(totalMLSinCompetenciaFinal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // Display results
    document.getElementById('detalleResultados').innerHTML = html;
    document.getElementById('resultados').classList.remove('hidden');
    guardarDatos();
    
    // Save to history
    const datosCompletos = {
        entrada: {
            costosFijos: {
                precioKg, precioKwh, consumoW, desgasteHoras, valorImpresora,
                margenError: margenErrorPct * 100,
                comisionML: comisionMLPct * 100
            },
            pieza: { horasImpresion: horas, minutosImpresion: minutos, tiempoTotalHoras, gramosFilamento: gramos },
            produccion: { cantidad },
            extras: { insumos, precioCadena, cantidadCadenas },
            descuentoVentaPersona: descuentoVentaPersona
        },
        resultados: {
            desgloseBase: {
                costoMaterial: parseFloat(costoMaterial.toFixed(2)),
                costoElectricidad: parseFloat(costoElectricidad.toFixed(2)),
                costoDesgaste: parseFloat(costoDesgaste.toFixed(2)),
                costoBase: parseFloat(costoBase.toFixed(2)),
                ratioMaterial: parseFloat(ratioMaterial.toFixed(2))
            },
            margenYGanancia: {
                margenError: parseFloat(margenError.toFixed(2)),
                costoConMargen: parseFloat(costoConMargen.toFixed(2)),
                gananciaAplicada: parseFloat((costoConGananciaCompetencia - costoConMargen).toFixed(2)),
                costoConGanancia: parseFloat(costoConGananciaCompetencia.toFixed(2))
            },
            precios: {
                insumos: parseFloat(insumos.toFixed(2)),
                totalUnitario: parseFloat(totalCobrar.toFixed(2)),
                precioML: parseFloat(precioMLCompetencia.toFixed(2)),
                precioMLCompetencia: parseFloat(precioMLCompetencia.toFixed(2)),
                precioMLSinCompetencia: parseFloat(precioMLSinCompetencia.toFixed(2)),
                gananciaNetaUnitaria: parseFloat((costoConGananciaCompetencia - costoConMargen).toFixed(2)),
                gananciaCompetencia: parseFloat((costoConGananciaCompetencia - costoConMargen).toFixed(2)),
                gananciaSinCompetencia: parseFloat((costoConGananciaSinCompetencia - costoConMargen).toFixed(2))
            },
            totalesCantidad: {
                cantidad,
                costoCadenas: parseFloat(costoCadenas.toFixed(2)),
                totalDirecto: parseFloat(totalDirecto.toFixed(2)),
                totalMLCompetenciaFinal: parseFloat(totalMLCompetenciaFinal.toFixed(2)),
                totalMLSinCompetenciaFinal: parseFloat(totalMLSinCompetenciaFinal.toFixed(2))
            }
        }
    };
    guardarEnHistorial(datosCompletos);
}

// Data persistence functions
function guardarDatos() {
    const datos = {
        costoFilamento: document.getElementById('costoFilamento').value,
        precioKwh: document.getElementById('precioKwh').value,
        consumoW: document.getElementById('consumoW').value,
        desgasteHoras: document.getElementById('desgasteHoras').value,
        valorImpresora: document.getElementById('valorImpresora').value,
        margenError: document.getElementById('margenError').value,
        comisionML: document.getElementById('comisionML').value,
        horasImpresion: document.getElementById('horasImpresion').value,
        minutosImpresion: document.getElementById('minutosImpresion').value,
        gramosFilamento: document.getElementById('gramosFilamento').value,
        insumos: document.getElementById('insumos').value,
        descuentoVentaPersona: document.getElementById('descuentoVentaPersona').value,
        cantidad: document.getElementById('cantidad').value,
        precioMercadoLibre: document.getElementById('precioMercadoLibre').value,
        precioCadena: document.getElementById('precioCadena').value,
        cantidadCadenas: document.getElementById('cantidadCadenas').value,
    };
    sessionStorage.setItem('calc3D', JSON.stringify(datos));
}

function cargarDatos() {
    const datos = sessionStorage.getItem('calc3D');
    if (datos) {
        const obj = JSON.parse(datos);
        Object.keys(obj).forEach(key => {
            const elemento = document.getElementById(key);
            if (elemento && obj[key]) {
                // Validar descuentoVentaPersona
                if (key === 'descuentoVentaPersona') {
                    let valor = parseFloat(obj[key]);
                    if (isNaN(valor) || valor < 0) valor = 20;
                    if (valor > 50) valor = 50;
                    elemento.value = valor;
                } else {
                    elemento.value = obj[key];
                }
            }
        });
    } else {
        cargarReferencias();
        document.getElementById('descuentoVentaPersona').value = '5';
    }
    
    // Cargar valores de ganancias de test si existen
    const descuentoVentaPersonaTest = localStorage.getItem('descuentoVentaPersonaTest');
    const gananciaCompetencia = localStorage.getItem('gananciaCompetencia');
    const gananciaSinCompetencia = localStorage.getItem('gananciaSinCompetencia');
    
    if (descuentoVentaPersonaTest) {
        const elemento = document.getElementById('descuentoVentaPersonaTest');
        if (elemento) elemento.value = descuentoVentaPersonaTest;
    }
    
    if (gananciaCompetencia) {
        const elemento = document.getElementById('gananciaCompetenciaTest');
        if (elemento) elemento.value = gananciaCompetencia;
    }
    
    if (gananciaSinCompetencia) {
        const elemento = document.getElementById('gananciaSinCompetenciaTest');
        if (elemento) elemento.value = gananciaSinCompetencia;
    }
}

// Export function
function exportarJSON() {
    // Read input values
    const precioKg = parseFloat(document.getElementById('costoFilamento').value) || 0;
    const precioKwh = parseFloat(document.getElementById('precioKwh').value) || 0;
    const consumoW = parseFloat(document.getElementById('consumoW').value) || 0;
    const desgasteHoras = parseFloat(document.getElementById('desgasteHoras').value) || 0;
    const valorImpresora = parseFloat(document.getElementById('valorImpresora').value) || 0;
    const margenErrorPct = (parseFloat(document.getElementById('margenError').value) || 0) / 100;
    const comisionMLPct = (parseFloat(document.getElementById('comisionML').value) || 30) / 100;
    
    const horas = parseFloat(document.getElementById('horasImpresion').value) || 0;
    const minutos = parseFloat(document.getElementById('minutosImpresion').value) || 0;
    const tiempoTotalHoras = horas + (minutos / 60);
    
    const gramos = parseFloat(document.getElementById('gramosFilamento').value) || 0;
    const insumos = parseFloat(document.getElementById('insumos').value) || 0;
    const descuentoVentaPersona = parseFloat(document.getElementById('descuentoVentaPersona')?.value) || 20;
    
    const cantidad = parseFloat(document.getElementById('cantidad').value) || 1;
    const precioCadena = parseFloat(document.getElementById('precioCadena').value) || 0;
    const cantidadCadenas = parseFloat(document.getElementById('cantidadCadenas').value) || 0;
    
    // Calculate results
    const costoMaterial = (precioKg / 1000) * gramos;
    const costoElectricidad = ((consumoW / 1000) * precioKwh) * tiempoTotalHoras;
    const valorDepreciable = valorImpresora * 0.7;
    const costoDesgaste = desgasteHoras > 0 ? (valorDepreciable / desgasteHoras) * tiempoTotalHoras : 0;
    const costoBase = costoMaterial + costoElectricidad + costoDesgaste;
    const margenError = costoBase * margenErrorPct;
    const costoConMargen = costoBase + margenError;
    const costoConGanancia = costoConMargen * multiplicador;
    const totalCobrar = costoConGanancia + insumos;
    const precioML = totalCobrar / (1 - comisionMLPct);
    const gananciaNetoUnitario = costoConGanancia - costoConMargen;
    
    const costoCadenas = precioCadena * cantidadCadenas;
    const totalDirecto = (totalCobrar * cantidad) + costoCadenas;
    const totalMLFinal = (precioML * cantidad) + costoCadenas;
    
    const ratioMaterial = (costoMaterial / costoBase) * 100;
    
    const datos = {
        entrada: {
            costosFijos: {
                precioKg: precioKg,
                precioKwh: precioKwh,
                consumoW: consumoW,
                desgasteHoras: desgasteHoras,
                valorImpresora: valorImpresora,
                margenError: parseFloat(document.getElementById('margenError').value) || 0,
                comisionML: parseFloat(document.getElementById('comisionML').value) || 0
            },
            pieza: {
                horasImpresion: horas,
                minutosImpresion: minutos,
                tiempoTotalHoras: tiempoTotalHoras,
                gramosFilamento: gramos
            },
            produccion: {
                cantidad: cantidad
            },
            extras: {
                insumos: insumos,
                precioCadena: precioCadena,
                cantidadCadenas: cantidadCadenas
            },
            descuentoVentaPersona: descuentoVentaPersona
        },
        resultados: {
            desgloseBase: {
                costoMaterial: parseFloat(costoMaterial.toFixed(2)),
                costoElectricidad: parseFloat(costoElectricidad.toFixed(2)),
                costoDesgaste: parseFloat(costoDesgaste.toFixed(2)),
                costoBase: parseFloat(costoBase.toFixed(2)),
                ratioMaterial: parseFloat(ratioMaterial.toFixed(2))
            },
            margenYGanancia: {
                margenError: parseFloat(margenError.toFixed(2)),
                costoConMargen: parseFloat(costoConMargen.toFixed(2)),
                gananciaAplicada: parseFloat(gananciaNetoUnitario.toFixed(2)),
                costoConGanancia: parseFloat(costoConGanancia.toFixed(2))
            },
            precios: {
                insumos: parseFloat(insumos.toFixed(2)),
                totalUnitario: parseFloat(totalCobrar.toFixed(2)),
                precioML: parseFloat(precioML.toFixed(2)),
                gananciaNetaUnitaria: parseFloat(gananciaNetoUnitario.toFixed(2))
            },
            totalesCantidad: {
                cantidad: cantidad,
                costoCadenas: parseFloat(costoCadenas.toFixed(2)),
                totalDirecto: parseFloat(totalDirecto.toFixed(2)),
                totalMLFinal: parseFloat(totalMLFinal.toFixed(2))
            }
        }
    };
    
    const jsonString = JSON.stringify(datos, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
        alert('JSON copiado al portapapeles!\n\nIncluye entrada y resultados calculados.');
    }).catch(() => {
        // Fallback: show in prompt
        prompt('Copia este JSON:', jsonString);
    });
}

// Reset function
function resetear() {
    if (confirm('¿Borrar todos los datos?')) {
        sessionStorage.removeItem('calc3D');
        document.querySelectorAll('input').forEach(i => i.value = '');
        document.getElementById('margenError').value = '30';
        document.getElementById('comisionML').value = '30';
        document.getElementById('descuentoVentaPersona').value = '20';
        document.getElementById('minutosImpresion').value = '0';
        document.getElementById('insumos').value = '0';
        document.getElementById('cantidad').value = '1';
        document.getElementById('precioMercadoLibre').value = '0';
        document.getElementById('precioCadena').value = '0';
        document.getElementById('cantidadCadenas').value = '0';
        document.getElementById('resultados').classList.add('hidden');
    }
}


// Event listeners for auto-save
if (typeof document !== 'undefined') {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', guardarDatos);
    });
}

// Event listener específico para recalcular cuando cambie el descuento de venta persona
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const descuentoInput = document.getElementById('descuentoVentaPersona');
        const descuentoTestInput = document.getElementById('descuentoVentaPersonaTest');
        
        // Sincronizar valores iniciales
        if (descuentoInput && descuentoTestInput) {
            const valorInicial = descuentoInput.value || 5;
            descuentoTestInput.value = valorInicial;
            localStorage.setItem('descuentoVentaPersonaTest', valorInicial);
        }
        
        if (descuentoInput) {
            descuentoInput.addEventListener('change', () => {
                // Sincronizar con el campo de test
                if (descuentoTestInput) {
                    descuentoTestInput.value = descuentoInput.value;
                    localStorage.setItem('descuentoVentaPersonaTest', descuentoInput.value);
                }
                
                // Recalcular automáticamente cuando cambie el descuento
                if (document.getElementById('resultados') && !document.getElementById('resultados').classList.contains('hidden')) {
                    calcular();
                }
            });
        }
        
        if (descuentoTestInput) {
            descuentoTestInput.addEventListener('change', () => {
                // Sincronizar con el campo de configuración
                if (descuentoInput) {
                    descuentoInput.value = descuentoTestInput.value;
                }
                localStorage.setItem('descuentoVentaPersonaTest', descuentoTestInput.value);
            });
        }
    });
}


