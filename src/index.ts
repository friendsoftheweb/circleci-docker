#! /usr/bin/env node

import chalk from 'chalk';
import program from 'commander';

import getPackageVersion from './util/getPackageVersion';
import getNodeVersion from './util/getNodeVersion';
import getPythonVersion from './util/getPythonVersion';
import getRubyVersion from './util/getRubyVersion';

import CompositeImage from './CompositeImage';

program.version(require('../package.json')['version']);

program
  .command('build')
  .description('creates a new composite Docker image')
  .option('--verbose', 'display output from Docker build process', false)
  .option('-o, --org <organization>', 'the Docker organization to upload to')
  .action((options: { verbose: boolean; org: string }) => {
    const version = getPackageVersion();
    const nodeVersion = getNodeVersion();
    const pythonVersion = getPythonVersion();
    const rubyVersion = getRubyVersion();

    console.log('Using the following versions:\n');

    if (nodeVersion != null) {
      console.log(`Node:\t${chalk.cyan(nodeVersion)}`);
    }

    if (pythonVersion != null) {
      console.log(`Python:\t${chalk.cyan(pythonVersion)}`);
    }

    if (rubyVersion != null) {
      console.log(`Ruby:\t${chalk.cyan(rubyVersion)}`);
    }

    console.log('\nBuilding the Docker images could take up to 30 minutes.\n');

    new CompositeImage({
      version,
      nodeVersion,
      pythonVersion,
      rubyVersion,
      verbose: options.verbose,
      organization: options.org
    }).build();
  });

program.parse(process.argv);
