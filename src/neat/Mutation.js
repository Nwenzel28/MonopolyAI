import { RNG } from '../RNG.js';
import { VertexType, EdgeInfo } from './Genotype.js';

export class Mutation {
  static instance = null;

  constructor() {
    this.MUTATE_LINK = 0.2;
    this.MUTATE_NODE = 0.1;
    this.MUTATE_ENABLE = 0.6;
    this.MUTATE_DISABLE = 0.2;
    this.MUTATE_WEIGHT = 2.0;
    this.PETRUB_CHANCE = 0.9;
    this.SHIFT_STEP = 0.1;
    this.historical = [];
  }

  static initialize() {
    if (!Mutation.instance) {
      Mutation.instance = new Mutation();
    }
    return Mutation.instance;
  }

  registerMarking(info) {
    for (let i = 0; i < this.historical.length; i++) {
      const marking = this.historical[i];
      if (marking.source === info.source && marking.destination === info.destination) {
        return marking.order;
      }
    }

    const creation = {
      order: this.historical.length,
      source: info.source,
      destination: info.destination
    };

    this.historical.push(creation);
    return this.historical.length - 1;
  }

  mutateAll(genotype) {
    let p = this.MUTATE_WEIGHT;
    while (p > 0) {
      if (Math.random() < p) {
        this.mutateWeight(genotype);
      }
      p--;
    }

    p = this.MUTATE_LINK;
    while (p > 0) {
      if (Math.random() < p) {
        this.mutateLink(genotype);
      }
      p--;
    }

    p = this.MUTATE_NODE;
    while (p > 0) {
      if (Math.random() < p) {
        this.mutateNode(genotype);
      }
      p--;
    }

    p = this.MUTATE_DISABLE;
    while (p > 0) {
      if (Math.random() < p) {
        this.mutateDisable(genotype);
      }
      p--;
    }

    p = this.MUTATE_ENABLE;
    while (p > 0) {
      if (Math.random() < p) {
        this.mutateEnable(genotype);
      }
      p--;
    }
  }

  mutateLink(genotype) {
    const potential = [];
    
    for (let i = 0; i < genotype.vertices.length; i++) {
      for (let j = 0; j < genotype.vertices.length; j++) {
        const source = genotype.vertices[i].index;
        const destination = genotype.vertices[j].index;
        const t1 = genotype.vertices[i].type;
        const t2 = genotype.vertices[j].type;

        if (t1 === VertexType.OUTPUT || t2 === VertexType.INPUT) continue;
        if (source === destination) continue;

        const exists = genotype.edges.some(edge => 
          edge.source === source && edge.destination === destination
        );

        if (!exists) {
          const weight = Math.random() * 4 - 2;
          potential.push(new EdgeInfo(source, destination, weight, true));
        }
      }
    }

    if (potential.length > 0) {
      const selection = Math.floor(Math.random() * potential.length);
      const mutation = potential[selection];
      mutation.innovation = this.registerMarking(mutation);
      genotype.addEdge(
        mutation.source,
        mutation.destination,
        mutation.weight,
        mutation.enabled,
        mutation.innovation
      );
    }
  }

  mutateNode(genotype) {
    const selection = Math.floor(Math.random() * genotype.edges.length);
    const edge = genotype.edges[selection];

    if (!edge.enabled) return;

    edge.enabled = false;

    const vertex_new = genotype.vertices[genotype.vertices.length - 1].index + 1;
    genotype.addVertex(VertexType.HIDDEN, vertex_new);

    const first = new EdgeInfo(edge.source, vertex_new, 1.0, true);
    const second = new EdgeInfo(vertex_new, edge.destination, edge.weight, true);

    first.innovation = this.registerMarking(first);
    second.innovation = this.registerMarking(second);

    genotype.addEdge(
      first.source,
      first.destination,
      first.weight,
      first.enabled,
      first.innovation
    );

    genotype.addEdge(
      second.source,
      second.destination,
      second.weight,
      second.enabled,
      second.innovation
    );
  }

  mutateEnable(genotype) {
    const candidates = genotype.edges.filter(edge => !edge.enabled);
    if (candidates.length === 0) return;

    const selection = Math.floor(Math.random() * candidates.length);
    candidates[selection].enabled = true;
  }

  mutateDisable(genotype) {
    const candidates = genotype.edges.filter(edge => edge.enabled);
    if (candidates.length === 0) return;

    const selection = Math.floor(Math.random() * candidates.length);
    candidates[selection].enabled = false;
  }

  mutateWeight(genotype) {
    const selection = Math.floor(Math.random() * genotype.edges.length);
    const edge = genotype.edges[selection];

    if (Math.random() < this.PETRUB_CHANCE) {
      this.mutateWeightShift(edge, this.SHIFT_STEP);
    } else {
      this.mutateWeightRandom(edge);
    }
  }

  mutateWeightShift(edge, step) {
    const scalar = Math.random() * step - step * 0.5;
    edge.weight += scalar;
  }

  mutateWeightRandom(edge) {
    edge.weight = Math.random() * 4 - 2;
  }
}