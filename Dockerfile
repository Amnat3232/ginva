# Dockerfile for building Ginva Protocol
# This solves the toolchain compatibility issue by using controlled environment

FROM rust:1.87-slim-bookworm as builder

# Install required dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libudev-dev \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Solana CLI v1.18.26 (compatible with Anchor 0.32.1)
# This includes rustc 1.75.0 and the SBF target (bpfel-unknown-none)
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)" && \
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH" && \
    solana --version && \
    rustc --version && \
    rustc --print target-list | grep bpf

# Set Solana path (so that cargo, rustc, etc. from Solana are used)
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install Anchor CLI 0.32.1 from git (using the Solana rustc)
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli --locked && \
    anchor --version

# Install Node.js (for Anchor builds)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node --version && \
    npm --version

# Set working directory
WORKDIR /build

# Copy package files first for better caching
COPY package.json package-lock.json* yarn.lock* ./
COPY Cargo.toml ./
COPY Anchor.toml .

# Install npm dependencies
RUN npm install

# Copy source code
COPY . .

# Use existing Cargo.lock (version 3) - don't regenerate as that creates version 4
# which requires -Znext-lockfile-bump flag not available in Solana toolchain

# Upgrade Anchor package in Docker (using npm instead of yarn)
RUN npm install @coral-xyz/anchor@0.32.1

# Build the program - use RUN to actually build during image creation
RUN anchor build
