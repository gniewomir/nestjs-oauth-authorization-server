#!/bin/bash

set -e  # Exit on any error

CONTAINER_NAME="postgres_test"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Project root: $PROJECT_ROOT"

# Function to check if container is running
is_container_running() {
    docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"
}

# Function to check if container exists (running or stopped)
container_exists() {
    docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"
}

wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $CONTAINER_NAME pg_isready -U test -d test >/dev/null 2>&1; then
            echo "PostgreSQL is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet, waiting..."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: PostgreSQL failed to become ready after $max_attempts attempts"
    return 1
}

if is_container_running; then
    echo "Container '$CONTAINER_NAME' is running. Stopping and removing it with data..."

    docker stop $CONTAINER_NAME
    echo "Container stopped."

    docker rm $CONTAINER_NAME
    echo "Container removed."
    
    echo "Container '$CONTAINER_NAME' has been stopped and removed."
    
else
    echo "Container '$CONTAINER_NAME' is not running."

    if container_exists; then
        echo "Found stopped container '$CONTAINER_NAME'. Removing it..."
        docker rm $CONTAINER_NAME
        echo "Stopped container removed."
    fi
    
    echo "Starting new PostgreSQL container..."

    docker run -d \
        --name $CONTAINER_NAME \
        -p 5432:5432 \
        -e POSTGRES_PASSWORD=test \
        -e POSTGRES_USER=test \
        -e POSTGRES_DB=test \
        postgres:17.5
    
    echo "Container '$CONTAINER_NAME' started."

    if wait_for_postgres; then
        echo "PostgreSQL is fully running. Executing project setup..."
        
        # Change to project root directory
        cd "$PROJECT_ROOT"

        echo "Running 'nvm use'..."
        if command -v nvm >/dev/null 2>&1; then
            # Source nvm if it's available
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm use
        else
            echo "WARNING: nvm not found, skipping 'nvm use'"
        fi

        echo "Running 'npm run build'..."
        npm run build

        echo "Running 'npm run migration:run'..."
        npm run migration:run
        
        echo "Setup completed successfully!"
    else
        echo "ERROR: Failed to wait for PostgreSQL to be ready"
        exit 1
    fi
fi
