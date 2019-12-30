import path from 'path';

import run from './util/run';

export default async function buildNodeImage(version: string) {
  const imageName = `friendsoftheweb/circleci-node:${version}`;
  const dockerfileDirectoryPath = path.resolve(__dirname, './docker/node');

  await run(
    `docker build -t ${imageName} --build-arg node_version=${version} ${dockerfileDirectoryPath}`
  );

  await run(`docker push ${imageName}`);
}
