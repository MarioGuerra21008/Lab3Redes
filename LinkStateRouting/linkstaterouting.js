const { 
    graph, 
    names, 
    getUserForNode, 
    dijkstra, 
    getPath, 
    simulateCommunicationTime, 
    updateGraphWeights 
} = require('../Dijkstra/dijkstra.js');


function floodLSA(graph) {
    const lsaDatabase = {};
    for (let node in graph) {
        lsaDatabase[node] = {...graph[node]};
    }
    return lsaDatabase;
}

function buildRoutingTable(graph, startNode, lsaDatabase) {
    return dijkstra(lsaDatabase, startNode);
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

console.log('------------------------------------------------------------');
console.log(`
.____    .__        __       _________ __          __           __________               __  .__                
|    |   |__| ____ |  | __  /   _____//  |______ _/  |_  ____   \______   \ ____  __ ___/  |_|__| ____    ____  
|    |   |  |/    \|  |/ /  \_____  \\   __\__  \\   __\/ __ \   |       _//  _ \|  |  \   __\  |/    \  / ___\ 
|    |___|  |   |  \    <   /        \|  |  / __ \|  | \  ___/   |    |   (  <_> )  |  /|  | |  |   |  \/ /_/  >
|_______ \__|___|  /__|_ \ /_______  /|__| ____  /__|  \___  >  |____|_  /\____/|____/ |__| |__|___|  /\___  / 
        \/       \/     \/         \/           \/          \/          \/                           \//_____/`);

console.log('Grafo:', graph);
console.log(`Enviar mensaje a: ${userReceptor}`);
console.log('Distancias:', result.distances);
console.log('Caminos anteriores:', result.previous);
console.log(`Distancia total desde ${startNode} hasta ${targetNode}:`, result.totalDistance);
console.log(`Camino desde ${startNode} hasta ${targetNode}:`, result.path.join(' -> '));