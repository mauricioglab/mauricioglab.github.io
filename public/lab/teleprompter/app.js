// Función para extraer definición de las instrucciones (primeras líneas hasta punto o salto de línea doble)
function extractDefinition(instructions) {
    if (!instructions) return 'Definición no disponible.';
    
    // Limpiar y obtener el texto
    const text = instructions.trim();
    
    // Buscar hasta el primer salto de línea doble o "Ejemplo:" o límite de caracteres
    let definition = text;
    
    // Cortar en el primer bloque significativo
    const markers = ['\n\n', '\nEjemplo:', '\n-', '\n1.', '\n•'];
    let endIndex = text.length;
    
    for (const marker of markers) {
        const idx = text.indexOf(marker);
        if (idx > 0 && idx < endIndex) {
            endIndex = idx;
        }
    }
    
    definition = text.substring(0, endIndex).trim();
    
    // Si es muy largo, cortar en el último punto dentro de los primeros 300 caracteres
    if (definition.length > 300) {
        const truncated = definition.substring(0, 300);
        const lastPeriod = truncated.lastIndexOf('.');
        if (lastPeriod > 100) {
            definition = truncated.substring(0, lastPeriod + 1);
        } else {
            definition = truncated + '...';
        }
    }
    
    return definition;
}

// Sidebar items configuration
const sidebarItems = [
    { id: 'priming', title: 'Priming', icon: 'fas fa-fill-drip', group: 'Técnicas', instructions: 'primingInstructions' },
    { id: 'zero_shot', title: 'Zero-Shot', icon: 'fas fa-bolt', group: 'Técnicas', instructions: 'zeroShotInstructions' },
    { id: 'few_shot', title: 'Few-Shot', icon: 'fas fa-list', group: 'Técnicas', instructions: 'fewShotInstructions' },
    { id: 'chain_thought', title: 'Chain-of-Thought', icon: 'fas fa-project-diagram', group: 'Técnicas', instructions: 'chainOfThoughtInstructions' },
    { id: 'zero_chain', title: 'Zero CoT', icon: 'fas fa-magic', group: 'Técnicas', instructions: 'zeroChainOfThoughtInstructions' },
    { id: 'roleplaying', title: 'Role Playing', icon: 'fas fa-user-tag', group: 'Técnicas', instructions: 'rolePlayingInstructions' },
    { id: 'iterative', title: 'Iterative', icon: 'fas fa-sync', group: 'Técnicas', instructions: 'iterativeInstructions' },

    { id: 'detalles', title: 'Detalles Relevantes', icon: 'fas fa-info-circle', group: 'Estrategias', instructions: 'detallesInstrucciones' },
    { id: 'rol', title: 'Adoptar Personalidad', icon: 'fas fa-user-md', group: 'Estrategias', instructions: 'rolInstrucciones' },
    { id: 'delimitadores', title: 'Usar Delimitadores', icon: 'fas fa-brackets-curly', group: 'Estrategias', instructions: 'delimitadoresInstrucciones' },
    { id: 'pasos', title: 'Especificar Pasos', icon: 'fas fa-shoe-prints', group: 'Estrategias', instructions: 'pasosInstrucciones' },
    { id: 'ejemplos', title: 'Añadir Ejemplos', icon: 'fas fa-vial', group: 'Estrategias', instructions: 'ejemplosInstrucciones' },
    { id: 'longitud', title: 'Especificar Longitud', icon: 'fas fa-ruler-horizontal', group: 'Estrategias', instructions: 'longitudInstrucciones' },
    { id: 'referencia', title: 'Texto de Referencia', icon: 'fas fa-book-open', group: 'Estrategias', instructions: 'referenciaInstrucciones' },
    { id: 'subtareas', title: 'Subtareas', icon: 'fas fa-tasks', group: 'Estrategias', instructions: 'subtareasInstrucciones' },
    { id: 'resumir_dialogos', title: 'Resumir Diálogos', icon: 'fas fa-comments', group: 'Estrategias', instructions: 'resumirDialogosInstrucciones' },
    { id: 'resumir_documentos', title: 'Resumir Documentos', icon: 'fas fa-file-alt', group: 'Estrategias', instructions: 'resumirDocumentosInstrucciones' },
    { id: 'tiempo_pensar', title: 'Tiempo para Pensar', icon: 'fas fa-brain', group: 'Estrategias', instructions: 'tiempoPensarInstrucciones' },
    { id: 'perdio_algo', title: '¿Se perdió algo?', icon: 'fas fa-search-plus', group: 'Estrategias', instructions: 'perdioAlgoInstrucciones' },
    { id: 'componentes_4', title: 'Estructura 4 Comp.', icon: 'fas fa-puzzle-piece', group: 'Estrategias', instructions: 'componentes4Instrucciones' },
    { id: 'evitar_alucinaciones', title: 'Evitar Alucinaciones', icon: 'fas fa-shield-virus', group: 'Estrategias', instructions: 'evitarAlucinacionesInstrucciones' },
    { id: 'privacidad', title: 'Privacidad/Sensible', icon: 'fas fa-user-secret', group: 'Estrategias', instructions: 'privacidadInstrucciones' },
    { id: 'refinamiento', title: 'Refinamiento Iterativo', icon: 'fas fa-vial-circle-check', group: 'Estrategias', instructions: 'refinamientoIterativoInstrucciones' },
    { id: 'framework_completo', title: 'Framework Completo', icon: 'fas fa-drafting-compass', group: 'Estrategias', instructions: 'frameworkCompletoInstrucciones' },
    { id: 'division_gradual', title: 'División Gradual', icon: 'fas fa-level-down-alt', group: 'Estrategias', instructions: 'divisionGradualInstrucciones' },
    { id: 'jailbreak', title: 'Jailbreak', icon: 'fas fa-unlock-alt', group: 'Antipatrones', instructions: 'jailbreakInstructions' },
    { id: 'personalidades_duales', title: 'Personalidades Duales', icon: 'fas fa-people-arrows', group: 'Antipatrones', instructions: 'personalidadesDualesInstructions' },
    { id: 'obra_teatro', title: 'Obra de Teatro', icon: 'fas fa-masks-theater', group: 'Antipatrones', instructions: 'obraTeatroInstructions' },
    { id: 'prefix_injection', title: 'Prefix Injection', icon: 'fas fa-indent', group: 'Antipatrones', instructions: 'prefixInjectionInstructions' },
    { id: 'override_instrucciones', title: 'Override Instrucciones', icon: 'fas fa-eraser', group: 'Antipatrones', instructions: 'overrideInstruccionesInstructions' },
    { id: 'negacion_inversa', title: 'Negación Inversa', icon: 'fas fa-reverse', group: 'Antipatrones', instructions: 'negacionInversaInstructions' },
    { id: 'prompt_leaking', title: 'Prompt Leaking', icon: 'fas fa-faucet', group: 'Antipatrones', instructions: 'promptLeakingInstructions' },
    { id: 'escalacion_gradual', title: 'Escalación Gradual', icon: 'fas fa-stairs', group: 'Antipatrones', instructions: 'escalacionGradualInstructions' },
    { id: 'fragmentacion', title: 'Fragmentación', icon: 'fas fa-puzzle-piece', group: 'Antipatrones', instructions: 'fragmentacionInstructions' },
    { id: 'encoding_ofuscacion', title: 'Encoding/Ofuscación', icon: 'fas fa-barcode', group: 'Antipatrones', instructions: 'encodingOfuscacionInstructions' },

    { id: 'generated_knowledge', title: 'Generated Knowledge', icon: 'fas fa-atom', group: 'Aprendizaje de Modelos', instructions: 'generatedKnowledgeInstructions', standalone: true },
    { id: 'least_to_most', title: 'Least-to-Most', icon: 'fas fa-layer-group', group: 'Aprendizaje de Modelos', instructions: 'leastToMostInstructions', standalone: true },
    { id: 'self_ask', title: 'Self-Ask', icon: 'fas fa-question', group: 'Aprendizaje de Modelos', instructions: 'selfAskInstructions', standalone: true },
    { id: 'react', title: 'ReAct', icon: 'fas fa-sync-alt', group: 'Aprendizaje de Modelos', instructions: 'reactInstructions', standalone: true }
];

let selectedItem = null;
const generatedResults = {}; // Store results for each technique/strategy

function setStatus(t) {
    const statusElem = document.getElementById('status');
    if (statusElem) statusElem.textContent = t;
}

function getPrompt() {
    const promptElem = document.getElementById('prompt');
    return promptElem ? promptElem.value.trim() : '';
}

function selectItem(item) {
    // Remove active class from all items
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.remove('active', 'font-semibold');
        el.classList.remove('bg-[var(--bs-primary-bg-subtle)]', 'border-blue-600', 'text-[var(--bs-primary-text-emphasis)]');
        el.classList.add('border-transparent', 'text-[var(--bs-body-color)]');
    });

    // Add active class to clicked item
    const elem = document.querySelector(`[data-item-id="${item.id}"]`);
    if (elem) {
        elem.classList.add('active', 'font-semibold', 'bg-[var(--bs-primary-bg-subtle)]', 'border-blue-600', 'text-[var(--bs-primary-text-emphasis)]');
        elem.classList.remove('border-transparent', 'text-[var(--bs-body-color)]');
    }

    // Update selected item
    selectedItem = item;

    // Update headers
    const titleElem = document.getElementById('selectedTitle');
    if (titleElem) titleElem.innerHTML = `<i class="${item.icon}"></i> ${item.title}`;

    const iconElem = document.getElementById('outputIcon');
    if (iconElem) iconElem.className = item.icon;

    const outTitleElem = document.getElementById('outputTitle');
    if (outTitleElem) outTitleElem.textContent = `Prompt Avanzado: ${item.title}`;

    // Update Instructions panel
    let instructions = window[item.instructions] || null;
    
    // Update Definition panel (extraído de las instrucciones)
    const defElem = document.getElementById('definitionOutput');
    if (defElem) {
        const definition = extractDefinition(instructions);
        defElem.textContent = definition;
    }
    const instrElem = document.getElementById('instructionsOutput');

    if (instrElem) {
        if (instructions) {
            instrElem.value = instructions;
            instrElem.classList.remove('teleprompter-active');
            void instrElem.offsetWidth; // Force reflow
            instrElem.classList.add('teleprompter-active');
        } else {
            instrElem.value = `Cargando instrucciones para ${item.title}...`;
        }
    }

    // Show result in right panel
    const result = generatedResults[item.id];
    const outputElem = document.getElementById('output');

    if (outputElem) {
        if (result) {
            outputElem.textContent = result;
            outputElem.classList.remove('teleprompter-active');
            void outputElem.offsetWidth;
            outputElem.classList.add('teleprompter-active');
        } else {
            outputElem.textContent = "Haz clic en 'Generar' para ver el prompt transformado.";
        }
    }
}

function renderSidebar() {
    const container = document.getElementById('sidebarContent');
    if (!container) return;

    container.innerHTML = '';
    let currentGroup = '';
    let currentGroupDiv = null;
    let currentContentDiv = null;

    sidebarItems.forEach(item => {
        if (item.group !== currentGroup) {
            currentGroup = item.group;

            currentGroupDiv = document.createElement('div');
            currentGroupDiv.className = 'item-group border-b border-[var(--bs-border-color)]';
            if (currentGroup !== 'Técnicas') currentGroupDiv.classList.add('collapsed');

            const header = document.createElement('div');
            header.className = 'item-group-header px-4 py-3 text-xs font-bold uppercase cursor-pointer flex justify-between items-center text-[var(--bs-secondary-color)] bg-[var(--bs-tertiary-bg)] hover:bg-[var(--bs-secondary-bg)] transition-colors border-b border-[var(--bs-border-color)]';

            let groupIcon = '';
            if (currentGroup === 'Técnicas') groupIcon = '<i class="fas fa-tools"></i> ';
            else if (currentGroup === 'Estrategias') groupIcon = '<i class="fas fa-lightbulb"></i> ';
            else if (currentGroup === 'Antipatrones') groupIcon = '<i class="fas fa-exclamation-triangle"></i> ';
            else if (currentGroup === 'Aprendizaje de Modelos') groupIcon = '<i class="fas fa-graduation-cap"></i> ';

            header.innerHTML = `<span class="flex items-center gap-2">${groupIcon}${currentGroup}</span> <i class="fas fa-chevron-down toggle-icon text-[0.7rem] transition-transform duration-300"></i>`;
            header.onclick = (e) => {
                const group = e.currentTarget.parentElement;
                const wasCollapsed = group.classList.contains('collapsed');
                
                // Cerrar todos los grupos (comportamiento acordeón)
                document.querySelectorAll('.item-group').forEach(g => {
                    g.classList.add('collapsed');
                });
                
                // Si estaba cerrado, abrirlo
                if (wasCollapsed) {
                    group.classList.remove('collapsed');
                }
            };

            currentContentDiv = document.createElement('div');
            currentContentDiv.className = 'item-group-content';

            currentGroupDiv.appendChild(header);
            currentGroupDiv.appendChild(currentContentDiv);
            container.appendChild(currentGroupDiv);
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'sidebar-item px-4 py-2.5 cursor-pointer flex items-center gap-3 text-sm text-[var(--bs-body-color)] border-l-[3px] border-transparent hover:bg-[var(--bs-tertiary-bg)] hover:border-blue-600 transition-all';
        itemDiv.setAttribute('data-item-id', item.id);
        itemDiv.innerHTML = `<i class="${item.icon} w-5 text-center flex-shrink-0"></i> <span class="flex-1">${item.title}</span>`;
        itemDiv.onclick = () => selectItem(item);

        if (currentContentDiv) currentContentDiv.appendChild(itemDiv);
    });

    if (sidebarItems.length > 0) {
        selectItem(sidebarItems[0]);
    }
}

function filterSidebar() {
    const searchInput = document.getElementById('sidebarSearch');
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const items = document.querySelectorAll('.sidebar-item');
    const groups = document.querySelectorAll('.item-group');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const matches = text.includes(query);
        item.style.display = matches ? 'flex' : 'none';
    });

    groups.forEach(group => {
        const visibleItems = group.querySelectorAll('.sidebar-item:not([style*="display: none"])');
        if (query.length > 0 && visibleItems.length > 0) {
            group.classList.remove('collapsed');
            group.style.display = 'block';
        } else if (query.length > 0 && visibleItems.length === 0) {
            group.style.display = 'none';
        } else {
            group.style.display = 'block';
            const headerSpan = group.querySelector('.item-group-header span');
            const title = headerSpan ? headerSpan.textContent : '';
            if (title !== 'Técnicas') group.classList.add('collapsed');
            else group.classList.remove('collapsed');
        }
    });
}

async function callOpenRouter(input, apiKey) {
    if (!apiKey) throw new Error('No API key provided');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: [{ role: 'user', content: input }]
        })
    });
    if (!res.ok) throw new Error('OpenRouter API error: ' + res.status);
    const data = await res.json();
    if (data.choices && data.choices.length && data.choices[0].message) return data.choices[0].message.content;
    return JSON.stringify(data);
}

async function generateAll() {
    const prompt = getPrompt();
    if (!prompt) {
        alert('Introduce un prompt antes de generar.');
        return;
    }

    const apiKeyInput = document.getElementById('openRouterKey');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';

    if (!apiKey) {
        alert('⚠️ La API Key es obligatoria para procesar los prompts.\n\nConsigue una en:\n- OpenRouter: https://openrouter.ai/keys\n- Google AI Studio: https://aistudio.google.com/app/apikey');
        if (apiKeyInput) apiKeyInput.focus();
        return;
    }

    const generalInput = document.getElementById('generalInstructions');
    const general = generalInput ? generalInput.value.trim() : '';

    setStatus('Generando para todas las técnicas...');

    const prependGeneral = (text) => general ? general + '\n\n' + text : text;
    const tasks = [];

    sidebarItems.forEach(item => {
        tasks.push((async () => {
            const instructions = window[item.instructions];
            if (!instructions) {
                generatedResults[item.id] = 'Instrucciones no disponibles';
                return;
            }

            const inText = prependGeneral(instructions + '\n' + prompt);
            try {
                const out = await callOpenRouter(inText, apiKey);
                generatedResults[item.id] = out;
            } catch (e) {
                generatedResults[item.id] = 'Error: ' + e.message;
            }
        })());
    });

    await Promise.all(tasks);

    const itemToShow = selectedItem || sidebarItems[0];
    if (itemToShow) {
        const result = generatedResults[itemToShow.id];
        const outputElem = document.getElementById('output');
        if (outputElem && result) {
            outputElem.textContent = result;
            outputElem.classList.remove('teleprompter-active');
            void outputElem.offsetWidth;
            outputElem.classList.add('teleprompter-active');
        }
    }

    setStatus('Completado ✓');
}

// Theme Toggle Logic
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');

    function updateIcon(theme) {
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }

    // Initial icon state
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    updateIcon(currentTheme);

    themeToggle.onclick = () => {
        const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-bs-theme', newTheme);
        sessionStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    };
}

// Title Teleprompter Animation
function initTitleAnimation() {
    const titleHeader = document.querySelector('.sidebar-header h4');
    if (!titleHeader) return;

    setInterval(() => {
        titleHeader.classList.remove('title-animate', 'whitespace-nowrap', 'block', 'w-full');
        void titleHeader.offsetWidth; // Force reflow
        titleHeader.classList.add('title-animate', 'whitespace-nowrap', 'block', 'w-full');
    }, 300000); // Trigger every 5 minutes
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initTitleAnimation();

    // Sync instructions editing to memory
    const instrOutput = document.getElementById('instructionsOutput');
    if (instrOutput) {
        instrOutput.oninput = () => {
            if (selectedItem && selectedItem.instructions) {
                window[selectedItem.instructions] = instrOutput.value;
            }
        };
    }

    setTimeout(() => {
        console.log('Checking available instructions:');
        sidebarItems.forEach(item => {
            const hasInstructions = typeof window[item.instructions] !== 'undefined';
            console.log(`${item.title}: ${hasInstructions ? '✓' : '✗'} (${item.instructions})`);
        });

        const genInstrElem = document.getElementById('generalInstructions');
        if (genInstrElem) {
            genInstrElem.value = (typeof generalInstructions !== 'undefined') ? generalInstructions : 'Las respuestas deben ser en español.';
        }
        renderSidebar();
    }, 300);
});
