import { Genotype, VertexType } from './Genotype.js';
import { Phenotype } from './Phenotype.js';
import { Mutation } from './Mutation.js';

export class NetworkFactory {
  static instance = null;

  static initialize() {
    if (!NetworkFactory.instance) {
      NetworkFactory.instance = new NetworkFactory();
    }
    return NetworkFactory.instance;
  }

  createBaseGenotype(inputs, outputs) {
    const network = new Genotype();

    for (let i = 0; i < inputs; i++) {
      network.addVertex(VertexType.INPUT, i);
    }

    for (let i = 0; i < outputs; i++) {
      network.addVertex(VertexType.OUTPUT, i + inputs);
    }

    network.addEdge(0, inputs, 0, true, 0);

    return network;
  }

  createEmptyGenotype() {
    return new Genotype();
  }

  registerBaseMarkings(inputs, outputs) {
    for (let i = 0; i < inputs; i++) {
      for (let j = 0; j < outputs; j++) {
        const input = i;
        const output = j + inputs;
        const info = { source: input, destination: output, weight: 0, enabled: true };
        Mutation.instance.registerMarking(info);
      }
    }
  }
}