# Use Ubuntu as base
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    build-essential \
    pkg-config \
    libssl-dev \
    libudev-dev \
    zlib1g-dev \
    clang \
    cmake \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Solana CLI
ENV SOLANA_VERSION=1.18.26
RUN sh -c "$(curl -sSfL "https://release.solana.com/v${SOLANA_VERSION}/install")"
ENV PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"

# Install Anchor CLI
ENV ANCHOR_VERSION=0.29.0
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_VERSION} --locked

# Create workspace directory
WORKDIR /workspace

# Copy project files
COPY . /workspace/

# Install Node dependencies
RUN npm install

# Build Anchor program
RUN anchor build

# Default command
CMD ["/bin/bash"]
