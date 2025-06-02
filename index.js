import { Analytics } from './src/Analytics.js';
import { RNG } from './src/RNG.js';
import { Tournament } from './src/Tournament.js';
import { NetworkFactory, Mutation, Crossover, Population } from './src/neat/index.js';
import fs from 'node:fs';

const POPULATION_FILE = 'monopoly_population.txt';

// Initialize core components
Analytics.initialize();
RNG.initialize();
NetworkFactory.initialize();
Mutation.initialize();
Crossover.initialize();
Population.initialize();

const tournament = new Tournament();

// Load or initialize tournament state
if (fs.existsSync(POPULATION_FILE)) {
  loadState(POPULATION_FILE, tournament);
} else {
  tournament.initialize();
}

// Run training iterations
const ITERATIONS = 1000;
for (let i = 0; i < ITERATIONS; i++) {
  console.log(`Training iteration ${i + 1}/${ITERATIONS}`);
  tournament.executeTournament();
  Population.instance.newGeneration();
  saveState(POPULATION_FILE, tournament);
}

function saveState(target, tournament) {
  console.log("SAVING POPULATION");
  
  let build = [];
  build.push(Population.instance.generation);
  build.push(tournament.championScore);
  
  // Save markings
  const markings = Mutation.instance.historical.map(mark => 
    `${mark.order},${mark.source},${mark.destination}`
  ).join(',');
  
  build.push(markings);

  // Save species and networks
  const networks = Population.instance.species.map(species => {
    const speciesData = `${species.topFitness},${species.staleness}`;
    const membersData = species.members.map(member => {
      const vertices = member.vertices.map(v => 
        `${v.index},${v.type}`
      ).join(',');
      
      const edges = member.edges.map(e =>
        `${e.source},${e.destination},${e.weight},${e.enabled},${e.innovation}`
      ).join(',');

      return `${vertices}#${edges}`;
    }).join('n');

    return `${speciesData}&${membersData}`;
  }).join('&');

  build.push(networks);

  fs.writeFileSync(target, build.join(';'));
}

function loadState(location, tournament) {
  const data = fs.readFileSync(location, 'utf8');
  const parts = data.split(';');
  
  Population.instance.generation = parseInt(parts[0]);
  tournament.championScore = parseFloat(parts[1]);

  // Load markings
  const markings = parts[2].split(',');
  for (let i = 0; i < markings.length; i += 3) {
    Mutation.instance.historical.push({
      order: parseInt(markings[i]),
      source: parseInt(markings[i + 1]),
      destination: parseInt(markings[i + 2])
    });
  }

  // Load species and networks
  const speciesParts = parts[3].split('&');
  for (let x = 0; x < speciesParts.length; x += 2) {
    const [topFitness, staleness] = speciesParts[x].split(',').map(Number);
    const species = Population.instance.addSpecies();
    species.topFitness = topFitness;
    species.staleness = staleness;

    const networks = speciesParts[x + 1].split('n');
    for (const network of networks) {
      const [vertsPart, edgesPart] = network.split('#');
      const genotype = NetworkFactory.instance.createEmptyGenotype();

      // Add vertices
      const verts = vertsPart.split(',');
      for (let i = 0; i < verts.length - 1; i += 2) {
        genotype.addVertex(parseInt(verts[i]), parseInt(verts[i + 1]));
      }

      // Add edges
      const edges = edgesPart.split(',');
      for (let i = 0; i < edges.length - 1; i += 5) {
        genotype.addEdge(
          parseInt(edges[i]),
          parseInt(edges[i + 1]),
          parseFloat(edges[i + 2]),
          edges[i + 3] === 'true',
          parseInt(edges[i + 4])
        );
      }

      species.addMember(genotype);
      Population.instance.genetics.push(genotype);
    }
  }

  Population.instance.inscribePopulation();
}