echo "🔧 Fixing TaskIt Installation Issues..."
echo ""

echo "📁 Current directory: $(pwd)"
echo ""

echo "🧹 Cleaning up previous installation..."
if [ -d "node_modules" ]; then
    echo "Removing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "Removing package-lock.json..."
    rm package-lock.json
fi

echo ""
echo "📦 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Make sure PostgreSQL is running"
    echo "2. Update .env file with your database credentials"
    echo "3. Run: npm run db:generate"
    echo "4. Run: npm run db:push"
    echo "5. Run: npm run db:seed"
    echo "6. Run: npm run db:studio"
    echo ""
else
    echo ""
    echo "❌ Installation failed. Trying alternative method..."
    echo ""
    npm install --force
fi
