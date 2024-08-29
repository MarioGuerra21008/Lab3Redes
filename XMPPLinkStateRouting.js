const { client, xml } = require("@xmpp/client");
const { linkStateRouting } = require('./LinkStateRouting/linkstaterouting.js');
const Node = require('./Flooding/flooding.js');

const domain = "alumchat.lol";
const service = "xmpp://alumchat.lol:5222";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class XMPPLinkStateRouter {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.to = "";
        this.xmpp = null;
        this.neighbors = [];
        this.weightTable = {};
        this.weightVersion = 0;
        this.nodeToJID = {};
        this.jidToNode = {};
        this.echoStartTimes = {};  // Para guardar los tiempos de inicio del eco
        this.echoIterationLimit = 1;  // Límite de iteraciones de eco
        this.currentEchoIteration = 0;  // Contador de iteraciones de eco
        this.currentNeighbor = ""
        this.currentNode = "A"
        this.floodingNodes = {};  // Para almacenar los nodos en el algoritmo de Flooding

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

            //console.log(this.nodeToJID)

            // Ahora, configuras `jidToNode` al mismo tiempo
            Object.entries(this.nodeToJID).forEach(([node, jid]) => {
                this.jidToNode[jid] = node;
                this.floodingNodes[node] = new Node(node);
            });

            Object.keys(this.floodingNodes).forEach(node => {
                // Conectar los nodos de Flooding
                const currentNode = this.floodingNodes[node];
                const neighbors = this.neighbors.filter(neighbor => neighbor !== node);  // Todos los vecinos excepto el actual
                neighbors.forEach(neighbor => {
                    currentNode.addNeighbor(this.floodingNodes[neighbor]);
                });
            });

            //console.log(this.jidToNode);
    
            // Enviar presencia para anunciar la conexión
            this.xmpp.send(xml('presence'));
    
            this.startEchoProcess();
        });

        this.xmpp.on("error", (err) => {
            console.error("Error en la conexión XMPP:", err.message);
        });

        this.xmpp.on('offline', () => {
            console.log('Cliente XMPP desconectado.');
        });
        
        this.xmpp.on('disconnect', () => {
            console.log('Desconectado. Intentando reconectar...');
            this.xmpp.start().catch(err => console.error("Error al reconectar:", err.message));
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
            { 
                to: `${to}@${domain}`,  // JID del destinatario
                from: `${this.username}@${domain}`,  // JID del remitente
                type: 'chat'  // Tipo de mensaje 'chat'
            },
            xml('body', {}, JSON.stringify(body))  // Cuerpo del mensaje como texto JSON
        );
    
        //console.log('Stanza enviada:', message.toString());  // Imprimir la stanza completa como cadena
        this.handleStanza(message);
    
        try {
            await this.xmpp.send(message);  // Enviar el mensaje
            //console.log(`Mensaje enviado a ${to}:`, body);  // Confirmación de envío de mensaje
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);  // Manejo de errores
        }
    }    
    

    handleStanza(stanza) {
        //console.log("handleStanza recibida: ", stanza.toString());  // Imprimir la stanza completa como cadena
    
        // Manejar solo stanzas de tipo 'message' que tienen un 'body'
        if (stanza.is('message') && stanza.getChild('body')) {
            //console.log("Dentro del if (stanza es 'message' con 'body')");
    
            const from = stanza.attrs.from.split('@')[0];
            const bodyText = stanza.getChildText('body');
    
            // Validar que el texto del cuerpo sea JSON válido
            try {
                const body = JSON.parse(bodyText);
    
                console.log("body: ", body);

                switch (body.type) {
                    case 'echo':
                        console.log("Mensaje 'echo' recibido de:", from);
                        this.handleEcho(from);
                        break;
                    case 'echo_response':
                        console.log("Mensaje 'echo_response' recibido de:", from);
                        this.handleEchoResponse(from);
                        break;
                    case 'weights':
                        this.handleWeights(body);
                        break;
                    case 'send_routing':
                        //console.log("body routing: ", body);
                        this.handleSendRouting(body);
                        break;
                    case 'message':
                        this.handleUserMessage(body);
                        break;
                    case 'flooding':
                        this.handleFloodingMessage(body);  // Manejar mensajes de Flooding
                        break;
                    default:
                        console.warn(`Tipo de mensaje no reconocido: ${body.type}`);
                        break;
                }
            } catch (error) {
                console.error('Error al parsear el body del mensaje como JSON:', error, 'Body:', bodyText);
            }
        }
    }
    

    startEchoProcess() {
        const echoInterval = setInterval(() => {
            if (this.currentEchoIteration >= this.echoIterationLimit) {
                console.log('Límite de iteraciones de eco alcanzado. Deteniendo el proceso.');
                clearInterval(echoInterval);
                return;
            }
    
            this.neighbors.forEach(neighbor => {
                //console.log(`Enviando mensaje de 'echo' a ${neighbor}`);  // Verificar el vecino antes de enviar
                this.currentNeighbor = neighbor
                this.echoStartTimes[neighbor] = Date.now();  // Guardar el tiempo de envío

                //console.log("this.echoStartTimes[neighbor]: ", this.echoStartTimes[neighbor]);
                this.sendMessage(neighbor, { type: 'echo' });
            });
    
            this.currentEchoIteration++;
        }, 10000); // Cada 30 segundos
    }
    

    handleEcho(from) {
        console.log(`Echo recibido de ${from}, enviando echo_response.`);  // Debug
        this.sendMessage(from, { type: 'echo_response' });
    }

    handleEchoResponse(fromJID) {
        const endTime = Date.now();
        const startTime = this.echoStartTimes[this.currentNeighbor];
    
        if (startTime !== undefined) {  // Verificar que el tiempo de inicio esté definido
            const elapsed = (endTime - startTime) / 1000;  // Convertir a segundos
            const node = this.jidToNode[this.currentNeighbor];  // Convertir JID a letra de nodo
            console.log(`Tiempo transcurrido para el eco desde ${node}: ${elapsed} segundos`);
            this.updateWeight(node, elapsed);  // Usar la letra del nodo en lugar del JID
        } else {
            console.error(`Tiempo de inicio no definido para ${fromJID}. No se puede calcular el tiempo de eco.`);
        }
    }
    
    updateWeight(node, weight) {
        if (!isNaN(weight)) {  // Verificar que el peso no sea NaN
            this.weightTable[node] = weight;  // Guardar el peso directamente con la letra del nodo
            this.weightVersion++;
            console.log(`Tabla de pesos actualizada (versión ${this.weightVersion}):`, this.weightTable);  // Imprimir tabla de pesos
            this.broadcastWeights();
        } else {
            console.error(`Peso no válido (NaN) para el nodo ${node}. No se actualiza la tabla de pesos.`);
        }
    }    

    broadcastWeights() {
        const weightMessage = {
            type: 'weights',
            table: this.weightTable,
            version: this.weightVersion,
            from: this.username
        };
        console.log(`Enviando tabla de pesos a los vecinos:`, weightMessage);  // Imprimir mensaje de pesos enviado
        this.neighbors.forEach(neighbor => {
            this.sendMessage(neighbor, weightMessage);
        });
    }

    handleWeights(body) {
        if (body.version > this.weightVersion) {
            console.log(`Recibida nueva versión de tabla de pesos de ${body.from}:`, body.table);  // Imprimir tabla de pesos recibida
            Object.assign(this.weightTable, body.table);
            this.weightVersion = body.version;

            // Reenviar a los vecinos la nueva tabla de pesos
            this.neighbors.forEach(neighbor => {
                if (neighbor !== body.from) {
                    this.sendMessage(neighbor, body);
                }
            });
        } else {
            console.log(`Versión de tabla de pesos recibida de ${body.from} es obsoleta. No se reenvía.`);  // Mensaje de versión obsoleta
        }
    }

    handleSendRouting(body) {

        console.log("this.currentNode: ",this.currentNode);

        if (body.to === this.currentNode) {
            this.handleUserMessage({
                type: 'message',
                from: body.from,
                data: body.data
            });
        } else if (body.hops > 0) {
            const graph = this.buildGraphFromWeights();
            //console.log("SENDROUTING: ",body.to);
            //console.log("SENDROUTING2: ",this.jidToNode[body.to]);
            const result = linkStateRouting(graph, this.jidToNode[this.username], body.to);
            const nextHop = result.path[1];

            body.hops--;  // Reducir el número de saltos restantes
            console.log(`Reenviando mensaje de enrutamiento a ${nextHop}`);  // Mensaje de reenviando
            console.log(this.nodeToJID);
            this.sendMessage(this.nodeToJID[nextHop], body);
            
        } else {
            console.log(`Hops agotados para mensaje de enrutamiento de ${body.from} a ${body.to}`);  // Mensaje de hops agotados
        }
    }

    handleUserMessage(body) {
        console.log(`Mensaje recibido de ${body.from}: ${body.data}`);
    }

    buildGraphFromWeights() {
        const graph = {};
    
        console.log("WeightTable: ", this.weightTable);

        // Agregar cada nodo y sus vecinos al grafo basado en weightTable
        for (const [node, weight] of Object.entries(this.weightTable)) {
            if (!graph[this.jidToNode[this.username]]) {
                graph[this.jidToNode[this.username]] = {}; // Inicializa el nodo del usuario en el grafo
            }
    
            // Agregar la conexión del nodo con su peso
            graph[this.jidToNode[this.username]][node] = weight;
            
            if (!graph[node]) {
                graph[node] = {}; // Inicializa el nodo en el grafo si no existe
            }
    
            // Asegurar que el grafo sea bidireccional (si 'A' tiene conexión con 'B', 'B' debe tener conexión con 'A')
            graph[node][this.jidToNode[this.username]] = weight;
        }
    
        console.log('Grafo construido desde weightTable:', graph);  // Debug para mostrar el grafo construido
        return graph;
    }
    

    sendUserMessage(to, message) {

        console.log("to: ", this.jidToNode[to])
        console.log("from: ",this.jidToNode[this.username])


        const routingMessage = {
            type: 'send_routing',
            to: this.jidToNode[to],
            from: this.jidToNode[this.username],
            data: message,
            hops: Object.keys(this.nodeToJID).length
        };

        const graph = this.buildGraphFromWeights();

        console.log("graph: ", graph);

        const result = linkStateRouting(graph, this.jidToNode[this.username], this.jidToNode[to]);

        if (result && result.path.length > 1) {
            const nextHop = result.path[1];
            console.log(`Enviando mensaje de usuario a través de enrutamiento a ${nextHop}`);  // Mensaje de envío de usuario
            this.currentNode = nextHop
            this.sendMessage(this.nodeToJID[nextHop], routingMessage);
        } else {
            console.error(`No se pudo encontrar el siguiente salto para el mensaje de enrutamiento de ${this.username} a ${to}.`);
        }
    }


    handleFloodingMessage(body) {
        if (body.from !== this.username) {
            console.log(`Mensaje de flooding recibido de ${body.from}: ${body.data}`);
            this.neighbors.forEach(neighbor => {
                if (neighbor !== body.from) {
                    this.sendMessage(neighbor, body);
                }
            });
        }
    }

    startFlooding(message) {
        const floodingMessage = {
            type: 'flooding',
            from: this.username,
            data: message
        };
        this.neighbors.forEach(neighbor => {
            this.sendMessage(neighbor, floodingMessage);
        });
    }

}

module.exports = XMPPLinkStateRouter;