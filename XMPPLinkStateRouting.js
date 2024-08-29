const { client, xml } = require("@xmpp/client");
const { linkStateRouting } = require('./LinkStateRouting/linkstaterouting.js');

const domain = "alumchat.lol";
const service = "xmpp://alumchat.lol:5222";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class XMPPLinkStateRouter {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.xmpp = null;
        this.neighbors = []; // Lista de vecinos
        this.weightTable = {}; // Tabla de pesos
        this.weightVersion = 0; // Versión de la tabla de pesos
        this.nodeToJID = {}; // Mapeo de nodos (letras) a JIDs
    }

    async connect() {
        this.xmpp = client({
            service: service,
            domain: domain,
            username: this.username,
            password: this.password,
        });

        this.xmpp.on('online', (address) => {
            console.log('Conexión XMPP exitosa como:', address.toString());
            this.startEchoProcess();
        });

        this.xmpp.on("error", (err) => {
            console.error("Error en la conexión XMPP:", err.message);
        });

        this.xmpp.on('stanza', this.handleStanza.bind(this));

        try {
            await this.xmpp.start();
        } catch (err) {
            console.error("Error al conectar:", err.message);
        }
    }

    async sendMessage(to, body) {
        const message = xml(
            'message',
            { to: `${to}@${domain}`, type: 'chat' },
            xml('body', {}, JSON.stringify(body))
        );
        await this.xmpp.send(message);
    }

    handleStanza(stanza) {
        if (stanza.is('message') && stanza.getChild('body')) {
            const from = stanza.attrs.from.split('@')[0];
            const body = JSON.parse(stanza.getChildText('body'));

            switch (body.type) {
                case 'echo':
                    this.handleEcho(from);
                    break;
                case 'echo_response':
                    this.handleEchoResponse(from);
                    break;
                case 'weights':
                    this.handleWeights(body);
                    break;
                case 'send_routing':
                    this.handleSendRouting(body);
                    break;
                case 'message':
                    this.handleUserMessage(body);
                    break;
            }
        }
    }

    startEchoProcess() {
        setInterval(() => {
            this.neighbors.forEach(neighbor => {
                this.sendMessage(neighbor, { type: 'echo' });
            });
        }, 60000); // Cada minuto
    }

    handleEcho(from) {
        this.sendMessage(from, { type: 'echo_response' });
    }

    handleEchoResponse(from) {
        // Aquí deberías implementar la lógica para medir el tiempo y actualizar los pesos
        // Por simplicidad, usaremos un peso aleatorio entre 1 y 10
        const weight = Math.random() * 9 + 1;
        this.updateWeight(from, weight);
    }

    updateWeight(node, weight) {
        this.weightTable[node] = weight;
        this.weightVersion++;
        this.broadcastWeights();
    }

    broadcastWeights() {
        const weightMessage = {
            type: 'weights',
            table: this.weightTable,
            version: this.weightVersion,
            from: this.username
        };
        this.neighbors.forEach(neighbor => {
            this.sendMessage(neighbor, weightMessage);
        });
    }

    handleWeights(body) {
        if (body.version > this.weightVersion) {
            // Actualizar la tabla de pesos local
            Object.assign(this.weightTable, body.table);
            this.weightVersion = body.version;

            // Reenviar a los vecinos
            this.neighbors.forEach(neighbor => {
                if (neighbor !== body.from) {
                    this.sendMessage(neighbor, body);
                }
            });
        }
    }

    handleSendRouting(body) {
        if (body.to === this.username) {
            // El mensaje es para nosotros, convertirlo a un mensaje de usuario
            this.handleUserMessage({
                type: 'message',
                from: body.from,
                data: body.data
            });
        } else if (body.heap > 0) {
            // Usar el algoritmo de enrutamiento para encontrar el siguiente salto
            const graph = this.buildGraphFromWeights();
            const result = linkStateRouting(graph, this.username, body.to);
            const nextHop = result.path[1]; // El siguiente salto en la ruta

            // Enviar al siguiente salto
            body.heap--;
            this.sendMessage(this.nodeToJID[nextHop], body);
        }
    }

    handleUserMessage(body) {
        console.log(`Mensaje recibido de ${body.from}: ${body.data}`);
    }

    buildGraphFromWeights() {
        // Construir el grafo a partir de la tabla de pesos
        const graph = {};
        for (const [node, weight] of Object.entries(this.weightTable)) {
            graph[this.username] = graph[this.username] || {};
            graph[this.username][node] = weight;
            graph[node] = graph[node] || {};
            graph[node][this.username] = weight;
        }
        return graph;
    }

    sendUserMessage(to, message) {
        const routingMessage = {
            type: 'send_routing',
            to: to,
            from: this.username,
            data: message,
            hops: Object.keys(this.nodeToJID).length
        };
        
        const graph = this.buildGraphFromWeights();
        const result = linkStateRouting(graph, this.username, to);
        const nextHop = result.path[1]; // El siguiente salto en la ruta

        this.sendMessage(this.nodeToJID[nextHop], routingMessage);
    }
}

module.exports = XMPPLinkStateRouter;