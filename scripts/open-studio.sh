echo "🎯 Opening Prisma Studio..."
echo "📊 This will open a visual database management interface"
echo "🌐 Prisma Studio will be available at: http://localhost:5555"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create a .env file with your DATABASE_URL"
    echo "💡 Copy from .env.example and update with your database credentials"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ Error: DATABASE_URL not found in .env file!"
    echo "📝 Please add your PostgreSQL connection string to .env"
    echo "💡 Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/taskit_db\""
    exit 1
fi

echo "✅ Environment file found"
echo "🔄 Generating Prisma client..."

# Generate Prisma client
npm run db:generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
    echo "🚀 Starting Prisma Studio..."
    echo ""
    echo "📋 What you can do in Prisma Studio:"
    echo "   • View all your tables (users, tasks)"
    echo "   • Browse and search records"
    echo "   • Add, edit, and delete data"
    echo "   • View relationships between tables"
    echo "   • Export data"
    echo ""
    echo "🔗 Opening http://localhost:5555 in your browser..."
    
    # Start Prisma Studio
    npm run db:studio
else
    echo "❌ Error generating Prisma client"
    echo "💡 Make sure your database is running and accessible"
fi
