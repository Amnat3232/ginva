#!/bin/bash

# Build script for Ginva Protocol using Docker
# This solves the toolchain compatibility issue

set -e

echo "Ginva Protocol Docker Build"
echo "==============================="
echo ""

# Detect docker compose command (v2 vs legacy)
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "Docker Compose not found. Please install:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "Using: $COMPOSE_CMD"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker daemon is not running"
    echo "   Please start Docker Desktop or docker service"
    exit 1
fi

echo "Docker is running"
echo ""

# Function to show menu
show_menu() {
    echo "Select operation:"
    echo ""
    echo "1) Build program"
    echo "2) Run tests"  
    echo "3) Enter shell for manual commands"
    echo "4) Deploy to devnet"
    echo "5) Clean build cache"
    echo "6) View logs"
    echo "7) Exit"
    echo ""
}

# Function to build
build_project() {
    echo ""
    echo "Building program..."
    echo "   This may take several minutes on first run"
    echo ""
    
    if $COMPOSE_CMD up --build build; then
        echo ""
        echo "Build complete!"
        echo ""
        echo "Built files:"
        ls -lh target/deploy/*.so 2>/dev/null || echo "   No .so files found"
        ls -lh target/idl/*.json 2>/dev/null || echo "   No IDL files found"
    else
        echo ""
        echo "Build failed!"
        echo "   Check logs with: $COMPOSE_CMD logs build"
        return 1
    fi
}

# Function to run tests
run_tests() {
    echo ""
    echo "Running tests..."
    echo ""
    
    if $COMPOSE_CMD up --build test; then
        echo ""
        echo "Tests passed!"
    else
        echo ""
        echo "Tests failed!"
        return 1
    fi
}

# Function to enter shell
enter_shell() {
    echo ""
    echo "Entering shell..."
    echo ""
    echo "Common commands:"
    echo "   anchor build          - Build program"
    echo "   anchor test           - Run tests"
    echo "   anchor deploy         - Deploy"
    echo "   anchor keys sync      - Sync program IDs"
    echo "   solana --version      - Check Solana version"
    echo "   anchor --version      - Check Anchor version"
    echo "   exit                  - Exit shell"
    echo ""
    
    $COMPOSE_CMD run --rm shell
}

# Function to deploy
deploy_devnet() {
    echo ""
    echo "Deploying to devnet..."
    echo ""
    
    # Check if wallet exists
    if [ ! -f "$HOME/.config/solana/id.json" ]; then
        echo "No wallet found at ~/.config/solana/id.json"
        echo "   Create wallet first: solana-keygen new"
        return 1
    fi
    
    echo "Wallet found"
    
    if $COMPOSE_CMD up --build deploy-devnet; then
        echo ""
        echo "Deploy complete!"
    else
        echo ""
        echo "Deploy failed!"
        return 1
    fi
}

# Function to clean
clean_cache() {
    echo ""
    echo "Cleaning build cache..."
    
    $COMPOSE_CMD down -v 2>/dev/null || true
    docker system prune -f
    
    echo ""
    echo "Cache cleaned!"
}

# Function to view logs
view_logs() {
    echo ""
    echo "Viewing logs..."
    $COMPOSE_CMD logs -f
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice [1-7]: " choice
    
    case $choice in
        1)
            build_project
            ;;
        2)
            run_tests
            ;;
        3)
            enter_shell
            ;;
        4)
            deploy_devnet
            ;;
        5)
            clean_cache
            ;;
        6)
            view_logs
            ;;
        7)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo ""
            echo "Invalid choice"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done