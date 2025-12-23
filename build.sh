#!/bin/bash

# Script to build the entire project

echo "================================================"
echo "Building Multiplayer Soccer - Spring Boot + React"
echo "================================================"

# Build backend
echo ""
echo "Building backend (Spring Boot)..."
cd backend
mvn clean package -DskipTests
if [ $? -eq 0 ]; then
    echo "✓ Backend built successfully"
else
    echo "✗ Backend build failed"
    exit 1
fi
cd ..

# Build frontend
echo ""
echo "Building frontend (React)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Frontend built successfully"
else
    echo "✗ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "================================================"
echo "Build completed successfully!"
echo "================================================"
echo ""
echo "To run the project:"
echo "  docker-compose up --build"
echo ""
echo "Or run services individually:"
echo "  Backend:  cd backend && mvn spring-boot:run"
echo "  Frontend: cd frontend && npm run dev"
echo ""
