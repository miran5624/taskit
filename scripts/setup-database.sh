echo "🗄️  Setting up TaskIt Database..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the DATABASE_URL in .env with your PostgreSQL credentials"
    echo "💡 Example: postgresql://username:password@localhost:5432/taskit_db"
    echo ""
fi

echo "🔄 Installing dependencies..."
npm install

echo "🔄 Generating Prisma client..."
npm run db:generate

echo "🔄 Pushing schema to database..."
npm run db:push

echo "🌱 Seeding database with demo data..."
npm run db:seed

echo ""
echo "✅ Database setup complete!"
echo "🎯 You can now:"
echo "   • Run 'npm run db:studio' to open Prisma Studio"
echo "   • Run 'npm run dev' to start the application"
echo "   • Visit http://localhost:3000 to use the app"
echo ""
echo "👥 Demo users created:"
echo "   • john@example.com (password: password123)"
echo "   • jane@example.com (password: password123)"
