const {linkStateRouting, login, sendMessageAndMeasureTime} = require('./LinkStateRouting/linkstaterouting.js');
const { 
    graph
} = require('./Dijkstra/dijkstra.js');


async function main() {
    const username = "tu_nombre_usuario";
    const password = "tu_contraseña";

    // Iniciar sesión
    await login(username, password);

    // Realizar enrutamiento de estado de enlace
    const startNode = 'A';
    const targetNode = 'C';
    const result = linkStateRouting(graph, startNode, targetNode);
    
    console.log('Resultado de enrutamiento:', result);

    // Enviar un mensaje y medir el tiempo
    await sendMessageAndMeasureTime(username, 'otro_usuario', 'Hola, prueba de mensaje');
}

main();