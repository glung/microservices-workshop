#!/usr/bin/env node

import { Command } from 'commander';
import { TrafficSimulator } from './simulator';
import { LoadLevel } from './types';

const program = new Command();

program
  .name('traffic-simulator')
  .description('Traffic simulator for Course Platform API using Apache Bench')
  .version('1.0.0')
  .option('-l, --load <level>', 'Load level: low or high', 'low')
  .option('-u, --url <url>', 'Base URL of the API', 'http://localhost:3000')
  .parse(process.argv);

const options = program.opts();

// Validate load level
const loadLevel = options.load as LoadLevel;
if (loadLevel !== 'low' && loadLevel !== 'high') {
  console.error(`Error: Invalid load level "${loadLevel}". Must be "low" or "high".`);
  process.exit(1);
}

// Run simulator
async function main(): Promise<void> {
  try {
    const simulator = new TrafficSimulator(options.url, loadLevel);
    const result = await simulator.run();

    // Display results
    console.log('\nRunning Apache Bench processes...');
    for (const abResult of result.results) {
      const successRate = (abResult.successfulRequests / abResult.totalRequests * 100).toFixed(1);
      console.log(
        `✓ ${abResult.endpoint}: ${abResult.successfulRequests} req in ${abResult.duration.toFixed(1)}s ` +
        `(${abResult.requestsPerSecond.toFixed(0)} req/s, ${successRate}% success)`
      );
    }

    console.log('\nResults Summary');
    console.log('===============');
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Total Duration: ${result.totalDuration.toFixed(1)}s`);
    console.log(`Average RPS: ${result.averageRPS.toFixed(0)} req/s`);
    console.log(`Success Rate: ${result.successRate.toFixed(1)}%`);
    console.log('\nCheck Grafana: http://localhost:3001');

  } catch (err) {
    if (err instanceof Error) {
      console.error(`\nError: ${err.message}`);
    } else {
      console.error('\nUnknown error occurred');
    }
    process.exit(1);
  }
}

main();
