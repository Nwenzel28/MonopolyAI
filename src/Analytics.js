export class Analytics {
  static instance = null;

  constructor() {
    this.bids = new Array(40).fill(0);
    this.money = new Array(40).fill(0);
    this.average = new Array(40).fill(0);
    this.price = new Array(40).fill(0);

    this.trades = new Array(40).fill(0);
    this.exchanges = new Array(40).fill(0);

    this.wins = new Array(40).fill(0);
    this.max = 0;
    this.min = 0;
    this.ratio = new Array(40).fill(0);
  }

  static initialize() {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  makeBid(index, bid) {
    this.bids[index]++;
    this.money[index] += bid;
    this.average[index] = this.money[index] / this.bids[index];
    this.price[index] = this.average[index] / Board.COSTS[index];
  }

  madeTrade(index) {
    this.trades[index]++;
  }

  markWin(index) {
    this.wins[index]++;

    if (this.max < this.wins[index]) {
      this.max = this.wins[index];
    }

    let tempMin = Infinity;
    for (let i = 0; i < 40; i++) {
      if (this.wins[i] !== 0 && this.wins[i] < tempMin) {
        tempMin = this.wins[i];
      }
    }

    this.min = tempMin;
    this.ratio[index] = (this.wins[index] - tempMin) / (this.max - tempMin);
  }
}