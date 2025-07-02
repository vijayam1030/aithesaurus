#!/bin/bash

# AI Thesaurus Setup Script
# This script automates the setup process for the AI Thesaurus application

set -e  # Exit on any error

echo "🚀 AI Thesaurus Setup Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js $NODE_VERSION is installed"
        else
            print_error "Node.js 18+ is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        print_success "npm $(npm --version) is installed"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        print_success "PostgreSQL is installed"
    else
        print_warning "PostgreSQL not found. Please install PostgreSQL 14+ with pgvector extension"
    fi
    
    # Check if Ollama is installed
    if command_exists ollama; then
        print_success "Ollama is installed"
    else
        print_warning "Ollama not found. It will be installed automatically."
    fi
}

# Function to install Ollama
install_ollama() {
    if ! command_exists ollama; then
        print_status "Installing Ollama..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
            curl -fsSL https://ollama.ai/install.sh | sh
            print_success "Ollama installed successfully"
        else
            print_error "Automatic Ollama installation not supported on this OS. Please install manually from https://ollama.ai"
            exit 1
        fi
    fi
}

# Function to start Ollama service
start_ollama() {
    print_status "Starting Ollama service..."
    
    # Check if Ollama is already running
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        print_success "Ollama is already running"
    else
        print_status "Starting Ollama daemon..."
        nohup ollama serve >/dev/null 2>&1 &
        
        # Wait for Ollama to start
        echo -n "Waiting for Ollama to start"
        for i in {1..30}; do
            if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
                echo
                print_success "Ollama started successfully"
                break
            fi
            echo -n "."
            sleep 1
        done
        
        if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            print_error "Failed to start Ollama service"
            exit 1
        fi
    fi
}

# Function to download AI models
download_models() {
    print_status "Downloading AI models..."
    
    # Download language model
    print_status "Downloading Qwen2.5:14b language model (8.4GB)..."
    if ollama list | grep -q "qwen2.5:14b"; then
        print_success "Qwen2.5:14b already downloaded"
    else
        ollama pull qwen2.5:14b
        print_success "Qwen2.5:14b downloaded successfully"
    fi
    
    # Download embedding model
    print_status "Downloading nomic-embed-text embedding model (274MB)..."
    if ollama list | grep -q "nomic-embed-text"; then
        print_success "nomic-embed-text already downloaded"
    else
        ollama pull nomic-embed-text
        print_success "nomic-embed-text downloaded successfully"
    fi
    
    print_success "All AI models downloaded successfully"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from example"
            print_warning "Please update the DATABASE_URL in .env file with your PostgreSQL credentials"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Function to setup Prisma
setup_prisma() {
    print_status "Setting up Prisma database..."
    
    # Generate Prisma client
    npm run db:generate
    print_success "Prisma client generated"
    
    # Push database schema
    print_status "Creating database tables..."
    npm run db:push
    print_success "Database schema applied"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if models are available
    if ollama list | grep -q "qwen2.5:14b" && ollama list | grep -q "nomic-embed-text"; then
        print_success "AI models are available"
    else
        print_error "AI models not properly installed"
        return 1
    fi
    
    # Check if dependencies are installed
    if [ -d "node_modules" ] && [ -d "frontend/node_modules" ]; then
        print_success "Dependencies installed"
    else
        print_error "Dependencies not properly installed"
        return 1
    fi
    
    print_success "Installation verification completed"
}

# Function to display next steps
show_next_steps() {
    echo
    echo "🎉 Setup completed successfully!"
    echo "=============================="
    echo
    echo "Next steps:"
    echo "1. Update your .env file with the correct DATABASE_URL"
    echo "2. Make sure PostgreSQL is running with pgvector extension"
    echo "3. Run the database setup: npm run db:push"
    echo "4. Start the backend server: npm run dev"
    echo "5. In a new terminal, start the frontend: cd frontend && npm run dev"
    echo
    echo "Application URLs:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend API: http://localhost:3001"
    echo "- Health Check: http://localhost:3001/health"
    echo
    echo "For troubleshooting, check the README.md file"
}

# Main setup function
main() {
    echo "Starting AI Thesaurus setup..."
    echo
    
    # Ask for confirmation
    read -p "This will install Ollama (if needed) and download AI models (~8.7GB). Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled"
        exit 0
    fi
    
    # Run setup steps
    check_requirements
    install_ollama
    start_ollama
    download_models
    setup_database
    install_dependencies
    
    # Only run Prisma setup if database URL is configured
    if grep -q "postgresql://" .env 2>/dev/null; then
        setup_prisma
    else
        print_warning "Database URL not configured. Skipping Prisma setup."
        print_warning "Please update .env file and run: npm run db:push"
    fi
    
    verify_installation
    show_next_steps
}

# Handle script interruption
trap 'echo; print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"