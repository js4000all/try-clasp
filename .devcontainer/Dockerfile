FROM node:24-slim

RUN set -x \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    vim \
    less \
    curl \
    jq \
    ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack install --global pnpm@11

# 共通 CLI
ENV PNPM_HOME=/opt/pnpm
ENV PATH="${PNPM_HOME}/bin:${PATH}"

RUN mkdir -p "${PNPM_HOME}" \
  && pnpm add -g \
    @google/clasp \
    @google/gemini-cli

ENV LESSCHARSET=utf-8
WORKDIR /usr/src/app
COPY ./profile.d/alias.sh /etc/profile.d

USER node
