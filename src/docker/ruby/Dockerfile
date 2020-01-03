FROM buildpack-deps:buster

# TODO: Prune dependencies. Not all of these are needed.
RUN apt-get update && apt-get install -y \
    bzip2 \
    ca-certificates \
    curl \
    git \
    gnupg \
    gzip \
    jq \
    locales \
    make \
    mercurial \
    netcat \
    net-tools \
    openssh-client \
    parallel \
    sudo \
    tar \
    unzip \
    wget \
    xvfb \
    zip

ARG ruby_version

ENV RUBY_VERSION $ruby_version

RUN wget -O ruby-install-0.7.0.tar.gz https://github.com/postmodern/ruby-install/archive/v0.7.0.tar.gz \
    && tar -xzvf ruby-install-0.7.0.tar.gz \
    && cd ruby-install-0.7.0/ \
    && make install \
    && ruby-install --system ruby $RUBY_VERSION \
    && rm -rf /ruby-install-0.7.0 /ruby-install-0.7.0.tar.gz

RUN gem install bundler --version '~> 1.17'

RUN gem install bundler --version '~> 2.1'
