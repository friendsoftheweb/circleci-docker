#! /usr/bin/env node

import chalk from 'chalk';

import getNodeVersion from './util/getNodeVersion';
import getPythonVersion from './util/getPythonVersion';
import getRubyVersion from './util/getRubyVersion';

import CompositeImage from './CompositeImage';

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
  nodeVersion,
  pythonVersion,
  rubyVersion
}).build();
