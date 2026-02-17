#!/bin/bash

# GroceryOS Platform - Quick Setup Script
# This script sets up the entire platform automatically

echo "🛒 GroceryOS Platform Setup"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || echo "⚠️  Please create .env file manually"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Build and start containers
echo "🔨 Building Docker containers..."
docker-compose down
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ All services are running"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "📊 Initializing database..."
docker-compose exec -T db psql -U posuser -d groceryos << EOF
-- Check if super_admins table exists and has data
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM super_admins LIMIT 1) THEN
        INSERT INTO super_admins (full_name, email, password, is_active) VALUES 
        ('Super Admin', 'admin@groceryos.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jzHq3qVjKK5a', true);
        RAISE NOTICE 'Super Admin account created';
    END IF;
END
\$\$;
EOF

echo ""
echo "================================"
echo "✅ GroceryOS Platform is Ready!"
echo "================================"
echo ""
echo "📍 Access Points:"
echo "   - Frontend: http://localhost"
echo "   - API: http://localhost:5000"
echo "   - Super Admin: http://localhost/superadmin"
echo ""
echo "🔐 Default Credentials:"
echo "   Super Admin Login:"
echo "   - Email: admin@groceryos.com"
echo "   - Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""
echo "📖 Next Steps:"
echo "   1. Login to Super Admin panel"
echo "   2. Create your first store"
echo "   3. Login as store owner"
echo "   4. Add products and start selling!"
echo ""
echo "📚 Documentation: See DEPLOYMENT.md for detailed instructions"
echo ""
echo "💡 To stop the platform: docker-compose down"
echo "💡 To view logs: docker-compose logs -f"
echo ""
