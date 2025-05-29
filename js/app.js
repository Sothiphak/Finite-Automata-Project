// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    let currentFA = new FiniteAutomaton();

    // DOM Elements for FA Design
    const stateNameInput = document.getElementById('stateName');
    const isFinalCheckbox = document.getElementById('isFinal');
    const addStateBtn = document.getElementById('addStateBtn');

    const alphabetSymbolInput = document.getElementById('alphabetSymbol');
    const addSymbolBtn = document.getElementById('addSymbolBtn');

    const startStateSelect = document.getElementById('startStateSelect');
    const setStartBtn = document.getElementById('setStartBtn');

    const fromStateSelect = document.getElementById('fromStateSelect');
    const transitionSymbolInput = document.getElementById('transitionSymbol');
    const toStateSelect = document.getElementById('toStateSelect');
    const addTransitionBtn = document.getElementById('addTransitionBtn');

    // DOM Elements for Operations
    const isDeterministicBtn = document.getElementById('isDeterministicBtn');
    const testStringInput = document.getElementById('testStringInput');
    const testStringBtn = document.getElementById('testStringBtn');
    const convertToDFABtn = document.getElementById('convertToDFABtn');
    const minimizeDFABtn = document.getElementById('minimizeDFABtn');

    // DOM Elements for Management
    const clearFABtn = document.getElementById('clearFABtn');
    const faNameSaveFileInput = document.getElementById('faNameSaveFile'); // For file download name
    const saveFAToFileBtn = document.getElementById('saveFAToFileBtn');    // For triggering file download
    const loadFAFromFileInput = document.getElementById('loadFAFromFileInput'); // The actual <input type="file">

    // DOM Elements for localStorage Management
    const faNameLocalStorageInput = document.getElementById('faNameLocalStorage');
    const saveFAToLSBtn = document.getElementById('saveFAToLSBtn');
    const localStorageFASelector = document.getElementById('localStorageFASelector'); // The <ul> element

    // Display Areas
    const faDefinitionOutput = document.getElementById('faDefinitionOutput');
    const operationResultOutput = document.getElementById('operationResultOutput');

    // --- Helper Functions ---

    function updateStateSelects() {
        const stateNames = Array.from(currentFA.states.keys()).sort();
        const createOption = name => `<option value="${name}">${name}</option>`;

        const defaultOption = '<option value="">--Select State--</option>';
        const fromDefaultOption = '<option value="">--Select From--</option>';
        const toDefaultOption = '<option value="">--Select To--</option>';

        // Preserve current selections if possible
        const currentStartVal = startStateSelect.value;
        const currentFromVal = fromStateSelect.value;
        const currentToVal = toStateSelect.value;

        startStateSelect.innerHTML = defaultOption + stateNames.map(createOption).join('');
        fromStateSelect.innerHTML = fromDefaultOption + stateNames.map(createOption).join('');
        toStateSelect.innerHTML = toDefaultOption + stateNames.map(createOption).join('');

        if (currentFA.startStateName && stateNames.includes(currentFA.startStateName)) {
            startStateSelect.value = currentFA.startStateName;
        } else if (stateNames.includes(currentStartVal)) {
             startStateSelect.value = currentStartVal; // Keep selection if still valid
        }


        if (stateNames.includes(currentFromVal)) fromStateSelect.value = currentFromVal;
        if (stateNames.includes(currentToVal)) toStateSelect.value = currentToVal;

        updateCurrentFADisplayAndGraph();
    }

    function updateCurrentFADisplayAndGraph() {
        // Update Textual Definition
        let def = `States: ${Array.from(currentFA.states.keys()).join(', ') || 'None'}\n`;
        const finalStates = Array.from(currentFA.states.values())
            .filter(s => s.isFinal)
            .map(s => s.name)
            .join(', ');
        def += `Final States: {${finalStates || 'None'}}\n`;
        def += `Alphabet: {${Array.from(currentFA.alphabet).join(', ') || 'Empty'}}\n`;
        def += `Start State: ${currentFA.startStateName || 'Not Set'}\n\n`;
        def += "Transitions (δ):\n";
        let hasTransitions = false;
        if (currentFA.transitions.size > 0) {
            const sortedFromStates = Array.from(currentFA.transitions.keys()).sort();
            sortedFromStates.forEach(fromState => {
                const symbolsMap = currentFA.transitions.get(fromState);
                if (symbolsMap.size > 0) {
                    hasTransitions = true;
                    const sortedSymbols = Array.from(symbolsMap.keys()).sort((a,b) => {
                        if (a === EPSILON) return -1; if (b === EPSILON) return 1;
                        return a.localeCompare(b);
                    });
                    sortedSymbols.forEach(symbol => {
                        const toStatesSet = symbolsMap.get(symbol);
                        def += `  δ(${fromState}, ${symbol === EPSILON ? 'ε' : symbol}) = {${Array.from(toStatesSet).sort().join(', ')}}\n`;
                    });
                }
            });
        }
        if (!hasTransitions) {
            def += "  No transitions defined.\n";
        }
        faDefinitionOutput.textContent = def;

        // Update Graph Visualization
        if (typeof drawFA === 'function') {
            drawFA(currentFA, 'fa-graph-container');
        } else {
            const graphContainer = document.getElementById('fa-graph-container');
            if (graphContainer && !graphContainer.querySelector('canvas') && !graphContainer.querySelector('svg')) {
                 graphContainer.innerHTML = '<p style="text-align:center; padding-top:50px; color: #7f8c8d;">Visualization library not loaded or drawFA() is missing.</p>';
            }
        }
    }

    function displayOperationResult(message, isError = false) {
        operationResultOutput.textContent = message;
        operationResultOutput.className = isError ? 'error-message' : 'success-message';
    }

    function clearOperationResult() {
        operationResultOutput.textContent = 'Output will appear here.';
        operationResultOutput.className = '';
    }

    function clearAndResetWorkbench() {
        currentFA = new FiniteAutomaton();
        
        stateNameInput.value = '';
        isFinalCheckbox.checked = false;
        alphabetSymbolInput.value = '';
        transitionSymbolInput.value = '';
        faNameSaveFileInput.value = '';
        faNameLocalStorageInput.value = '';
        testStringInput.value = '';

        startStateSelect.innerHTML = '<option value="">--Select State--</option>';
        fromStateSelect.innerHTML = '<option value="">--Select From--</option>';
        toStateSelect.innerHTML = '<option value="">--Select To--</option>';
        
        updateCurrentFADisplayAndGraph();
        clearOperationResult();
        displayOperationResult("Workbench cleared. Ready for a new automaton.", false);
        renderLocalStorageList(); // Refresh list of saved FAs
    }

    function renderLocalStorageList() {
        if (!localStorageFASelector || typeof listSavedFANames !== 'function') return;

        const savedNames = listSavedFANames(); // From storage.js
        localStorageFASelector.innerHTML = '';

        if (savedNames.length === 0) {
            localStorageFASelector.innerHTML = '<li class="no-saved-items">No automata saved in browser yet.</li>';
            return;
        }

        savedNames.forEach(name => {
            const li = document.createElement('li');
            li.className = 'saved-fa-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            nameSpan.className = 'fa-name';

            const btnGroup = document.createElement('div'); // Group buttons for styling
            btnGroup.className = 'button-group-ls';

            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.className = 'button-small button-load-ls';
            loadBtn.dataset.faName = name;
            loadBtn.addEventListener('click', (e) => {
                const faNameToLoad = e.target.dataset.faName;
                if (typeof loadFAFromLocalStorage !== 'function') {
                    displayOperationResult("localStorage load function not available.", true); return;
                }
                const loadedFA = loadFAFromLocalStorage(faNameToLoad);
                if (loadedFA) {
                    currentFA = loadedFA;
                    faNameLocalStorageInput.value = faNameToLoad;
                    faNameSaveFileInput.value = faNameToLoad;
                    updateStateSelects();
                    displayOperationResult(`Automaton "${faNameToLoad}" loaded from browser storage.`, false);
                } else {
                    displayOperationResult(`Failed to load "${faNameToLoad}" from browser storage.`, true);
                    renderLocalStorageList();
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'button-small button-delete-ls button-warning';
            deleteBtn.dataset.faName = name;
            deleteBtn.addEventListener('click', (e) => {
                const faNameToDelete = e.target.dataset.faName;
                if (typeof deleteFAFromLocalStorage !== 'function') {
                    displayOperationResult("localStorage delete function not available.", true); return;
                }
                // Optional: Add a confirmation dialog
                // if (confirm(`Are you sure you want to delete "${faNameToDelete}" from browser storage? This cannot be undone.`)) {
                    if (deleteFAFromLocalStorage(faNameToDelete)) {
                        displayOperationResult(`Automaton "${faNameToDelete}" deleted from browser storage.`, false);
                        renderLocalStorageList();
                    } else {
                        displayOperationResult(`Failed to delete "${faNameToDelete}".`, true);
                    }
                // }
            });

            btnGroup.appendChild(loadBtn);
            btnGroup.appendChild(deleteBtn);
            li.appendChild(nameSpan);
            li.appendChild(btnGroup);
            localStorageFASelector.appendChild(li);
        });
    }

    // --- Event Listeners for FA Design ---
    addStateBtn.addEventListener('click', () => {
        const name = stateNameInput.value.trim();
        const isFinal = isFinalCheckbox.checked;
        if (!name) {
            displayOperationResult("State name cannot be empty.", true);
            return;
        }
        const addedState = currentFA.addState(name, isFinal);
        if (addedState) {
            if (currentFA.states.size === 1 && !currentFA.startStateName) {
                currentFA.setStartState(name);
            }
            updateStateSelects();
            stateNameInput.value = '';
            isFinalCheckbox.checked = false;
            clearOperationResult();
        } else {
            displayOperationResult(`Failed to add state '${name}'. It might already exist or be invalid.`, true);
        }
    });

    addSymbolBtn.addEventListener('click', () => {
        const symbol = alphabetSymbolInput.value.trim();
        if (!symbol) {
            displayOperationResult("Alphabet symbol cannot be empty.", true);
            return;
        }
        if (symbol.includes(',') || symbol.includes(' ') || symbol.length > 1 && symbol !== EPSILON) {
            // Allow epsilon, but generally guide towards single character symbols for alphabet
            displayOperationResult("Please add valid alphabet symbols one at a time (usually single characters, no commas/spaces). Epsilon 'ε' is special.", true);
            return;
        }
        currentFA.addSymbolToAlphabet(symbol);
        updateCurrentFADisplayAndGraph();
        alphabetSymbolInput.value = '';
        clearOperationResult();
    });

    setStartBtn.addEventListener('click', () => {
        const selectedState = startStateSelect.value;
        if (selectedState) {
            currentFA.setStartState(selectedState);
            updateCurrentFADisplayAndGraph();
            clearOperationResult();
        } else {
            displayOperationResult("Please select a state to set as start.", true);
        }
    });

    addTransitionBtn.addEventListener('click', () => {
        const fromState = fromStateSelect.value;
        let symbol = transitionSymbolInput.value.trim();
        const toState = toStateSelect.value;

        if (!fromState || !toState) {
            displayOperationResult("Please select 'From' and 'To' states for the transition.", true);
            return;
        }
        if (symbol === "" || symbol.toLowerCase() === "epsilon") { // More robust epsilon check
            symbol = EPSILON;
        }

        if (currentFA.addTransition(fromState, symbol, toState)) {
            updateStateSelects();
            clearOperationResult();
        } else {
            displayOperationResult("Failed to add transition. Ensure states exist. Check console for details.", true);
        }
    });

    // --- Event Listeners for Operations ---
    isDeterministicBtn.addEventListener('click', () => {
        if (currentFA.states.size === 0) {
            displayOperationResult("FA is empty. Please define states and transitions.", true);
            return;
        }
        try {
            const isDFA = currentFA.isDeterministic();
            displayOperationResult(`The current FA is ${isDFA ? "Deterministic (DFA)" : "Non-deterministic (NFA)"}.`);
        } catch (e) {
            displayOperationResult(`Error checking determinism: ${e.message}`, true); console.error(e);
        }
    });

    testStringBtn.addEventListener('click', () => {
        const str = testStringInput.value;
        if (currentFA.states.size === 0 || !currentFA.startStateName) {
            displayOperationResult("FA is not fully defined (needs states and a start state).", true);
            return;
        }
        try {
            const accepts = currentFA.accepts(str);
            displayOperationResult(`String "${str}" is ${accepts ? "ACCEPTED" : "REJECTED"} by the current FA.`);
        } catch (e) {
            displayOperationResult(`Error testing string: ${e.message}`, true); console.error(e);
        }
        testStringInput.select();
    });

    convertToDFABtn.addEventListener('click', () => {
        if (currentFA.states.size === 0) {
            displayOperationResult("FA is empty. Cannot convert.", true); return;
        }
        if (typeof currentFA.toDFA !== 'function') {
            displayOperationResult("NFA to DFA conversion feature not implemented in logic.", true); return;
        }
        try {
            if (currentFA.isDeterministic()) {
                displayOperationResult("The current FA is already a DFA.", false); return;
            }
            const dfa = currentFA.toDFA();
            currentFA = dfa;
            faNameSaveFileInput.value = (faNameSaveFileInput.value || "myNFA") + "_to_DFA";
            faNameLocalStorageInput.value = faNameSaveFileInput.value;
            updateStateSelects();
            displayOperationResult("NFA successfully converted to DFA. Current FA is now the DFA.");
        } catch (e) {
            displayOperationResult(`Error during NFA to DFA conversion: ${e.message}`, true); console.error(e);
        }
    });

    minimizeDFABtn.addEventListener('click', () => {
        if (currentFA.states.size === 0) {
            displayOperationResult("FA is empty. Cannot minimize.", true); return;
        }
        if (typeof currentFA.minimize !== 'function') {
            displayOperationResult("DFA minimization feature not implemented in logic.", true); return;
        }
        try {
            if (!currentFA.isDeterministic()) {
                displayOperationResult("Minimization requires a DFA. Please convert or ensure it's a DFA.", true); return;
            }
            const originalStateCount = currentFA.states.size;
            const minimizedDFA = currentFA.minimize();
            const minimizedStateCount = minimizedDFA.states.size;
            currentFA = minimizedDFA;
            faNameSaveFileInput.value = (faNameSaveFileInput.value || "myDFA") + "_minimized";
            faNameLocalStorageInput.value = faNameSaveFileInput.value;
            updateStateSelects();
            if (minimizedStateCount < originalStateCount) {
                displayOperationResult(`DFA successfully minimized. States reduced from ${originalStateCount} to ${minimizedStateCount}.`);
            } else {
                displayOperationResult(`DFA is already minimal (or no further reduction was possible). States: ${minimizedStateCount}.`);
            }
        } catch (e) {
            displayOperationResult(`Error during DFA minimization: ${e.message}`, true); console.error(e);
        }
    });

    // --- Event Listeners for Management ---
    clearFABtn.addEventListener('click', () => {
        // Optional: Add a confirmation dialog
        // if (confirm("Are you sure you want to clear the current automaton and reset the workbench? All unsaved changes will be lost.")) {
            clearAndResetWorkbench();
        // }
    });

    saveFAToFileBtn.addEventListener('click', () => {
        if (currentFA.states.size === 0) {
            displayOperationResult("Cannot save an empty FA.", true); return;
        }
        if (typeof currentFA.toJSON !== 'function') {
            displayOperationResult("Save feature (toJSON) not implemented in FA logic.", true); return;
        }
        try {
            const faJSON = currentFA.toJSON();
            const faName = (faNameSaveFileInput.value.trim() || 'automaton') + '.json';
            const blob = new Blob([faJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = faName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            displayOperationResult(`FA "${faName}" prepared for download.`);
        } catch (e) {
            displayOperationResult(`Error saving FA to file: ${e.message}`, true); console.error(e);
        }
    });

    loadFAFromFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (typeof FiniteAutomaton.fromJSON !== 'function') {
                        displayOperationResult("Load feature (fromJSON) not implemented in FA logic.", true); return;
                    }
                    const loadedFA = FiniteAutomaton.fromJSON(e.target.result);
                    currentFA = loadedFA;
                    const baseName = file.name.replace(/\.json$/i, '');
                    faNameSaveFileInput.value = baseName;
                    faNameLocalStorageInput.value = baseName;
                    updateStateSelects();
                    displayOperationResult(`FA "${file.name}" loaded successfully from file.`, false);
                    renderLocalStorageList();
                } catch (err) {
                    displayOperationResult(`Error loading FA from file: ${err.message}`, true); console.error(err);
                }
            };
            reader.onerror = () => {
                displayOperationResult(`Error reading file: ${reader.error}`, true);
            };
            reader.readAsText(file);
            loadFAFromFileInput.value = '';
        }
    });

    saveFAToLSBtn.addEventListener('click', () => {
        const nameToSave = faNameLocalStorageInput.value.trim();
        if (!nameToSave) {
            displayOperationResult("Please provide a name to save the automaton in browser storage.", true); return;
        }
        if (currentFA.states.size === 0) {
            displayOperationResult("Cannot save an empty FA to browser storage.", true); return;
        }
        if (typeof saveFAToLocalStorage !== 'function') {
            displayOperationResult("localStorage save function not available.", true); return;
        }
        if (saveFAToLocalStorage(nameToSave, currentFA)) {
            displayOperationResult(`Automaton "${nameToSave}" saved to browser storage.`, false);
            renderLocalStorageList();
        } else {
            // Error message likely handled by saveFAToLocalStorage or alert within it
        }
    });

    // --- Initial Setup ---
    clearAndResetWorkbench(); // Start with a clean slate and populate lists
    console.log("Finite Automata Workbench Initialized with all features connected.");
});