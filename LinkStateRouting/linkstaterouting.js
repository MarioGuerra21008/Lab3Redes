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

function simulateCommunicationTime() {
    return Math.floor(Math.random() * 10) + 1;
}

function updateGraphWeights(graph) {
    for (let node in graph) {
        for (let neighbor in graph[node]) {
            graph[node][neighbor] = simulateCommunicationTime();
        }
    }
}

function floodLSA(graph) {
    const lsaDatabase = {};
    for (let node in graph) {
        lsaDatabase[node] = {...graph[node]};
    }
    return lsaDatabase;
}

function buildRoutingTable(graph, startNode, lsaDatabase) {
    const distances = {};
    const previous = {};
    const nodes = new Set(Object.keys(graph));
    
    nodes.forEach(node => {
        distances[node] = node === startNode ? 0 : Infinity;
        previous[node] = null;
    });
    
    while (nodes.size > 0) {
        let closestNode = null;
        nodes.forEach(node => {
            if (!closestNode || distances[node] < distances[closestNode]) {
                closestNode = node;
            }
        });
        
        nodes.delete(closestNode);
        
        for (let neighbor in lsaDatabase[closestNode]) {
            const newDist = distances[closestNode] + lsaDatabase[closestNode][neighbor];
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
    return path;
}

function linkStateRouting(graph, startNode, targetNode) {
    updateGraphWeights(graph);
    const lsaDatabase = floodLSA(graph);
    const routingTable = buildRoutingTable(graph, startNode, lsaDatabase);
    const totalDistance = routingTable.distances[targetNode];
    const path = getPath(routingTable.previous, targetNode);
    
    return {
        distances: routingTable.distances,
        previous: routingTable.previous,
        totalDistance,
        path
    };
}

// Ejemplo de uso
const startNode = 'A';
const targetNode = 'C';
const userEmisor = getUserForNode(startNode);
const userReceptor = getUserForNode(targetNode);
const result = linkStateRouting(graph, startNode, targetNode);

console.log('Grafo:', graph);
console.log(`Enviar mensaje a: ${userReceptor}`);
console.log('Distancias:', result.distances);
console.log('Caminos anteriores:', result.previous);
console.log(`Distancia total desde ${startNode} hasta ${targetNode}:`, result.totalDistance);
console.log(`Camino desde ${startNode} hasta ${targetNode}:`, result.path.join(' -> '));