import path from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

import { IMAGE_NAME_PREFIX } from './constants';
import run from './util/run';
import DependencyImage from './DependencyImage';

export default class CompositeImage {
  readonly images: DependencyImage[];

  constructor(options: {
    nodeVersion?: string | null;
    pythonVersion?: string | null;
    rubyVersion?: string | null;
  }) {
    const images: DependencyImage[] = [];
    let index = 0;

    if (options.nodeVersion != null) {
      images.push(
        new DependencyImage({
          index: index++,
          name: 'node',
          tag: options.nodeVersion
        })
      );
    }

    if (options.pythonVersion != null) {
      images.push(
        new DependencyImage({
          index: index++,
          name: 'python',
          tag: options.pythonVersion
        })
      );
    }

    if (options.rubyVersion != null) {
      images.push(
        new DependencyImage({
          index: index++,
          name: 'ruby',
          tag: options.rubyVersion
        })
      );
    }

    this.images = images;
  }

  get imageName() {
    const parts: string[] = this.images.map((image) => image.name);

    return `${IMAGE_NAME_PREFIX}-${parts.join('-')}`;
  }

  get imageTag() {
    const parts: string[] = this.images.map((image) => image.tag);

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
      spinner.start(`Building ${image.name} image...`);

      try {
        await image.build();

        spinner.succeed(`Built ${image.name} image`);
      } catch (error) {
        spinner.fail();

        console.log(`\n${error.message}`);

        return;
      }
    }

    const imageName = `${IMAGE_NAME_PREFIX}-${this.images
      .map((image) => image.name)
      .join('-')}:${this.images.map((image) => image.tag).join('-')}`;

    const dockerBuildArgs = this.images
      .map((image) => image.dockerBuildArg)
      .join(' ');

    spinner.start(`Building composite image...`);

    try {
      await run(`docker build -t ${imageName} ${dockerBuildArgs} -`, {
        stdin: this.toDockerfileString()
      });

      await run(`docker push ${imageName}`);

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
}
