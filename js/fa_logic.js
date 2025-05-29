// js/fa_logic.js

const EPSILON = "ε"; // Epsilon symbol for transitions


class FiniteAutomaton {
    constructor() {
        this.states = new Map(); // Map<String_stateName, State_object>
        this.alphabet = new Set(); // Set<String_symbol>
        // Transitions: Map<stateName, Map<symbol, Set<targetStateName>>>
        this.transitions = new Map(); // e.g., transitions.get('q0').get('a') = Set(['q1', 'q2'])
        this.startStateName = null; // String (name of the start state)
    }

    addState(name, isFinal = false) {
        const stateName = name.trim();
        if (stateName === "") {
            console.error("State name cannot be empty.");
            // Consider throwing an error or returning a more specific failure indicator
            return null;
        }
        if (this.states.has(stateName)) {
            // If state exists, update its 'isFinal' status as a common desired behavior
            const existingState = this.states.get(stateName);
            existingState.isFinal = isFinal;
            console.warn(`State ${stateName} already exists. Updated 'isFinal' to ${isFinal}.`);
            return existingState;
        }
        const newState = new State(stateName, isFinal);
        this.states.set(stateName, newState);
        this.transitions.set(stateName, new Map()); // Initialize transitions for this new state
        console.log(`Added state: ${stateName}, Is Final: ${isFinal}`);
        return newState;
    }

    removeState(stateName) {
        if (!this.states.has(stateName)) {
            console.warn(`State ${stateName} does not exist. Cannot remove.`);
            return false;
        }
        this.states.delete(stateName);
        this.transitions.delete(stateName); // Remove outgoing transitions from this state

        // Remove any incoming transitions to this state
        this.transitions.forEach((symbolsMap, fromState) => {
            symbolsMap.forEach((toStatesSet, symbol) => {
                if (toStatesSet.has(stateName)) {
                    toStatesSet.delete(stateName);
                    // Optional: if a symbol's target set becomes empty, remove the symbol entry
                    // if (toStatesSet.size === 0) {
                    //     symbolsMap.delete(symbol);
                    // }
                }
            });
        });

        if (this.startStateName === stateName) {
            this.startStateName = null; // Reset start state if it was the removed one
        }
        console.log(`Removed state: ${stateName}`);
        return true;
    }

    setStateAsFinal(stateName, isFinal = true) {
        const state = this.states.get(stateName);
        if (state) {
            state.isFinal = isFinal;
            console.log(`State ${stateName} 'isFinal' status set to ${isFinal}`);
        } else {
            console.warn(`Cannot set final status: State ${stateName} not found.`);
        }
    }

    setStartState(stateName) {
        if (this.states.has(stateName)) {
            this.startStateName = stateName;
            console.log(`Start state set to: ${stateName}`);
        } else {
            console.warn(`Cannot set start state: State ${stateName} not found or does not exist.`);
        }
    }

    addSymbolToAlphabet(symbol) {
        const sym = symbol.trim();
        if (sym === "" || sym === EPSILON) {
            console.warn(`Symbol cannot be empty or Epsilon for the explicit alphabet.`);
            return;
        }
        // Optional: Warning for multi-character symbols if your convention is single characters
        // if (sym.length > 1) {
        //     console.warn(`Alphabet symbols are typically single characters. Symbol '${sym}' might be treated as a single unit.`);
        // }
        this.alphabet.add(sym);
        console.log(`Added symbol to alphabet: ${sym}`);
    }

    addTransition(fromStateName, symbol, toStateName) {
        const sym = (typeof symbol === 'string') ? symbol.trim() : EPSILON; // Default to EPSILON if symbol is null/undefined etc.
                                                                      // Ensure trim() is only called on actual strings.
        if (typeof symbol === 'string' && symbol.trim() === "") {
             // If user explicitly types empty string intending epsilon, map it
             // This depends on how your UI handles epsilon input. If blank means epsilon, this is good.
            // sym = EPSILON; // Already handled by the ternary if symbol becomes "" after trim
        }


        if (!this.states.has(fromStateName)) {
            console.error(`Source state '${fromStateName}' does not exist for transition.`);
            return false;
        }
        if (!this.states.has(toStateName)) {
            console.error(`Target state '${toStateName}' does not exist for transition.`);
            return false;
        }

        // If it's not an epsilon transition, warn if symbol is not in alphabet
        if (sym !== EPSILON && !this.alphabet.has(sym)) {
            console.warn(`Symbol '${sym}' is not in the defined alphabet. Consider adding it. Transition added an NFA-like feature.`);
        }

        const stateTransitions = this.transitions.get(fromStateName);
        if (!stateTransitions.has(sym)) {
            stateTransitions.set(sym, new Set());
        }
        stateTransitions.get(sym).add(toStateName);
        console.log(`Added transition: ${fromStateName} --${sym === EPSILON ? 'ε' : sym}--> ${toStateName}`);
        return true;
    }

    isDeterministic() {
        if (this.states.size === 0) return true; // An empty FA is trivially DFA

        for (const [stateName, transitionsFromState] of this.transitions) {
            // 1. Check for Epsilon Transitions
            if (transitionsFromState.has(EPSILON) && transitionsFromState.get(EPSILON).size > 0) {
                console.log(`NFA Classification: Epsilon transition found from state ${stateName}.`);
                return false;
            }

            // 2. Check for unique transitions for each symbol in the alphabet
            for (const symbol of this.alphabet) {
                const destinations = transitionsFromState.get(symbol);
                if (!destinations || destinations.size === 0) {
                    console.log(`NFA Classification: No transition from state ${stateName} on symbol '${symbol}'. (Incomplete DFA treated as NFA)`);
                    return false;
                }
                if (destinations.size > 1) {
                    console.log(`NFA Classification: Multiple transitions from state ${stateName} on symbol '${symbol}'.`);
                    return false;
                }
            }
        }
        return true;
    }

    epsilonClosure(stateNamesSet) {
        if (!(stateNamesSet instanceof Set)) {
            console.error("epsilonClosure expects a Set of state names as input.");
            return new Set(); // Return empty set on error
        }
        const closure = new Set(stateNamesSet);
        const stack = Array.from(stateNamesSet); // Use an array as a stack/queue

        while (stack.length > 0) {
            const sName = stack.pop(); // DFS-like expansion
            const stateObject = this.states.get(sName);
            if (!stateObject) continue; // Should not happen if stateNamesSet contains valid states

            const stateTransitions = this.transitions.get(sName);
            if (stateTransitions && stateTransitions.has(EPSILON)) {
                for (const tName of stateTransitions.get(EPSILON)) {
                    if (this.states.has(tName) && !closure.has(tName)) {
                        closure.add(tName);
                        stack.push(tName);
                    }
                }
            }
        }
        return closure;
    }

    accepts(inputString) {
        if (!this.startStateName || !this.states.has(this.startStateName)) {
            console.warn("Cannot test string: Start state not set or does not exist.");
            return false;
        }
        if (this.states.size === 0) {
             console.warn("Cannot test string: FA has no states.");
            return false;
        }


        const isDFA = this.isDeterministic();

        if (isDFA) {
            let currentStateName = this.startStateName;
            for (const symbol of inputString) {
                if (!this.alphabet.has(symbol)) {
                    console.log(`DFA: Symbol '${symbol}' not in alphabet. String rejected.`);
                    return false;
                }
                const stateTransitions = this.transitions.get(currentStateName);
                if (!stateTransitions || !stateTransitions.has(symbol) || stateTransitions.get(symbol).size === 0) {
                    console.log(`DFA: No transition from ${currentStateName} on symbol '${symbol}'. String rejected (implicit dead state).`);
                    return false;
                }
                currentStateName = stateTransitions.get(symbol).values().next().value; // Exactly one for DFA
            }
            const finalStateCheck = this.states.get(currentStateName);
            return finalStateCheck ? finalStateCheck.isFinal : false;
        } else { // NFA logic
            let currentPossibleStateNames = this.epsilonClosure(new Set([this.startStateName]));
            for (const symbol of inputString) {
                if (!this.alphabet.has(symbol)) {
                    console.log(`NFA: Symbol '${symbol}' not in alphabet. String rejected.`);
                    return false;
                }
                const nextStatesAfterSymbol = new Set();
                for (const stateName of currentPossibleStateNames) {
                    const stateTransitions = this.transitions.get(stateName);
                    if (stateTransitions && stateTransitions.has(symbol)) {
                        stateTransitions.get(symbol).forEach(targetName => nextStatesAfterSymbol.add(targetName));
                    }
                }
                if (nextStatesAfterSymbol.size === 0) {
                    console.log(`NFA: Dead end reached on symbol '${symbol}'. String rejected.`);
                    return false;
                }
                currentPossibleStateNames = this.epsilonClosure(nextStatesAfterSymbol);
            }
            for (const stateName of currentPossibleStateNames) {
                const stateCheck = this.states.get(stateName);
                if (stateCheck && stateCheck.isFinal) {
                    return true;
                }
            }
            return false;
        }
    }

    toJSON() {
        const plainFA = {
            states: Array.from(this.states.values()).map(s => ({ name: s.name, isFinal: s.isFinal })),
            alphabet: Array.from(this.alphabet).sort(), // Sort for consistent output
            startStateName: this.startStateName,
            transitions: []
        };

        // Sort transitions for consistent output
        const sortedStateNames = Array.from(this.transitions.keys()).sort();
        sortedStateNames.forEach(fromStateName => {
            const symbolsMap = this.transitions.get(fromStateName);
            const sortedSymbols = Array.from(symbolsMap.keys()).sort((a, b) => {
                if (a === EPSILON) return -1; if (b === EPSILON) return 1; // Epsilon first
                return a.localeCompare(b);
            });
            sortedSymbols.forEach(symbol => {
                const toStatesSet = symbolsMap.get(symbol);
                plainFA.transitions.push({
                    from: fromStateName,
                    symbol: symbol,
                    to: Array.from(toStatesSet).sort() // Sort target states for consistency
                });
            });
        });
        return JSON.stringify(plainFA, null, 2); // Pretty print
    }

    static fromJSON(jsonString) {
        const plainFA = JSON.parse(jsonString);
        if (!plainFA || typeof plainFA !== 'object') {
            throw new Error("Invalid JSON structure for FA.");
        }
        const fa = new FiniteAutomaton();

        if (Array.isArray(plainFA.alphabet)) {
            plainFA.alphabet.forEach(symbol => fa.addSymbolToAlphabet(symbol));
        }

        if (Array.isArray(plainFA.states)) {
            plainFA.states.forEach(sObj => {
                if (sObj && typeof sObj.name === 'string') {
                    fa.addState(sObj.name, !!sObj.isFinal);
                } else {
                    console.warn("Skipping invalid state object from JSON:", sObj);
                }
            });
        }

        if (plainFA.startStateName && typeof plainFA.startStateName === 'string') {
            fa.setStartState(plainFA.startStateName);
        } else if (plainFA.states && plainFA.states.length > 0 && !fa.startStateName) {
            // Fallback: if start state not specified but states exist, set first one as start (optional behavior)
            // console.warn("Start state not specified in JSON, attempting to infer or leaving unset.");
        }


        if (Array.isArray(plainFA.transitions)) {
            plainFA.transitions.forEach(tObj => {
                if (tObj && typeof tObj.from === 'string' && tObj.symbol !== undefined && Array.isArray(tObj.to)) {
                    const symbol = tObj.symbol; // Symbol could be EPSILON string or actual symbol
                    tObj.to.forEach(toStateName => {
                        if (typeof toStateName === 'string') {
                            fa.addTransition(tObj.from, symbol, toStateName);
                        } else {
                             console.warn("Skipping invalid 'to' state in transition object:", tObj);
                        }
                    });
                } else {
                    console.warn("Skipping invalid transition object from JSON:", tObj);
                }
            });
        }
        return fa;
    }

    toDFA() {
        if (!this.startStateName || !this.states.has(this.startStateName)) {
            throw new Error("NFA must have a valid start state to be converted.");
        }

        const dfa = new FiniteAutomaton();
        // DFA alphabet is same as NFA's explicit alphabet (epsilon transitions are handled by closure)
        this.alphabet.forEach(sym => dfa.addSymbolToAlphabet(sym));


        const nfaStateSetToDfaStateName = (nfaStatesSet) => {
            // Canonical name for DFA state: sorted, comma-separated NFA state names
            return `{${Array.from(nfaStatesSet).sort().join(',')}}`;
        };

        let initialNfaStateSet = this.epsilonClosure(new Set([this.startStateName]));
        const initialDfaStateName = nfaStateSetToDfaStateName(initialNfaStateSet);

        dfa.addState(initialDfaStateName);
        dfa.setStartState(initialDfaStateName);

        const unprocessedDfaStatesQueue = [{ name: initialDfaStateName, nfaStates: initialNfaStateSet }];
        const knownDfaStateNames = new Set([initialDfaStateName]); // Tracks DFA state names we've encountered

        while (unprocessedDfaStatesQueue.length > 0) {
            const currentDfaDefinition = unprocessedDfaStatesQueue.shift();
            const currentDfaStateName = currentDfaDefinition.name;
            const currentSetOfNfaStates = currentDfaDefinition.nfaStates;

            // Determine if this new DFA state is final
            let isCurrentDfaStateFinal = false;
            for (const nfaStateName of currentSetOfNfaStates) {
                const nfaState = this.states.get(nfaStateName);
                if (nfaState && nfaState.isFinal) {
                    isCurrentDfaStateFinal = true;
                    break;
                }
            }
            if (isCurrentDfaStateFinal) {
                dfa.setStateAsFinal(currentDfaStateName, true);
            }

            // For each symbol in the alphabet, compute the next DFA state
            for (const symbol of this.alphabet) { // Iterate NFA's explicit alphabet
                const directNextNfaStates = new Set();
                for (const nfaStateName of currentSetOfNfaStates) {
                    const nfaStateTransitions = this.transitions.get(nfaStateName);
                    if (nfaStateTransitions && nfaStateTransitions.has(symbol)) {
                        nfaStateTransitions.get(symbol).forEach(targetNfaState => directNextNfaStates.add(targetNfaState));
                    }
                }

                if (directNextNfaStates.size > 0) {
                    const targetNfaStateSetWithEpsilon = this.epsilonClosure(directNextNfaStates);
                    const targetDfaStateName = nfaStateSetToDfaStateName(targetNfaStateSetWithEpsilon);

                    if (!knownDfaStateNames.has(targetDfaStateName)) {
                        dfa.addState(targetDfaStateName); // Add new DFA state if not already known
                        knownDfaStateNames.add(targetDfaStateName);
                        unprocessedDfaStatesQueue.push({ name: targetDfaStateName, nfaStates: targetNfaStateSetWithEpsilon });
                    }
                    dfa.addTransition(currentDfaStateName, symbol, targetDfaStateName);
                }
                // If directNextNfaStates is empty, there's no transition for this symbol from this DFA state.
                // In a strict DFA, this would go to a dead state. Here, we simply don't add a transition,
                // which our isDeterministic() check will flag if not all transitions are present for all states/symbols.
                // Or, one could explicitly add a dead state to the DFA. For this conversion, we'll omit it.
            }
        }
        return dfa;
    }

    _getReachableFA() {
        const reachableFA = new FiniteAutomaton();
        if (!this.startStateName || !this.states.has(this.startStateName)) {
            return reachableFA; // No start state or it doesn't exist
        }

        this.alphabet.forEach(sym => reachableFA.addSymbolToAlphabet(sym));

        const queue = [this.startStateName];
        const visited = new Set(); // Keep track of states whose outgoing transitions have been processed

        // Add start state first
        const startStateObj = this.states.get(this.startStateName);
        reachableFA.addState(this.startStateName, startStateObj.isFinal);
        reachableFA.setStartState(this.startStateName);
        visited.add(this.startStateName);


        let head = 0;
        while(head < queue.length){ // Process as a queue
            const currentStateName = queue[head++]; // Dequeue

            const transitionsFromCurrent = this.transitions.get(currentStateName);
            if (transitionsFromCurrent) {
                transitionsFromCurrent.forEach((toStatesSet, symbol) => {
                    toStatesSet.forEach(targetStateName => {
                        if (this.states.has(targetStateName)) { // Ensure target state actually exists
                            // Add target state to reachableFA if not already there
                            if (!reachableFA.states.has(targetStateName)) {
                                const targetStateObj = this.states.get(targetStateName);
                                reachableFA.addState(targetStateName, targetStateObj.isFinal);
                            }
                            // Add transition
                            reachableFA.addTransition(currentStateName, symbol, targetStateName);

                            // If target state hasn't been visited for its transitions, add to queue
                            if (!visited.has(targetStateName)) {
                                visited.add(targetStateName);
                                queue.push(targetStateName);
                            }
                        }
                    });
                });
            }
        }
        return reachableFA;
    }


    minimize() {
        if (!this.isDeterministic()) {
            throw new Error("Minimization algorithm requires a fully defined DFA.");
        }
        if (this.states.size === 0) {
            return new FiniteAutomaton(); // An empty DFA is minimal.
        }

        // Step 0: Work with a version of the FA that only contains reachable states.
        const fa = this._getReachableFA();
        if (fa.states.size <= 1) {
            return fa; // DFA with 0 or 1 state is already minimal.
        }

        let states = Array.from(fa.states.keys()).sort(); // Get a sorted list of reachable state names
        const alphabet = Array.from(fa.alphabet);
        let n = states.length;

        // Initialize partitions: P = {F, Q-F}
        let partitions = [];
        const finalStates = new Set();
        const nonFinalStates = new Set();
        states.forEach(stateName => {
            if (fa.states.get(stateName).isFinal) {
                finalStates.add(stateName);
            } else {
                nonFinalStates.add(stateName);
            }
        });

        if (finalStates.size > 0) partitions.push(finalStates);
        if (nonFinalStates.size > 0) partitions.push(nonFinalStates);

        if (partitions.length <= 1) return fa; // All states are final or all are non-final and reachable

        // Hopcroft's algorithm style refinement
        let worklist = []; // Will contain sets that need to be used as splitters
        if (partitions.length === 2) { // If we have both final and non-final groups
             // Add the smaller of the two to the worklist
            if (finalStates.size <= nonFinalStates.size && finalStates.size > 0) {
                worklist.push(finalStates);
            } else if (nonFinalStates.size > 0) {
                worklist.push(nonFinalStates);
            }
        } else if (partitions.length === 1) {
            // This case should mean the FA is already minimal (or only one group exists)
            // But if we proceed, the loop won't do much.
        }


        while (worklist.length > 0) {
            const A = worklist.shift(); // Get a splitter set from worklist

            for (const symbol of alphabet) {
                // X = set of states s such that transition(s, symbol) is in A
                const X = new Set();
                states.forEach(s => {
                    const s_transitions = fa.transitions.get(s);
                    if (s_transitions && s_transitions.has(symbol)) {
                        const targetState = s_transitions.get(symbol).values().next().value; // DFA
                        if (A.has(targetState)) {
                            X.add(s);
                        }
                    }
                });

                if (X.size === 0) continue;

                const newPartitions = [];
                for (let i = 0; i < partitions.length; i++) {
                    const Y = partitions[i];
                    const intersection = new Set([...Y].filter(state => X.has(state)));
                    const difference = new Set([...Y].filter(state => !X.has(state)));

                    if (intersection.size > 0 && difference.size > 0) {
                        newPartitions.push(intersection);
                        newPartitions.push(difference);

                        // Update worklist
                        const A_in_Y_index = worklist.findIndex(set => set === Y); // Check if Y is in worklist
                        if (A_in_Y_index !== -1) {
                            worklist.splice(A_in_Y_index, 1);
                            worklist.push(intersection);
                            worklist.push(difference);
                        } else {
                            if (intersection.size <= difference.size) {
                                worklist.push(intersection);
                            } else {
                                worklist.push(difference);
                            }
                        }
                    } else {
                        newPartitions.push(Y); // No split, keep original partition
                    }
                }
                partitions = newPartitions;
                 if (partitions.length >= n) break; // Optimization: cannot have more partitions than states
            }
        }

        // Construct minimized DFA from the final partitions
        const minimizedDFA = new FiniteAutomaton();
        fa.alphabet.forEach(sym => minimizedDFA.addSymbolToAlphabet(sym));

        const partitionToStateName = (partitionSet) => `{${Array.from(partitionSet).sort().join(',')}}`;
        const stateToPartitionMap = new Map();

        partitions.forEach(pSet => {
            const newStateName = partitionToStateName(pSet);
            let isNewStateFinal = false;
            let isNewStateStart = false;
            pSet.forEach(originalStateName => {
                stateToPartitionMap.set(originalStateName, newStateName); // Map original state to its new partition name
                if (fa.states.get(originalStateName).isFinal) isNewStateFinal = true;
                if (originalStateName === fa.startStateName) isNewStateStart = true;
            });
            minimizedDFA.addState(newStateName, isNewStateFinal);
            if (isNewStateStart) {
                minimizedDFA.setStartState(newStateName);
            }
        });

        // Add transitions to minimized DFA
        partitions.forEach(pSet => {
            const fromMinimizedStateName = partitionToStateName(pSet);
            const representativeOriginalState = pSet.values().next().value; // Pick one state from partition

            fa.alphabet.forEach(symbol => {
                const originalTransitions = fa.transitions.get(representativeOriginalState);
                if (originalTransitions && originalTransitions.has(symbol)) {
                    const originalTargetState = originalTransitions.get(symbol).values().next().value;
                    const toMinimizedStateName = stateToPartitionMap.get(originalTargetState);
                    if (toMinimizedStateName) { // Ensure target partition exists
                        minimizedDFA.addTransition(fromMinimizedStateName, symbol, toMinimizedStateName);
                    }
                }
            });
        });

        return minimizedDFA._getReachableFA(); // Final cleanup of unreachable states that might form in minimized graph if complex
    }
}