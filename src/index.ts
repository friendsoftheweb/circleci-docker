#! /usr/bin/env node

import path from 'path';
import { readFileSync } from 'fs';
import { exec } from 'child_process';
import chalk from 'chalk';

import getNodeVersion from './getNodeVersion';
import getPythonVersion from './getPythonVersion';
import getRubyVersion from './getRubyVersion';
import buildNodeImage from './buildNodeImage';
import buildPythonImage from './buildPythonImage';
import buildRubyImage from './buildRubyImage';

async function buildImage() {
  const imageNameParts: string[] = [];
  const imageTagParts: string[] = [];
  const dockerfileArgStatements: string[] = [];
  const dockerfileFromStatements: string[] = [];
  const dockerBuildArguments: string[] = [];

  const nodeVersion = getNodeVersion();

  if (nodeVersion != null) {
    imageNameParts.push('node');
    imageTagParts.push(nodeVersion);
    dockerfileArgStatements.push('ARG node_version');
    dockerfileFromStatements.push(
      'FROM friendsoftheweb/circleci-node:$node_version'
    );
    dockerBuildArguments.push(`--build-arg node_version=${nodeVersion}`);

    await buildNodeImage(nodeVersion);
  }

  const pythonVersion = getPythonVersion();

  if (pythonVersion != null) {
    imageNameParts.push('python');
    imageTagParts.push(pythonVersion);
    dockerfileArgStatements.push(`ARG python_version`);
    dockerfileFromStatements.push(
      'FROM friendsoftheweb/circleci-python:$python_version'
    );
    dockerBuildArguments.push(`--build-arg python_version=${pythonVersion}`);

    await buildPythonImage(pythonVersion);
  }

  const rubyVersion = getRubyVersion();

  if (rubyVersion != null) {
    imageNameParts.push('ruby');
    imageTagParts.push(rubyVersion);
    dockerfileArgStatements.push(`ARG ruby_version`);
    dockerfileFromStatements.push(
      'FROM friendsoftheweb/circleci-ruby:$ruby_version'
    );
    dockerBuildArguments.push(`--build-arg ruby_version=${rubyVersion}`);

    await buildRubyImage(rubyVersion);
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

  return new Promise((resolve, reject) => {
    const dockerBuild = exec(
      `docker build -t ${imageName} ${dockerBuildArguments.join(' ')} -`,
      (error) => {
        if (error != null) {
          reject(error);
        } else {
          resolve();
        }
      }
    );

    dockerBuild.stdout?.pipe(process.stdout);

    dockerBuild.stdin?.write(dockerFileContent);
    dockerBuild.stdin?.end();
  });
}

console.log(`Ruby Version: ${chalk.cyan(getRubyVersion())}`);
console.log(`Node Version: ${chalk.cyan(getNodeVersion())}`);
console.log(`Python Version: ${chalk.cyan(getPythonVersion())}`);

buildImage();
