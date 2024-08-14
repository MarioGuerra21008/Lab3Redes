class Node {
    constructor(id) {
        this.id = id;
        this.neighbors = [];
        this.receivedMessages = new Set(); // Para evitar procesar el mismo mensaje varias veces
    }

    addNeighbor(node) {
        this.neighbors.push(node);
    }

    sendMessage(message, source) {
        // Si el nodo ya ha recibido este mensaje, no lo reenvía
        if (this.receivedMessages.has(message)) {
            return;
        }

        // Marca el mensaje como recibido
        this.receivedMessages.add(message);
        console.log(`Node ${this.id} received message: ${message}`);

        // Enviar el mensaje a los vecinos
        this.neighbors.forEach(neighbor => {
            if (neighbor !== source) { // No enviar de vuelta al remitente
                neighbor.sendMessage(message, this);
            }
        });
    }
}

// Ejemplo de uso:

// Crear nodos
const nodeA = new Node('A');
const nodeB = new Node('B');
const nodeC = new Node('C');
const nodeD = new Node('D');

// Conectar los nodos
nodeA.addNeighbor(nodeB);
nodeB.addNeighbor(nodeA);
nodeB.addNeighbor(nodeC);
nodeC.addNeighbor(nodeB);
nodeC.addNeighbor(nodeD);
nodeD.addNeighbor(nodeC);

// Iniciar la difusión
nodeA.sendMessage('Hello', null);
