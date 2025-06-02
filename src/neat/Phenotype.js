export class Vertex {
  static Type = {
    INPUT: 0,
    HIDDEN: 1,
    OUTPUT: 2
  };

  constructor(type, index) {
    this.type = type;
    this.index = index;
    this.incoming = [];
    this.value = 0;
  }
}

export class Edge {
  static Type = {
    FORWARD: 'FORWARD',
    RECURRENT: 'RECURRENT'
  };

  constructor(source, destination, weight, enabled) {
    this.type = Edge.Type.FORWARD;
    this.source = source;
    this.destination = destination;
    this.weight = weight;
    this.enabled = enabled;
    this.signal = 0;
  }
}

export class Phenotype {
  constructor() {
    this.vertices = [];
    this.edges = [];
    this.vertices_inputs = [];
    this.vertices_outputs = [];
    this.score = 0;
  }

  inscribeGenotype(code) {
    this.vertices = [];
    this.edges = [];

    for (const vertex of code.vertices) {
      this.addVertex(vertex.type, vertex.index);
    }

    for (const edge of code.edges) {
      this.addEdge(edge.source, edge.destination, edge.weight, edge.enabled);
    }
  }

  addVertex(type, index) {
    const vertex = new Vertex(type, index);
    this.vertices.push(vertex);
  }

  addEdge(source, destination, weight, enabled) {
    const edge = new Edge(source, destination, weight, enabled);
    this.edges.push(edge);
    this.vertices[edge.destination].incoming.push(edge);
  }

  processGraph() {
    this.vertices_inputs = [];
    this.vertices_outputs = [];

    for (const vertex of this.vertices) {
      if (vertex.type === Vertex.Type.INPUT) {
        this.vertices_inputs.push(vertex);
      } else if (vertex.type === Vertex.Type.OUTPUT) {
        this.vertices_outputs.push(vertex);
      }
    }
  }

  resetGraph() {
    for (const vertex of this.vertices) {
      vertex.value = 0;
    }
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  propagate(X) {
    const repeats = 10;

    for (let e = 0; e < repeats; e++) {
      // Set input values
      for (let i = 0; i < this.vertices_inputs.length; i++) {
        this.vertices_inputs[i].value = X[i];
      }

      // Process hidden nodes
      for (let i = 0; i < this.vertices.length; i++) {
        if (this.vertices[i].type === Vertex.Type.OUTPUT) continue;

        const paths = this.vertices[i].incoming.length;
        let sum = 0;

        for (let j = 0; j < paths; j++) {
          const edge = this.vertices[i].incoming[j];
          sum += this.vertices[edge.source].value * edge.weight * (edge.enabled ? 1 : 0);
        }

        if (paths > 0) {
          this.vertices[i].value = this.sigmoid(sum);
        }
      }

      // Process output nodes
      const Y = new Array(this.vertices_outputs.length).fill(0);

      for (let i = 0; i < this.vertices_outputs.length; i++) {
        const paths = this.vertices_outputs[i].incoming.length;
        let sum = 0;

        for (let j = 0; j < paths; j++) {
          const edge = this.vertices_outputs[i].incoming[j];
          sum += this.vertices[edge.source].value * edge.weight * (edge.enabled ? 1 : 0);
        }

        if (paths > 0) {
          this.vertices_outputs[i].value = this.sigmoid(sum);
          Y[i] = this.vertices_outputs[i].value;
        }
      }

      if (e === repeats - 1) {
        return Y;
      }
    }

    return [];
  }
}