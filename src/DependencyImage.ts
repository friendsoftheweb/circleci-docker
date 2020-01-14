import path from 'path';

import { IMAGE_BIN_PATHS } from './constants';
import getPackageVersion from './util/getPackageVersion';
import run from './util/run';

interface Options {
  index: number;
  name: string;
  version: string;
  verbose?: boolean;
  organization: string;
}

export default class DependencyImage {
  readonly index: number;
  readonly name: string;
  readonly version: string;
  readonly verbose: boolean;
  readonly organization: string;

  constructor(options: Options) {
    if (/[^a-z]/.test(options.name)) {
      throw new Error(`Invalid dependency image name: ${options.name}`);
    }

    if (/[^\d\.]/.test(options.version)) {
      throw new Error(`Invalid dependency image version: ${options.version}`);
    }

    this.index = options.index;
    this.name = options.name;
    this.version = options.version;
    this.verbose = Boolean(options.verbose);
    this.organization = options.organization;
  }

  get tag() {
    return `${getPackageVersion()}-${this.version}`;
  }

  get dockerfileFromStatement() {
    return `FROM ${this.organization}/circleci-${this.name}:${this.tag}`;
  }

  get dockerfileCopyStatements() {
    return IMAGE_BIN_PATHS.map(
      (binPath) => `COPY --from=${this.index} ${binPath} ${binPath}`
    ).join('\n');
  }

  get dockerBuildArg() {
    return `--build-arg ${this.name}_version=${this.version}`;
  }

  async build() {
    const imageName = `${this.organization}/circleci-${this.name}:${this.tag}`;

    const dockerfileDirectoryPath = path.resolve(
      __dirname,
      `./docker/${this.name}`
    );

    await run(
      `docker build -t ${imageName} ${this.dockerBuildArg} ${dockerfileDirectoryPath}`,
      { verbose: this.verbose }
    );

    await run(`docker push ${imageName}`, { verbose: this.verbose });
  }
}
