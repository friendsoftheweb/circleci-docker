import path from 'path';

import run from './util/run';

export default async function buildPythonImage(version: string) {
  const imageName = `friendsoftheweb/circleci-python:${version}`;

  const pythonDockerfileDirectoryPath = path.resolve(
    __dirname,
    './docker/python'
  );

  await run(
    `docker build -t ${imageName} --build-arg python_version=${version} ${pythonDockerfileDirectoryPath}`
  );

  await run(`docker push ${imageName}`);
}
