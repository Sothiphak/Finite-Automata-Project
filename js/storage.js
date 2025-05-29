// js/storage.js

const LOCAL_STORAGE_KEY = 'finiteAutomata Workbench_savedFAs';

function getSavedFAs() {
    const faJSONString = localStorage.getItem(LOCAL_STORAGE_KEY);
    return faJSONString ? JSON.parse(faJSONString) : {}; // Return an object (name -> faJSON)
}

function saveFAToLocalStorage(name, faInstance) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        console.error("Invalid name provided for saving to localStorage.");
        return false;
    }
    if (typeof faInstance.toJSON !== 'function') {
        console.error("FA instance does not have a toJSON method.");
        return false;
    }

    const existingFAs = getSavedFAs();
    existingFAs[name.trim()] = faInstance.toJSON(); // Store the JSON string of the FA
    
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingFAs));
        console.log(`FA "${name}" saved to localStorage.`);
        return true;
    } catch (e) {
        console.error("Error saving to localStorage (possibly full):", e);
        // You might want to inform the user via the UI here
        alert("Error saving to localStorage. It might be full or your browser restricts it.");
        return false;
    }
}

function loadFAFromLocalStorage(name) {
    const existingFAs = getSavedFAs();
    const faJSON = existingFAs[name];

    if (faJSON) {
        try {
            // Assuming FiniteAutomaton.fromJSON is available globally or imported
            return FiniteAutomaton.fromJSON(faJSON);
        } catch (e) {
            console.error(`Error parsing FA "${name}" from localStorage:`, e);
            return null;
        }
    }
    console.warn(`FA "${name}" not found in localStorage.`);
    return null;
}

function deleteFAFromLocalStorage(name) {
    const existingFAs = getSavedFAs();
    if (existingFAs[name]) {
        delete existingFAs[name];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingFAs));
        console.log(`FA "${name}" deleted from localStorage.`);
        return true;
    }
    console.warn(`FA "${name}" not found in localStorage for deletion.`);
    return false;
}

function listSavedFANames() {
    const existingFAs = getSavedFAs();
    return Object.keys(existingFAs).sort(); // Return sorted array of names
}