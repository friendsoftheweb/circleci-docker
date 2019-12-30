import path from 'path';

import run from './util/run';

export default async function buildRubyImage(version: string) {
  const imageName = `friendsoftheweb/circleci-ruby:${version}`;

  const rubyDockerfileDirectoryPath = path.resolve(__dirname, './docker/ruby');

  await run(
    `docker build -t ${imageName} --build-arg ruby_version=${version} ${rubyDockerfileDirectoryPath}`
  );

  await run(`docker push ${imageName}`);
}
