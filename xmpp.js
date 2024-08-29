const XMPPLinkStateRouter = require('./XMPPLinkStateRouting.js');

async function main() {
    const router = new XMPPLinkStateRouter('alv21188-gajim', '31dic2002');
    await router.connect();

    // Configurar vecinos (suponiendo que estos son tus vecinos directos)
    router.neighbors = ['alv21188-test1', 'alv21188-test2', 'alv21188-test3'];

    // Mapeo de nodos a JIDs (incluyendo tu propio nodo)
    router.nodeToJID = {
        'A': 'alv21188-gajim',  // Tu propio nodo
        'B': 'alv21188-test1',
        'C': 'alv21188-test2',  // El nodo al que quieres enviar el mensaje
        'D': 'alv21188-test3'
    };

    // Enviar un mensaje de usuario
    router.sendUserMessage('alv21188-test2', 'Hola, este es un mensaje de prueba');
}

main();