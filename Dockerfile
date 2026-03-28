# Dockerfile for building Ginva Protocol (Pinocchio)
# Uses Pinocchio framework instead of Anchor

FROM rust:1.87-slim-bookworm as builder

# Install required dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libudev-dev \
    curl \
    git \
    build-essential \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# Install Solana CLI v1.18.26
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)" && \
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH" && \
    solana --version && \
    rustc --version && \
    rustc --print target-list | grep bpf

# Set Solana path
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install Node.js (for frontend)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node --version && \
    npm --version

# Set working directory
WORKDIR /build

# Copy package files first for better caching
COPY package.json package-lock.json* yarn.lock* ./
COPY Cargo.toml ./

# Install npm dependencies
RUN npm install

# Copy source code
COPY . .

# Copy Pinocchio program
COPY programs/ginva-pinocchio programs/ginva-pinocchio

# Build the Pinocchio program
WORKDIR /build/programs/ginva-pinocchio
RUN cargo build --release

# Return to build directory for frontend
WORKDIR /build

# Build frontend (optional)
# RUN npm run build
