#!/bin/bash

# WeWork Booker Deployment Script
# Usage: ./deploy.sh

echo "🚀 Starting WeWork Booker deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
print_status "Installing dependencies..."
npm install --production

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop wework-booker 2>/dev/null || true
pm2 delete wework-booker 2>/dev/null || true

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup

print_status "Application started successfully!"
print_status "Application is running on port 3519"
print_status "PM2 status:"
pm2 status

echo ""
print_status "Next steps:"
echo "1. Copy nginx.conf to your Nginx sites-available directory"
echo "2. Create symbolic link to sites-enabled"
echo "3. Obtain SSL certificates for weworkbook.risya.id"
echo "4. Test and reload Nginx configuration"
echo ""
echo "Commands:"
echo "sudo cp nginx.conf /etc/nginx/sites-available/weworkbook.risya.id"
echo "sudo ln -s /etc/nginx/sites-available/weworkbook.risya.id /etc/nginx/sites-enabled/"
echo "sudo nginx -t"
echo "sudo systemctl reload nginx"
echo ""
print_status "Deployment completed! 🎉"