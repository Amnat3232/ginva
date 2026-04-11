# Dockerfile for building Ginva Protocol with Anchor
# Uses official Anchor build environment

FROM buckaroo01/anchor:0.32.1 AS builder

# Install required dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Solana CLI v1.18.26
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)" && \
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH" && \
    solana --version

# Set Solana path
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Set working directory
WORKDIR /build

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Copy Pinocchio program
COPY programs/ginva-pinocchio programs/ginva-pinocchio

# Build the Pinocchio program using native build (not BPF)
# Since the program uses Pinocchio framework, not Anchor
WORKDIR /build/programs/ginva-pinocchio
RUN cargo build --release

# Return to build directory
WORKDIR /build