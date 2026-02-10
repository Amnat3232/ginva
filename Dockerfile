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
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)" && \
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH" && \
    solana --version

# Set Solana path
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install Anchor CLI 0.32.1
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli --locked && \
    anchor --version

# Install Node.js (for Anchor builds)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node --version && \
    npm --version

# Setup Rust toolchain - use nightly for edition2024 support
# Note: bpfel-unknown-unknown target comes with Solana platform tools
RUN rustup install nightly-2025-02-01 && \
    rustup default nightly-2025-02-01 && \
    rustup component add rustfmt && \
    cargo +nightly-2025-02-01 --version && \
    rustc --print target-list | grep -E "(bpf|sbf)" || echo "Solana target will be provided by platform tools"

# Set working directory
WORKDIR /build

# Copy package files first for better caching
COPY package.json package-lock.json* yarn.lock* ./
COPY Cargo.toml Cargo.lock* ./
COPY rust-toolchain.toml ./
COPY Anchor.toml ./

# Install npm dependencies
RUN npm install

# Copy source code
COPY . .

# Regenerate Cargo.lock with stable cargo to avoid v4 format
# Using stable cargo generates version 3 lockfile which is compatible with Solana toolchain
RUN rm -f Cargo.lock && \
    cargo generate-lockfile

# Default command
CMD ["anchor", "build"]
