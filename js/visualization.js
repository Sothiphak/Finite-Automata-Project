// js/visualization.js

// Store the Cytoscape instance globally or within a scope accessible for updates
let cy;

function initializeGraphContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Graph container with ID '${containerId}' not found.`);
        return null;
    }
    // Clear previous graph if any (useful for re-draws)
    container.innerHTML = '';
    return container;
}


function drawFA(fa, containerId) {
    const container = initializeGraphContainer(containerId);
    if (!container) return;

    if (!fa || fa.states.size === 0) {
        container.innerHTML = '<p style="text-align:center; padding-top:50px; color: #7f8c8d;">No automaton to display. Add some states and transitions.</p>';
        if (cy) {
            cy.destroy(); // Destroy previous instance if FA becomes empty
            cy = null;
        }
        return;
    }

    const elements = [];
    const transitionCounts = {}; // To handle multiple edges between same nodes

    // Add states (nodes)
    fa.states.forEach(state => {
        const nodeClasses = [];
        if (state.name === fa.startStateName) {
            nodeClasses.push('start-state');
        }
        if (state.isFinal) {
            nodeClasses.push('final-state');
        }

        elements.push({
            group: 'nodes',
            data: { id: state.name, label: state.name },
            classes: nodeClasses.join(' ') || undefined // Add classes only if they exist
        });
    });

    // Add transitions (edges)
    let edgeIdCounter = 0;
    fa.transitions.forEach((symbolsMap, fromStateName) => {
        symbolsMap.forEach((toStatesSet, symbol) => {
            toStatesSet.forEach(toStateName => {
                const edgeKey = `${fromStateName}->${toStateName}`;
                transitionCounts[edgeKey] = (transitionCounts[edgeKey] || 0) + 1;

                elements.push({
                    group: 'edges',
                    data: {
                        id: `e${edgeIdCounter++}`,
                        source: fromStateName,
                        target: toStateName,
                        label: symbol === EPSILON ? 'ε' : symbol
                        // Add a unique key for Cytoscape to distinguish multiple edges if needed,
                        // or rely on its default handling with different IDs.
                        // key: `key_${fromStateName}_${symbol}_${toStateName}_${transitionCounts[edgeKey]}`
                    }
                });
            });
        });
    });

    // Destroy previous instance before creating a new one to avoid issues
    if (cy) {
        cy.destroy();
    }

    cy = cytoscape({
        container: container,
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#ddd', // Neutral node color
                    'border-color': '#555',
                    'border-width': 2,
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '14px',
                    'color': '#000',
                    'width': '40px', // Adjust size as needed
                    'height': '40px',
                    'shape': 'ellipse'
                }
            },
            {
                selector: '.start-state',
                style: {
                    'background-color': '#90EE90', // Light green for start state
                    'border-color': 'darkgreen',
                }
            },
            
            {
                selector: '.final-state',
                style: {
                    'border-width': 4,        // Thicker border for final state
                    'border-style': 'double', // Or use two concentric circles
                    'border-color': '#2c3e50', // Darker border for final
                    // Alternatively, for two circles:
                    // 'background-color': '#fff',
                    // 'border-color': '#2c3e50',
                    // 'border-width': 2,
                    // // Then add another selector for node.final-state::after with different size/position
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#666',
                    'target-arrow-color': '#666',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier', // Use 'segments' or 'taxi' for more control on parallel edges
                                            // 'segment-distances': '20px', // if using segments
                                            // 'taxi-direction': 'horizontal', // if using taxi
                    'label': 'data(label)',
                    'font-size': '12px',
                    'color': '#333',
                    'text-background-color': '#fff', // Make label readable over lines
                    'text-background-opacity': 0.7,
                    'text-background-padding': '2px',
                    'edge-text-rotation': 'autorotate'
                }
            },
            { // Style for self-loops
                selector: 'edge[source=target]',
                style: {
                    'curve-style': 'bezier', // 'loop' is also an option
                    'loop-direction': '0deg', // Adjust as needed
                    'loop-sweep': '-40deg',   // Adjust as needed
                    'control-point-step-size': 40 // General control for bezier curves
                }
            }
        ],
        layout: {
            name: 'cose', // Concentric layout, good for general graphs
            // name: 'breadthfirst', // Good for directed graphs if you have a clear root
            // name: 'grid',
            // name: 'circle',
            idealEdgeLength: (edge) => (edge.source().id() === edge.target().id() ? 100 : 70), // Shorter for non-loops
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: (node) => 400000,
            edgeElasticity: (edge) => 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        }
    });

    // Simple way to indicate start state (besides color)
    // This is not ideal as it adds text outside the node and might overlap.
    // Better visual cues are usually done with SVG icons or specific node shapes if the library supports it easily.
    const startNode = cy.getElementById(fa.startStateName);
    if (startNode.length > 0) {
        // You could try to add a label or modify the existing node slightly.
        // For now, color and double border for final are the primary visual cues.
        // A common way is to draw an "incoming" arrow to the start state from nowhere.
        // This is harder with Cytoscape without adding a dummy invisible node.
        // A simple text label next to it can be done by manipulating the DOM outside cytoscape,
        // or using cytoscape plugins for annotations.
    }

    // Make nodes draggable
    cy.nodes().forEach(node => {
        node.ungrabify(); // Make them not draggable by default
    });
    // cy.nodes().grabify(); // if you want them draggable


    // Example: Log node position on drag
    // cy.on('drag', 'node', function(evt){
    //   console.log( 'dragged ' + evt.target.id() + ' to ' + JSON.stringify(evt.target.position()) );
    // });
}