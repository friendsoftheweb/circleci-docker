#! /usr/bin/env node

import path from "path";
import fs, { readFileSync } from "fs";
import { exec, execSync } from "child_process";

const rubyVersionFilePath = path.resolve(process.cwd(), ".ruby-version");
const nodeVersionFilePath = path.resolve(process.cwd(), ".nvmrc");
const pythonVersionFilePath = path.resolve(process.cwd(), "runtime.txt");

function getRubyVersion(): string | null {
  if (!fs.existsSync(rubyVersionFilePath)) {
    return null;
  }

  const version = fs
    .readFileSync(rubyVersionFilePath)
    .toString()
    .replace(/\s+/g, "");

  if (/[^\d\.]/.test(version)) {
    throw new Error(`Invalid Ruby version: "${version}"`);
  }

  return version;
}

function getNodeVersion(): string | null {
  if (!fs.existsSync(nodeVersionFilePath)) {
    return null;
  }

  const version = fs
    .readFileSync(nodeVersionFilePath)
    .toString()
    .replace(/\s+/g, "");

  if (/[^\d\.]/.test(version)) {
    throw new Error(`Invalid Node version: "${version}"`);
  }

  return version;
}

function getPythonVersion(): string | null {
  if (!fs.existsSync(pythonVersionFilePath)) {
    return null;
  }

  const version = fs
    .readFileSync(pythonVersionFilePath)
    .toString()
    .replace(/^python-/, "")
    .replace(/\s+/g, "");

  if (/[^\d\.]/.test(version)) {
    throw new Error(`Invalid Python version: "${version}"`);
  }

  return version;
}

function buildRubyImage() {
  const version = getRubyVersion();

  if (version == null) {
    return;
  }

  const imageName = `friendsoftheweb/circleci-ruby:${version}`;

  console.log(`Building ${imageName}...\n`);

  const rubyDockerfileDirectoryPath = path.resolve(__dirname, "./docker/ruby");

  execSync(
    `docker build -t ${imageName} --build-arg ruby_version=${version} ${rubyDockerfileDirectoryPath}`,
    { stdio: "inherit" }
  );

  execSync(`docker push ${imageName}`, { stdio: "inherit" });
}

function buildNodeImage() {
  const version = getNodeVersion();

  if (version == null) {
    return;
  }

  const imageName = `friendsoftheweb/circleci-node:${version}`;

  console.log(`Building ${imageName}...\n`);

  const nodeDockerfileDirectoryPath = path.resolve(__dirname, "./docker/node");

  execSync(
    `docker build -t ${imageName} --build-arg node_version=${version} ${nodeDockerfileDirectoryPath}`,
    { stdio: "inherit" }
  );

  execSync(`docker push ${imageName}`, { stdio: "inherit" });
}

function buildPythonImage() {
  const version = getPythonVersion();

  if (version == null) {
    return;
  }

  const imageName = `friendsoftheweb/circleci-python:${version}`;

  console.log(`Building ${imageName}...\n`);

  const pythonDockerfileDirectoryPath = path.resolve(
    __dirname,
    "./docker/python"
  );

  execSync(
    `docker build -t ${imageName} --build-arg python_version=${version} ${pythonDockerfileDirectoryPath}`,
    { stdio: "inherit" }
  );

  execSync(`docker push ${imageName}`, { stdio: "inherit" });
}

function buildImage() {
  const imageNameParts: string[] = [];
  const imageTagParts: string[] = [];
  const dockerfileArgStatements: string[] = [];
  const dockerfileFromStatements: string[] = [];
  const dockerBuildArguments: string[] = [];

  const nodeVersion = getNodeVersion();

  if (nodeVersion != null) {
    imageNameParts.push("node");
    imageTagParts.push(nodeVersion);
    dockerfileArgStatements.push("ARG node_version");
    dockerfileFromStatements.push(
      "FROM friendsoftheweb/circleci-node:$node_version"
    );
    dockerBuildArguments.push(`--build-arg node_version=${nodeVersion}`);
  }

  const pythonVersion = getPythonVersion();

  if (pythonVersion != null) {
    imageNameParts.push("python");
    imageTagParts.push(pythonVersion);
    dockerfileArgStatements.push(`ARG python_version`);
    dockerfileFromStatements.push(
      "FROM friendsoftheweb/circleci-python:$python_version"
    );
    dockerBuildArguments.push(`--build-arg python_version=${pythonVersion}`);
  }

  const rubyVersion = getRubyVersion();

  if (rubyVersion != null) {
    imageNameParts.push("ruby");
    imageTagParts.push(rubyVersion);
    dockerfileArgStatements.push(`ARG ruby_version`);
    dockerfileFromStatements.push(
      "FROM friendsoftheweb/circleci-ruby:$ruby_version"
    );
    dockerBuildArguments.push(`--build-arg ruby_version=${rubyVersion}`);
  }

  const imageName = `circleci-${imageNameParts.join("-")}:${imageTagParts.join(
    "-"
  )}`;

  const dockerfilePath = path.resolve(__dirname, "./docker/Dockerfile");

  let dockerFileContent = `${dockerfileArgStatements.join(
    "\n\n"
  )}\n${dockerfileFromStatements.join("\n")}\n\n${readFileSync(
    dockerfilePath
  )}`;

  return new Promise((resolve, reject) => {
    const dockerBuild = exec(
      `docker build -t ${imageName} ${dockerBuildArguments.join(" ")} -`,
      error => {
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

console.log(`Ruby Version: ${getRubyVersion()}`);
console.log(`Node Version: ${getNodeVersion()}`);
console.log(`Python Version: ${getPythonVersion()}`);

buildNodeImage();
buildRubyImage();
buildPythonImage();

buildImage();
