const graph = {
    A: { D: 0, E: 0 },
    B: { D: 0, F: 0, G: 0 },
    C: { E: 0, G: 0 },
    D: { A: 0, B: 0, G: 0 },
    E: { A: 0, C: 0, F: 0 },
    F: { B: 0, E: 0 },
    G: { B: 0, C: 0, D: 0 }
};

const names = {
    A: 'woot@alumchat.lol',
    B: 'bar@alumchat.lol',
    C: 'foo@alumchat.lol',
    D: 'omg@alumchat.lol',
    E: 'lol@alumchat.lol',
    F: 'swag@alumchat.lol',
    G: 'yeet@alumchat.lol'
};

function getUserForNode(node) {
    return names[node];
}

function dijkstra(graph, startNode) {
    const distances = {};
    const previous = {};
    const nodes = new Set(Object.keys(graph)); // Utilizar un conjunto para nodos no visitados

    // Inicializar distancias y nodos anteriores
    nodes.forEach(node => {
        distances[node] = node === startNode ? 0 : Infinity;
        previous[node] = null;
    });

    while (nodes.size > 0) {
        // Seleccionar el nodo más cercano no visitado
        let closestNode = null;
        nodes.forEach(node => {
            if (!closestNode || distances[node] < distances[closestNode]) {
                closestNode = node;
            }
        });

        // Si no hay nodo accesible (distancia infinita), terminamos
        if (distances[closestNode] === Infinity) {
            break;
        }

        // Marcar el nodo como visitado
        nodes.delete(closestNode);

        // Actualizar distancias a los vecinos del nodo más cercano
        for (let neighbor in graph[closestNode]) {
            const newDist = distances[closestNode] + graph[closestNode][neighbor];
            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                previous[neighbor] = closestNode;
            }
        }
    }
    return { distances, previous };
}

function getPath(previous, targetNode) {
    const path = [];
    let currentNode = targetNode;
    while (currentNode) {
        path.unshift(currentNode);
        currentNode = previous[currentNode];
    }
    return path.length > 1 ? path : [];  // Devuelve un camino vacío si no hay ruta
}

// Función para simular el tiempo de comunicación entre nodos
function simulateCommunicationTime() {
    // Simula tiempos aleatorios entre 1 y 10 ms
    return Math.floor(Math.random() * 10) + 1;
}

// Actualizar pesos del grafo
function updateGraphWeights(graph) {
    for (let node in graph) {
        for (let neighbor in graph[node]) {
            graph[node][neighbor] = simulateCommunicationTime(); // Actualiza los pesos del grafo con tiempos simulados
        }
    }
}

module.exports = {
    graph,
    names,
    getUserForNode,
    dijkstra,
    getPath,
    simulateCommunicationTime,
    updateGraphWeights
};

// Ejecutar la actualización de pesos
updateGraphWeights(graph);

// Ejemplo de uso

/*
const startNode = 'A';
const targetNode = 'C';
const userEmisor = getUserForNode(startNode);
const userReceptor = getUserForNode(targetNode);
const result = dijkstra(graph, startNode);
const totalDistance = result.distances[targetNode];
const path = getPath(result.previous, targetNode);
console.log('Grafo (DIJSKTRA):', graph)
console.log(`Enviar mensaje a: ${userReceptor}`);
console.log('Distancias:', result.distances);
console.log('Caminos anteriores:', result.previous);
console.log(`Distancia total desde ${startNode} hasta ${targetNode}:`, totalDistance);
console.log(`Camino desde ${startNode} hasta ${targetNode}:`, path.join(' -> '));

*/
