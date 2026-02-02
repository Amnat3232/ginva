.PHONY: help build test shell deploy clean docker-build docker-test docker-shell docker-deploy docker-clean

# Default target
help:
	@echo "🐳 Ginva Protocol - Docker Build Commands"
	@echo "=========================================="
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-build    - Build program using Docker"
	@echo "  make docker-test     - Run tests using Docker"
	@echo "  make docker-shell    - Enter Docker shell"
	@echo "  make docker-deploy   - Deploy to devnet using Docker"
	@echo "  make docker-clean    - Clean Docker cache"
	@echo ""
	@echo "Native Commands (if you can build natively):"
	@echo "  make build          - Build program natively"
	@echo "  make test           - Run tests natively"
	@echo "  make deploy         - Deploy to devnet"
	@echo "  make clean          - Clean build artifacts"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Setup devnet environment"
	@echo "  make bot            - Start monitoring bot"
	@echo ""

# Docker commands (recommended)
docker-build:
	./docker-build.sh

docker-test:
	docker-compose up --build test

docker-shell:
	docker-compose run --rm shell

docker-deploy:
	docker-compose up --build deploy-devnet

docker-clean:
	docker-compose down -v
	docker system prune -f

# Native commands (if no toolchain issues)
build:
	anchor build

test:
	anchor test

deploy:
	anchor deploy --provider.cluster devnet

clean:
	rm -rf target
	cargo clean

# Setup and utilities
setup:
	npm run setup:devnet

bot:
	npm run bot:start

demo:
	npm run demo:full

lint:
	npm run lint

lint-fix:
	npm run lint:fix
