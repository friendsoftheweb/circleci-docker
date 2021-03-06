# CircleCI Docker

This package will create a Docker image for CircleCI with specific versions of Ruby, Node, and Python. Every image will also include the latest versions of Chrome and Firefox (as well as chromedriver and geckodriver).

## Installation

This package should be installed as a dependency of the project that the image is being generated for because the version of the package is included in the tag of the image that's generated.

```
$ yarn add --dev @ftw/circleci-docker
```

## Generating an Image

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop) is installed and running first.

```
$ yarn run circleci-docker build friendsoftheweb
```

This will automatically detect the required versions of Ruby, Node, and Python (from `.ruby-version`, `.nvmrc`, and `runtime.txt` files) and start building Docker images.

To see all the output from the Docker build process, run the `build` command with the `--verbose` flag:

```
$ yarn run circleci-docker build --verbose friendsoftheweb
```

If you encounter issues during the build process, try running it again with the `--noCache` flag:

```
$ yarn run circleci-docker build --noCache friendsoftheweb
```

Because Docker caches layers based on the content of the command that created them, some commands (such as `apt-get update`) won't be run again if a cached layer exists. Building with the `--noCache` flag will cause Docker to ignore any previously cached build layers and start from scratch, ensuring that the latest version of each dependency is installed.

## Updating the CircleCI Configuration

Once the Docker image has been generated, you'll need to update the CircleCI configuration for the project. Here's an example of the build configuration for a project that needs Ruby, Node, Python, and PostgreSQL (not included in the generated image):

```yaml
version: 2

jobs:
  build:
    parallelism: 1
    docker:
      - image: friendsoftheweb/circleci-node-python-ruby:0.0.1-10.16.0-2.7.17-2.6.5
        environment:
          PGHOST: 127.0.0.1
          PGUSER: user
          NODE_ENV: test
          RAILS_ENV: test
          RACK_ENV: test
      - image: circleci/postgres:9.6
        environment:
          POSTGRES_DB: circle_ruby_test
          POSTGRES_PASSWORD: ''
          POSTGRES_USER: ubuntu
```
