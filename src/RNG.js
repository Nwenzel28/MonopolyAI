export class RNG {
  static instance = null;

  constructor() {
    this.gen = Math;
  }

  static initialize() {
    if (!RNG.instance) {
      RNG.instance = new RNG();
    }
    return RNG.instance;
  }

  shuffle(array) {
    if (!Array.isArray(array)) {
      return array;
    }

    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.gen.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  doubleShuffle(phen, gene, op, og) {
    const indices = Array.from({ length: phen.length }, (_, i) => i);
    const shuffledIndices = this.shuffle(indices);

    for (const i of shuffledIndices) {
      op.push(phen[i]);
      og.push(gene[i]);
    }

    phen.length = 0;
    gene.length = 0;
  }
}