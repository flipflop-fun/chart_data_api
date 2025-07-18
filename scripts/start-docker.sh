#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Docker containers
echo "Starting PostgreSQL and Redis containers..."
docker-compose up -d postgres redis

# Wait for services to be healthy
echo "Waiting for services to be ready..."
docker-compose exec postgres pg_isready -U postgres -d mint_price_api
docker-compose exec redis redis-cli ping

echo "Services are ready!"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"
echo "Redis Commander (optional): http://localhost:8081"