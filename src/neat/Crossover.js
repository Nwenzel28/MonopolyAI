export class Crossover {
  static instance = null;

  constructor() {
    this.CROSSOVER_CHANCE = 0.75;
    this.C1 = 1.0;
    this.C2 = 1.0;
    this.C3 = 0.4;
    this.DISTANCE = 1.0;
  }

  static initialize() {
    if (!Crossover.instance) {
      Crossover.instance = new Crossover();
    }
    return Crossover.instance;
  }

  produceOffspring(first, second) {
    const copy_first = [...first.edges];
    const copy_second = [...second.edges];
    const match_first = [];
    const match_second = [];
    const disjoint_first = [];
    const disjoint_second = [];
    const excess_first = [];
    const excess_second = [];

    const invmax_first = first.edges[first.edges.length - 1].innovation;
    const invmax_second = second.edges[second.edges.length - 1].innovation;
    const invmin = Math.min(invmax_first, invmax_second);

    // Find matching genes
    for (let i = 0; i < copy_first.length; i++) {
      for (let j = 0; j < copy_second.length; j++) {
        if (copy_first[i].innovation === copy_second[j].innovation) {
          match_first.push(copy_first[i]);
          match_second.push(copy_second[j]);
          copy_first.splice(i, 1);
          copy_second.splice(j, 1);
          i--;
          break;
        }
      }
    }

    // Categorize remaining genes
    for (const edge of copy_first) {
      if (edge.innovation > invmin) {
        excess_first.push(edge);
      } else {
        disjoint_first.push(edge);
      }
    }

    for (const edge of copy_second) {
      if (edge.innovation > invmin) {
        excess_second.push(edge);
      } else {
        disjoint_second.push(edge);
      }
    }

    // Create child genotype
    const child = new Genotype();

    // Add matching genes
    for (let i = 0; i < match_first.length; i++) {
      const source = Math.random() < 0.5 || !match_second[i].enabled ? 
        match_first[i] : match_second[i];
      
      child.addEdge(
        source.source,
        source.destination,
        source.weight,
        source.enabled,
        source.innovation
      );
    }

    // Add disjoint and excess genes from first parent
    for (const edge of [...disjoint_first, ...excess_first]) {
      child.addEdge(
        edge.source,
        edge.destination,
        edge.weight,
        edge.enabled,
        edge.innovation
      );
    }

    child.sortEdges();

    // Add vertices
    const ends = [];
    for (const vertex of first.vertices) {
      if (vertex.type === VertexType.HIDDEN) break;
      ends.push(vertex.index);
      child.addVertex(vertex.type, vertex.index);
    }

    this.addUniqueVertices(child, ends);
    child.sortVertices();

    return child;
  }

  addUniqueVertices(genotype, ends) {
    const unique = new Set();

    for (const edge of genotype.edges) {
      if (!ends.includes(edge.source) && !unique.has(edge.source)) {
        unique.add(edge.source);
      }
      if (!ends.includes(edge.destination) && !unique.has(edge.destination)) {
        unique.add(edge.destination);
      }
    }

    for (const index of unique) {
      genotype.addVertex(VertexType.HIDDEN, index);
    }
  }

  speciationDistance(first, second) {
    const copy_first = [...first.edges];
    const copy_second = [...second.edges];
    const match_first = [];
    const match_second = [];
    let diff = 0;

    // Find matching genes and calculate weight differences
    for (let i = 0; i < copy_first.length; i++) {
      for (let j = 0; j < copy_second.length; j++) {
        if (copy_first[i].innovation === copy_second[j].innovation) {
          diff += Math.abs(copy_first[i].weight - copy_second[j].weight);
          match_first.push(copy_first[i]);
          match_second.push(copy_second[j]);
          copy_first.splice(i, 1);
          copy_second.splice(j, 1);
          i--;
          break;
        }
      }
    }

    const n = Math.max(first.edges.length, second.edges.length);
    const E = copy_first.length / n;
    const D = copy_second.length / n;
    const W = diff / match_first.length;

    return E * this.C1 + D * this.C2 + W * this.C3;
  }
}