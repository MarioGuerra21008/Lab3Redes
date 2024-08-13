const graph = {
    A: { D: 1, E: 2 },
    B: { D: 2, F: 3, G: 1 },
    C: { E: 3, G: 2 },
    D: { A: 1, B: 2, G: 1 },
    E: { A: 2, C: 3, F: 1 },
    F: { B: 3, E: 1 },
    G: { B: 1, C: 2, D: 1 }
  };
  
  function dijkstra(graph, startNode) {
    const distances = {};
    const previous = {};
    const nodes = new Set(Object.keys(graph));
  
    // Inicializar distancias
    nodes.forEach(node => {
      distances[node] = node === startNode ? 0 : Infinity;
      previous[node] = null;
    });
  
    while (nodes.size > 0) {
      // Seleccionar el nodo más cercano
      let closestNode = null;
      nodes.forEach(node => {
        if (!closestNode || distances[node] < distances[closestNode]) {
          closestNode = node;
        }
      });
  
      // Marcar el nodo como visitado
      nodes.delete(closestNode);
  
      // Actualizar distancias a los vecinos
      for (let neighbor in graph[closestNode]) {
        const newDist = distances[closestNode] + graph[closestNode][neighbor];
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previous[neighbor] = closestNode;
        }
      }
    }
  
    return { distances, previous };
  }
  
  // Ejemplo de uso
  const startNode = 'A';
  const result = dijkstra(graph, startNode);
  console.log('Distancias:', result.distances);
  console.log('Caminos anteriores:', result.previous);