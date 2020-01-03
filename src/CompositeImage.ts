import path from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

import { IMAGE_NAME_PREFIX } from './constants';
import run from './util/run';
import DependencyImage from './DependencyImage';

interface Options {
  version: string;
  nodeVersion?: string | null;
  pythonVersion?: string | null;
  rubyVersion?: string | null;
  verbose?: boolean;
}

export default class CompositeImage {
  readonly version: string;
  readonly verbose: boolean;
  readonly images: DependencyImage[];

  constructor(options: Options) {
    const images: DependencyImage[] = [];
    let index = 0;

    if (options.nodeVersion != null) {
      images.push(
        new DependencyImage({
          index: index++,
          name: 'node',
          version: options.nodeVersion,
          verbose: options.verbose
        })
      );
    }

    if (options.pythonVersion != null) {
      images.push(
        new DependencyImage({
          index: index++,
          name: 'python',
          version: options.pythonVersion,
          verbose: options.verbose
        })
      );
    }

    if (options.rubyVersion != null) {
      images.push(
        new DependencyImage({
          index: index++,
          name: 'ruby',
          version: options.rubyVersion,
          verbose: options.verbose
        })
      );
    }

    this.version = options.version;
    this.verbose = Boolean(options.verbose);
    this.images = images;
  }

  get name() {
    const parts: string[] = this.images.map((image) => image.name);

    return `${IMAGE_NAME_PREFIX}-${parts.join('-')}`;
  }

  get tag() {
    const parts: string[] = [
      this.version,
      ...this.images.map((image) => image.version)
    ];

    return parts.join('-');
  }

  toDockerfileString(): string {
    const dockerfilePath = path.resolve(__dirname, './docker/Dockerfile');

    let content = '';

    content += this.images
      .map((image) => image.dockerfileFromStatement)
      .join('\n');

    content += '\n\n';

    content += this.images
      // Don't add COPY statements for the last image in the images array
      // because Docker already keeps the artifacts for the last image.
      .slice(0, this.images.length - 1)
      .map((image) => image.dockerfileCopyStatements)
      .join('\n');

    content += '\n\n';
    content += readFileSync(dockerfilePath);

    return content;
  }

  async build() {
    const spinner = ora();

    for (const image of this.images) {
      if (!this.verbose) {
        spinner.start(`Building ${image.name} image...`);
      }

      try {
        await image.build();

        if (!this.verbose) {
          spinner.succeed(`Built ${image.name} image`);
        }
      } catch (error) {
        if (!this.verbose) {
          spinner.fail();
        }

        console.log(`\n${error.message}`);

        return;
      }
    }

    const imageNameAndTag = `${this.name}:${this.tag}`;

    const dockerBuildArgs = this.images
      .map((image) => image.dockerBuildArg)
      .join(' ');

    if (!this.verbose) {
      spinner.start(`Building composite image...`);
    }

    try {
      await run(`docker build -t ${imageNameAndTag} ${dockerBuildArgs} -`, {
        stdin: this.toDockerfileString(),
        verbose: this.verbose
      });

      await run(`docker push ${imageNameAndTag}`, { verbose: this.verbose });

      if (!this.verbose) {
        spinner.succeed('Built composite image');
      }
    } catch (error) {
      if (!this.verbose) {
        spinner.fail();
      }

      console.log(`\n${error.message}`);

      return;
    }

    console.log(
      `\nPlease update your project's CircleCI configuration to use ${chalk.cyan(
        imageNameAndTag
      )}\n`
    );
  }
}
