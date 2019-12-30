import path from 'path';

import { IMAGE_NAME_PREFIX, IMAGE_BIN_PATHS } from './constants';
import run from './util/run';

export default class DependencyImage {
  readonly index: number;
  readonly name: string;
  readonly tag: string;

  constructor(options: { index: number; name: string; tag: string }) {
    if (/[^a-z]/.test(options.name)) {
      throw new Error(`Invalid dependency image name: ${options.name}`);
    }

    if (/[^\d\.]/.test(options.tag)) {
      throw new Error(`Invalid dependency image tag: ${options.tag}`);
    }

    this.index = options.index;
    this.name = options.name;
    this.tag = options.tag;
  }

  get dockerfileFromStatement() {
    return `FROM ${IMAGE_NAME_PREFIX}-${this.name}:${this.tag}`;
  }

  get dockerfileCopyStatements() {
    return IMAGE_BIN_PATHS.map(
      (binPath) => `COPY --from=${this.index} ${binPath} ${binPath}`
    ).join('\n');
  }

  get dockerBuildArg() {
    return `--build-arg ${this.name}_version=${this.tag}`;
  }

  async build() {
    const imageName = `${IMAGE_NAME_PREFIX}-${this.name}:${this.tag}`;

    const dockerfileDirectoryPath = path.resolve(
      __dirname,
      `./docker/${this.name}`
    );

    await run(
      `docker build -t ${imageName} ${this.dockerBuildArg} ${dockerfileDirectoryPath}`
    );

    await run(`docker push ${imageName}`);
  }
}
