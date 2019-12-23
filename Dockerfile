FROM buildpack-deps:buster

# Make Apt non-interactive
RUN echo 'APT::Get::Assume-Yes "true";' > /etc/apt/apt.conf.d/90circleci \
    && echo 'DPkg::Options "--force-confnew";' >> /etc/apt/apt.conf.d/90circleci

ENV DEBIAN_FRONTEND=noninteractive

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

# Install Ruby
ARG ruby_version

ENV RUBY_VERSION $ruby_version

RUN wget -O ruby-install-0.7.0.tar.gz https://github.com/postmodern/ruby-install/archive/v0.7.0.tar.gz \
    && tar -xzvf ruby-install-0.7.0.tar.gz \
    && cd ruby-install-0.7.0/ \
    && make install \
    && ruby-install --system ruby $RUBY_VERSION \
    && rm -rf /ruby-install-0.7.0 /ruby-install-0.7.0.tar.gz

# Install Node
ARG node_version

ENV NODE_VERSION $node_version

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  # gpg keys listed at https://github.com/nodejs/node#release-keys
  && set -ex \
  && for key in \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    77984A986EBC2AA786BC0F66B01FBB92821C587A \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    4ED778F539E3634C779C87C6D7062848A1AB005C \
    A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
    B9E2F5981AA6E0CD28160D9FF13993A75599653C \
  ; do \
    gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
    gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update \
    && apt-get -y --no-install-recommends install yarn

# Install Python
ARG python_version

ENV LANG C.UTF-8
ENV PYTHONIOENCODING UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
		tk-dev \
	&& rm -rf /var/lib/apt/lists/*

ENV GPG_KEY C01E1CAD5EA2C4F0B8E3571504C367C218ADD4FF
ENV PYTHON_VERSION $python_version

RUN set -ex \
	\
	&& wget -O python.tar.xz "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz" \
	&& wget -O python.tar.xz.asc "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz.asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --batch --keyserver ha.pool.sks-keyservers.net --recv-keys "$GPG_KEY" \
	&& gpg --batch --verify python.tar.xz.asc python.tar.xz \
	&& { command -v gpgconf > /dev/null && gpgconf --kill all || :; } \
	&& rm -rf "$GNUPGHOME" python.tar.xz.asc \
	&& mkdir -p /usr/src/python \
	&& tar -xJC /usr/src/python --strip-components=1 -f python.tar.xz \
	&& rm python.tar.xz \
	\
	&& cd /usr/src/python \
	&& gnuArch="$(dpkg-architecture --query DEB_BUILD_GNU_TYPE)" \
	&& ./configure \
		--build="$gnuArch" \
		--enable-optimizations \
		--enable-option-checking=fatal \
		--enable-shared \
		--enable-unicode=ucs4 \
	&& make -j "$(nproc)" \
# setting PROFILE_TASK makes "--enable-optimizations" reasonable: https://bugs.python.org/issue36044 / https://github.com/docker-library/python/issues/160#issuecomment-509426916
		PROFILE_TASK='-m test.regrtest --pgo \
			test_array \
			test_base64 \
			test_binascii \
			test_binhex \
			test_binop \
			test_bytes \
			test_c_locale_coercion \
			test_class \
			test_cmath \
			test_codecs \
			test_compile \
			test_complex \
			test_csv \
			test_decimal \
			test_dict \
			test_float \
			test_fstring \
			test_hashlib \
			test_io \
			test_iter \
			test_json \
			test_long \
			test_math \
			test_memoryview \
			test_pickle \
			test_re \
			test_set \
			test_slice \
			test_struct \
			test_threading \
			test_time \
			test_traceback \
			test_unicode \
		' \
	&& make install \
	&& ldconfig \
	\
	&& find /usr/local -depth \
		\( \
			\( -type d -a \( -name test -o -name tests -o -name idle_test \) \) \
			-o \
			\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
		\) -exec rm -rf '{}' + \
	&& rm -rf /usr/src/python \
	\
	&& python2 --version

# if this is called "PIP_VERSION", pip explodes with "ValueError: invalid truth value '<VERSION>'"
ENV PYTHON_PIP_VERSION 19.3.1
# https://github.com/pypa/get-pip
ENV PYTHON_GET_PIP_URL https://github.com/pypa/get-pip/raw/ffe826207a010164265d9cc807978e3604d18ca0/get-pip.py
ENV PYTHON_GET_PIP_SHA256 b86f36cc4345ae87bfd4f10ef6b2dbfa7a872fbff70608a1e43944d283fd0eee

RUN set -ex; \
	\
	wget -O get-pip.py "$PYTHON_GET_PIP_URL"; \
	echo "$PYTHON_GET_PIP_SHA256 *get-pip.py" | sha256sum --check --strict -; \
	\
	python get-pip.py \
		--disable-pip-version-check \
		--no-cache-dir \
		"pip==$PYTHON_PIP_VERSION" \
	; \
	pip --version; \
	\
	find /usr/local -depth \
		\( \
			\( -type d -a \( -name test -o -name tests -o -name idle_test \) \) \
			-o \
			\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
		\) -exec rm -rf '{}' +; \
	rm -f get-pip.py

# Install Java 11 LTS / OpenJDK 11
RUN if grep -q Debian /etc/os-release && grep -q stretch /etc/os-release; then \
		echo 'deb http://deb.debian.org/debian stretch-backports main' | tee -a /etc/apt/sources.list.d/stretch-backports.list; \
	elif grep -q Ubuntu /etc/os-release && grep -q xenial /etc/os-release; then \
		apt-get update && apt-get install -y software-properties-common && \
		add-apt-repository -y ppa:openjdk-r/ppa; \
	fi \
	&& apt-get update \
  && apt-get install -y \
       openjdk-11-jre \
       openjdk-11-jre-headless \
       openjdk-11-jdk \
       openjdk-11-jdk-headless \
       libgconf-2-4

# Install Firefox
RUN FIREFOX_URL="https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US" \
  && ACTUAL_URL=$(curl -Ls -o /dev/null -w %{url_effective} $FIREFOX_URL) \
  && curl --silent --show-error --location --fail --retry 3 --output /tmp/firefox.tar.bz2 $ACTUAL_URL \
  && tar -xvjf /tmp/firefox.tar.bz2 -C /opt \
  && ln -s /opt/firefox/firefox /usr/local/bin/firefox \
  && apt-get install -y libgtk3.0-cil-dev libasound2 libasound2 libdbus-glib-1-2 libdbus-1-3 \
  && rm -rf /tmp/firefox.* \
  && firefox --version

# Install geckodriver
RUN export GECKODRIVER_LATEST_RELEASE_URL=$(curl https://api.github.com/repos/mozilla/geckodriver/releases/latest | jq -r ".assets[] | select(.name | test(\"linux64\")) | .browser_download_url") \
     && curl --silent --show-error --location --fail --retry 3 --output /tmp/geckodriver_linux64.tar.gz "$GECKODRIVER_LATEST_RELEASE_URL" \
     && cd /tmp \
     && tar xf geckodriver_linux64.tar.gz \
     && rm -rf geckodriver_linux64.tar.gz \
     && mv geckodriver /usr/local/bin/geckodriver \
     && chmod +x /usr/local/bin/geckodriver \
     && geckodriver --version

# Install Chrome
RUN curl --silent --show-error --location --fail --retry 3 --output /tmp/google-chrome-stable_current_amd64.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && (dpkg -i /tmp/google-chrome-stable_current_amd64.deb || apt-get -fy install)  \
    && rm -rf /tmp/google-chrome-stable_current_amd64.deb \
    && sed -i 's|HERE/chrome"|HERE/chrome" --disable-setuid-sandbox --no-sandbox|g' \
        "/opt/google/chrome/google-chrome" \
    && google-chrome --version

# Install chromedriver
RUN CHROME_VERSION="$(google-chrome --version)" \
    && export CHROMEDRIVER_RELEASE="$(echo $CHROME_VERSION | sed 's/^Google Chrome //')" && export CHROMEDRIVER_RELEASE=${CHROMEDRIVER_RELEASE%%.*} \
    && CHROMEDRIVER_VERSION=$(curl --silent --show-error --location --fail --retry 4 --retry-delay 5 http://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROMEDRIVER_RELEASE}) \
    && curl --silent --show-error --location --fail --retry 4 --retry-delay 5 --output /tmp/chromedriver_linux64.zip "http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip" \
    && cd /tmp \
    && unzip chromedriver_linux64.zip \
    && rm -rf chromedriver_linux64.zip \
    && mv chromedriver /usr/local/bin/chromedriver \
    && chmod +x /usr/local/bin/chromedriver \
    && chromedriver --version

# Start xvfb automatically to avoid needing to express in circle.yml
ENV DISPLAY :99
RUN printf '#!/bin/sh\nXvfb :99 -screen 0 1280x1024x24 -nolisten unix &\nexec "$@"\n' > /tmp/entrypoint \
    && chmod +x /tmp/entrypoint \
    && mv /tmp/entrypoint /docker-entrypoint.sh

# Ensure that the build agent doesn't override the entrypoint
LABEL com.circleci.preserve-entrypoint=true

RUN groupadd --gid 3434 circleci \
    && useradd --uid 3434 --gid circleci --shell /bin/bash --create-home circleci \
    && echo 'circleci ALL=NOPASSWD: ALL' >> /etc/sudoers.d/50-circleci \
    && echo 'Defaults    env_keep += "DEBIAN_FRONTEND"' >> /etc/sudoers.d/env_keep

USER circleci

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/bin/sh"]
