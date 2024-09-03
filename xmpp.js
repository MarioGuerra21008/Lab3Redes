const XMPPLinkStateRouter = require('./XMPPLinkStateRouting.js');
const fs = require('fs');
const Node = require('./Flooding/flooding.js');  // Importar la clase Node para Flooding
const readline = require('readline')

// Función para leer la configuración de nombres desde el archivo
function readConfigFile(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);  // Convertir el contenido del archivo a un objeto JSON
}

async function main() {
    const topologyConfig = readConfigFile('topology.txt');
    const namesConfig = readConfigFile('names.txt');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Usuario: ', (username) => {
        rl.question('Contraseña: ', async (password) => {
            const node = Object.keys(namesConfig.config).find(key => namesConfig.config[key].startsWith(username));

            if (!node || !topologyConfig.config[node]) {
                console.error('Usuario no encontrado en la topología.');
                rl.close();
                return;
            }

            const router = new XMPPLinkStateRouter(username, password);
            router.currentNode = node;
            router.neighbors = topologyConfig.config[node].map(neighbor => namesConfig.config[neighbor].split('@')[0]);
            router.nodeToJID = Object.keys(namesConfig.config).reduce((map, key) => {
                map[key] = namesConfig.config[key].split('@')[0];
                return map;
            }, {});
            router.jidToNode = Object.entries(router.nodeToJID).reduce((map, [key, jid]) => {
                map[jid] = key;
                return map;
            }, {});

            try {
                await router.connect();
                console.log('Conectado y listo para enviar mensajes.');

                rl.on('line', (input) => {
                    if (input.trim().toLowerCase() === 'exit') {
                        console.log('Cerrando programa...');
                        rl.close();
                        process.exit(0);
                    }

                    const [to, ...messageParts] = input.split(' ');
                    const message = messageParts.join(' ');
                    if (to && message) {
                        router.sendUserMessage(to, message);
                    } else {
                        console.log('Uso: <destinatario> <mensaje>');
                    }
                });

            } catch (err) {
                console.error('Error al conectar o enviar el mensaje:', err);
            }
        });
    });
}

main();