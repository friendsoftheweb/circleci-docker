#! /usr/bin/env node

import path from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

import run from './util/run';
import getNodeVersion from './getNodeVersion';
import getPythonVersion from './getPythonVersion';
import getRubyVersion from './getRubyVersion';
import buildNodeImage from './buildNodeImage';
import buildPythonImage from './buildPythonImage';
import buildRubyImage from './buildRubyImage';

async function buildImage() {
  const spinner = ora();

  const imageNameParts: string[] = [];
  const imageTagParts: string[] = [];
  const dockerfileArgStatements: string[] = [];
  const dockerfileFromStatements: string[] = [];
  const dockerBuildArguments: string[] = [];

  const nodeVersion = getNodeVersion();
  const pythonVersion = getPythonVersion();
  const rubyVersion = getRubyVersion();

  console.log('Detected the following versions:\n');

  if (nodeVersion != null) {
    console.log(`Node: ${chalk.cyan(nodeVersion)}`);
  }

  if (pythonVersion != null) {
    console.log(`Python: ${chalk.cyan(pythonVersion)}`);
  }

  if (rubyVersion != null) {
    console.log(`Ruby: ${chalk.cyan(rubyVersion)}`);
  }

  console.log('\nBuilding the Docker images could take up to 30 minutes.\n');

  if (nodeVersion != null) {
    imageNameParts.push('node');
    imageTagParts.push(nodeVersion);
    dockerfileArgStatements.push('ARG node_version');
    dockerfileFromStatements.push(
      'FROM friendsoftheweb/circleci-node:$node_version'
    );
    dockerBuildArguments.push(`--build-arg node_version=${nodeVersion}`);

    spinner.start('Building Node image...');

    try {
      await buildNodeImage(nodeVersion);

      spinner.succeed('Built Node image');
    } catch (error) {
      spinner.fail();

      console.log(`\n${error.message}`);

      return;
    }
  }

  if (pythonVersion != null) {
    imageNameParts.push('python');
    imageTagParts.push(pythonVersion);
    dockerfileArgStatements.push(`ARG python_version`);
    dockerfileFromStatements.push(
      'FROM friendsoftheweb/circleci-python:$python_version'
    );
    dockerBuildArguments.push(`--build-arg python_version=${pythonVersion}`);

    spinner.start('Building Python image...');

    try {
      await buildPythonImage(pythonVersion);

      spinner.succeed('Built Python image');
    } catch (error) {
      spinner.fail();

      console.log(`\n${error.message}`);

      return;
    }
  }

  if (rubyVersion != null) {
    imageNameParts.push('ruby');
    imageTagParts.push(rubyVersion);
    dockerfileArgStatements.push(`ARG ruby_version`);
    dockerfileFromStatements.push(
      'FROM friendsoftheweb/circleci-ruby:$ruby_version'
    );
    dockerBuildArguments.push(`--build-arg ruby_version=${rubyVersion}`);

    spinner.start('Building Ruby image...');

    try {
      await buildRubyImage(rubyVersion);

      spinner.succeed('Built Ruby image');
    } catch (error) {
      spinner.fail();

      console.log(`\n${error.message}`);

      return;
    }
  }

  const imageName = `circleci-${imageNameParts.join('-')}:${imageTagParts.join(
    '-'
  )}`;

  const dockerfilePath = path.resolve(__dirname, './docker/Dockerfile');

  let dockerFileContent = `${dockerfileArgStatements.join(
    '\n\n'
  )}\n${dockerfileFromStatements.join('\n')}\n\n${readFileSync(
    dockerfilePath
  )}`;

  spinner.start('Building composite image...');

  try {
    await run(
      `docker build -t ${imageName} ${dockerBuildArguments.join(' ')} -`,
      { stdin: dockerFileContent }
    );

    spinner.succeed('Built composite image');
  } catch (error) {
    spinner.fail();

    console.log(`\n${error.message}`);

    return;
  }

  console.log(
    `\nPlease update your project's CircleCI configuration to use ${chalk.cyan(
      imageName
    )}\n`
  );
}

buildImage();
