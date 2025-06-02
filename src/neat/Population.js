import { NetworkFactory } from './NetworkFactory.js';
import { Mutation } from './Mutation.js';
import { Crossover } from './Crossover.js';
import { Phenotype } from './Phenotype.js';

class Species {
  constructor() {
    this.members = [];
    this.topFitness = 0;
    this.staleness = 0;
    this.fitnessSum = 0;
  }

  breed() {
    if (Math.random() < Crossover.instance.CROSSOVER_CHANCE && this.members.length > 1) {
      const s1 = Math.floor(Math.random() * this.members.length);
      let s2 = Math.floor(Math.random() * (this.members.length - 1));
      if (s2 >= s1) s2++;

      const child = Crossover.instance.produceOffspring(this.members[s1], this.members[s2]);
      Mutation.instance.mutateAll(child);
      return child;
    } else {
      const selection = Math.floor(Math.random() * this.members.length);
      const child = this.members[selection].clone();
      Mutation.instance.mutateAll(child);
      return child;
    }
  }

  sortMembers() {
    this.members.sort((a, b) => b.adjustedFitness - a.adjustedFitness);
  }

  cullToPortion(portion) {
    if (this.members.length <= 1) return;
    const remaining = Math.ceil(this.members.length * portion);
    this.members.splice(remaining);
  }

  cullToOne() {
    if (this.members.length <= 1) return;
    this.members.splice(1);
  }

  calculateAdjustedFitnessSum() {
    this.fitnessSum = this.members.reduce((sum, member) => sum + member.adjustedFitness, 0);
  }

  addMember(genotype) {
    this.members.push(genotype);
  }
}

export class Population {
  static instance = null;

  constructor() {
    this.GENERATION = 0;
    this.POPULATION_SIZE = 256;
    this.INPUTS = 126;
    this.OUTPUTS = 7;
    this.MAX_STALENESS = 15;
    this.PORTION = 0.2;

    this.species = [];
    this.genetics = [];
    this.population = [];
  }

  static initialize() {
    if (!Population.instance) {
      Population.instance = new Population();
    }
    return Population.instance;
  }

  generateBasePopulation(size, inputs, outputs) {
    this.POPULATION_SIZE = size;
    this.INPUTS = inputs;
    this.OUTPUTS = outputs;

    for (let i = 0; i < this.POPULATION_SIZE; i++) {
      const genotype = NetworkFactory.instance.createBaseGenotype(inputs, outputs);
      this.genetics.push(genotype);
      this.addToSpecies(genotype);
    }

    NetworkFactory.instance.registerBaseMarkings(inputs, outputs);

    for (const genotype of this.genetics) {
      Mutation.instance.mutateAll(genotype);
    }

    this.inscribePopulation();
  }

  newGeneration() {
    this.calculateAdjustedFitness();

    for (let i = this.species.length - 1; i >= 0; i--) {
      this.species[i].sortMembers();
      this.species[i].cullToPortion(this.PORTION);

      if (this.species[i].members.length <= 1) {
        this.species.splice(i, 1);
      }
    }

    this.updateStaleness();

    const totalFitnessSum = this.species.reduce((sum, s) => {
      s.calculateAdjustedFitnessSum();
      return sum + s.fitnessSum;
    }, 0);

    const children = [];

    for (const species of this.species) {
      const build = Math.floor(this.POPULATION_SIZE * (species.fitnessSum / totalFitnessSum)) - 1;
      for (let j = 0; j < build; j++) {
        children.push(species.breed());
      }
    }

    while (this.POPULATION_SIZE > this.species.length + children.length) {
      const species = this.species[Math.floor(Math.random() * this.species.length)];
      children.push(species.breed());
    }

    for (const species of this.species) {
      species.cullToOne();
    }

    for (const child of children) {
      this.addToSpecies(child);
    }

    this.genetics = [];
    for (const species of this.species) {
      this.genetics.push(...species.members);
    }

    this.inscribePopulation();
    this.GENERATION++;
  }

  calculateAdjustedFitness() {
    for (const species of this.species) {
      for (const member of species.members) {
        member.adjustedFitness = member.fitness / species.members.length;
      }
    }
  }

  updateStaleness() {
    if (this.species.length <= 1) return;

    for (let i = this.species.length - 1; i >= 0; i--) {
      const species = this.species[i];
      const top = species.members[0].fitness;

      if (species.topFitness < top) {
        species.topFitness = top;
        species.staleness = 0;
      } else {
        species.staleness++;
      }

      if (species.staleness >= this.MAX_STALENESS) {
        this.species.splice(i, 1);
      }
    }
  }

  inscribePopulation() {
    this.population = [];

    for (const genotype of this.genetics) {
      genotype.fitness = 0;
      genotype.adjustedFitness = 0;

      const physical = new Phenotype();
      physical.inscribeGenotype(genotype);
      physical.processGraph();

      this.population.push(physical);
    }
  }

  addToSpecies(genotype) {
    if (this.species.length === 0) {
      const newSpecies = new Species();
      newSpecies.addMember(genotype);
      this.species.push(newSpecies);
      return;
    }

    for (const species of this.species) {
      const distance = Crossover.instance.speciationDistance(species.members[0], genotype);
      if (distance < Crossover.instance.DISTANCE) {
        species.addMember(genotype);
        return;
      }
    }

    const newSpecies = new Species();
    newSpecies.addMember(genotype);
    this.species.push(newSpecies);
  }

  addSpecies() {
    const species = new Species();
    this.species.push(species);
    return species;
  }
}