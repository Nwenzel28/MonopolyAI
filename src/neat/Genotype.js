export const VertexType = {
  INPUT: 0,
  HIDDEN: 1,
  OUTPUT: 2
};

export class VertexInfo {
  constructor(type, index) {
    this.type = type;
    this.index = index;
  }
}

export class EdgeInfo {
  constructor(source, destination, weight, enabled) {
    this.source = source;
    this.destination = destination;
    this.weight = weight;
    this.enabled = enabled;
    this.innovation = 0;
  }
}

export class Genotype {
  constructor() {
    this.vertices = [];
    this.edges = [];
    this.inputs = 0;
    this.externals = 0;
    this.bracket = 0;
    this.fitness = 0;
    this.adjustedFitness = 0;
  }

  addVertex(type, index) {
    const vertex = new VertexInfo(type, index);
    this.vertices.push(vertex);

    if (vertex.type !== VertexType.HIDDEN) {
      this.externals++;
    }

    if (vertex.type === VertexType.INPUT) {
      this.inputs++;
    }
  }

  addEdge(source, destination, weight, enabled, innovation = 0) {
    const edge = new EdgeInfo(source, destination, weight, enabled);
    edge.innovation = innovation;
    this.edges.push(edge);
  }

  clone() {
    const copy = new Genotype();
    
    for (const vertex of this.vertices) {
      copy.addVertex(vertex.type, vertex.index);
    }

    for (const edge of this.edges) {
      copy.addEdge(edge.source, edge.destination, edge.weight, edge.enabled, edge.innovation);
    }

    return copy;
  }

  sortTopology() {
    this.sortVertices();
    this.sortEdges();
  }

  sortVertices() {
    this.vertices.sort((a, b) => a.index - b.index);
  }

  sortEdges() {
    this.edges.sort((a, b) => a.innovation - b.innovation);
  }
}