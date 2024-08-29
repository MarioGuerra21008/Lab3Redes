const XMPPLinkStateRouter = require('./XMPPLinkStateRouting.js');
const fs = require('fs');


// Función para leer la configuración de nombres desde el archivo
function readConfigFile(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);  // Convertir el contenido del archivo a un objeto JSON
}

async function main() {
    const router = new XMPPLinkStateRouter('alv21188-t1', '31dic2002');
    try {

        // Cargar solo los vecinos directos de este nodo
        const topologyConfig = readConfigFile('topology.txt');
        const namesConfig = readConfigFile('names.txt');

        // Determinar el nodo actual
        const currentNode = 'A';  // Nodo actual donde se ejecuta este script

        // Configurar vecinos solo según la información de vecinos directos
        router.neighbors = topologyConfig.config[currentNode].map(node => namesConfig.config[node].split('@')[0]);

        // Configurar el mapeo de nodos a JIDs (solo vecinos)
        router.nodeToJID = topologyConfig.config[currentNode].reduce((map, node) => {
            map[node] = namesConfig.config[node].split('@')[0];
            return map;
        }, { [currentNode]: namesConfig.config[currentNode].split('@')[0] });  // Incluir también el propio nodo

        // Mapeo de JID a Nodo
        router.jidToNode = Object.entries(router.nodeToJID).reduce((map, [node, jid]) => {
            map[jid] = node;  // Mapeo inverso de nombre de usuario a nodo
            return map;
        }, {});

        // Validar que los vecinos y el mapeo de nodos estén configurados correctamente
        console.log('Vecinos configurados:', router.neighbors);
        console.log('Mapeo de nodos a JIDs:', router.nodeToJID);

        // Enviar un mensaje de usuario
        console.log('Enviando mensaje a alv21188-test2...');

        // Conectar al servidor XMPP
        await router.connect();

        // Esperar hasta que se actualice la tabla de pesos
        console.log('Esperando a que se complete el proceso de eco y se actualice la tabla de pesos...');
        await new Promise(resolve => setTimeout(resolve, 35000));  // Esperar más tiempo si es necesario

        // Validar que la tabla de pesos está actualizada
        console.log('Tabla de pesos actualizada:', router.weightTable);

        // Enviar un mensaje de usuario
        console.log('Enviando mensaje a alv21188-test2...');
        router.sendUserMessage('alv21188-test2', 'Hola, este es un mensaje de prueba');

    } catch (err) {
        console.error('Error al conectar o enviar el mensaje:', err);
    }
}

main();