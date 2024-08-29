const { 
    graph, 
    names, 
    getUserForNode, 
    dijkstra, 
    getPath, 
    simulateCommunicationTime, 
    updateGraphWeights 
} = require('../Dijkstra/dijkstra.js');
const { client, xml } = require("@xmpp/client");

// Configuración del cliente XMPP
const domain = "alumchat.lol";
const service = "xmpp://alumchat.lol:5222";

// Crear una instancia del cliente XMPP
const xmpp = client({
    service: service,
    domain: domain,
    username: null,
    password: null,
});

xmpp.on("error", (err) => {
    console.error("Error en la conexión XMPP:", err.message);
});

// Función para iniciar sesión en XMPP
async function login(username, password) {
    xmpp.options.username = username;
    xmpp.options.password = password;
    try {
        await xmpp.start();
        console.log("Conexión XMPP exitosa.");
        // Enviar presencia de estado online
        await xmpp.send(xml("presence"));
    } catch (err) {
        console.error("Error en login XMPP:", err.message);
    }
}

// Función para enviar un mensaje a un nodo y medir el tiempo de envío
async function sendMessageAndMeasureTime(sender, recipient, message) {
    const startTime = Date.now(); // Marca el tiempo inicial
    const messageStanza = xml(
        'message',
        { to: `${recipient}@${domain}`, type: 'chat' },
        xml('body', {}, message)
    );
    await xmpp.send(messageStanza); // Envía el mensaje
    const endTime = Date.now(); // Marca el tiempo final
    const timeTaken = endTime - startTime; // Calcula el tiempo total en ms
    console.log(`Mensaje enviado de ${sender} a ${recipient} en ${timeTaken} ms.`);
    return timeTaken;
}

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


module.exports = {
    linkStateRouting,
    login,
    sendMessageAndMeasureTime
};

// Ejemplo de uso

/*
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


*/

console.log('------------------------------------------------------------');
console.log(`
.____    .__        __       _________ __          __           __________               __  .__                
|    |   |__| ____ |  | __  /   _____//  |______ _/  |_  ____   \______   \ ____  __ ___/  |_|__| ____    ____  
|    |   |  |/    \|  |/ /  \_____  \\   __\__  \\   __\/ __ \   |       _//  _ \|  |  \   __\  |/    \  / ___\ 
|    |___|  |   |  \    <   /        \|  |  / __ \|  | \  ___/   |    |   (  <_> )  |  /|  | |  |   |  \/ /_/  >
|_______ \__|___|  /__|_ \ /_______  /|__| ____  /__|  \___  >  |____|_  /\____/|____/ |__| |__|___|  /\___  / 
        \/       \/     \/         \/           \/          \/          \/                           \//_____/`);

