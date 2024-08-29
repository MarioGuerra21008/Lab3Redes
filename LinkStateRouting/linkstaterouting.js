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

const domain = "alumchat.lol";
const service = "xmpp://alumchat.lol:5222";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let xmpp = null;

async function login(username, password) {
    xmpp = client({
        service: service,
        domain: domain,
        username: username,
        password: password,
    });

    xmpp.on('online', (address) => {
        console.log('Conexión XMPP exitosa como:', address.toString());
    });

    xmpp.on("error", (err) => {
        console.error("Error en la conexión XMPP:", err.message);
    });

    xmpp.on('offline', () => {
        console.log('Cliente XMPP desconectado.');
    });

    xmpp.on('disconnect', () => {
        console.log('Desconectado. Intentando reconectar...');
        xmpp.start().catch(err => console.error("Error al reconectar:", err.message));
    });

    try {
        await xmpp.start();
    } catch (err) {
        if (err.condition === "not-authorized") {
            console.log("Credenciales incorrectas!");
        } else {
            console.log("Lo siento, hubo un problema: " + err.message);
        }
    }
}

async function sendMessageAndMeasureTime(sender, recipient, message) {
    const startTime = Date.now();
    const messageStanza = xml(
        'message',
        { to: `${recipient}@${domain}`, type: 'chat' },
        xml('body', {}, message)
    );
    await xmpp.send(messageStanza);
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
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
    if (!graph[startNode]) {
        console.error(`Nodo de inicio ${startNode} no existe en el grafo.`);
        return null;
    }
    
    if (!graph[targetNode]) {
        console.error(`Nodo de destino ${targetNode} no existe en el grafo.`);
        return null;
    }

    updateGraphWeights(graph);
    const lsaDatabase = floodLSA(graph);
    const routingTable = buildRoutingTable(graph, startNode, lsaDatabase);

    if (!routingTable || !routingTable.distances[targetNode]) {
        console.error(`No se pudo encontrar una ruta desde ${startNode} a ${targetNode}.`);
        return null;
    }

    const totalDistance = routingTable.distances[targetNode];
    const path = getPath(routingTable.previous, targetNode);

    console.log(`Ruta calculada desde ${startNode} a ${targetNode}: ${path.join(' -> ')}`);
    
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

