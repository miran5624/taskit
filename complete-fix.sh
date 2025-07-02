echo "🔧 Complete TaskIt Installation Fix"
echo "================================"
echo ""

echo "📁 Current directory: $(pwd)"
echo ""

echo "🧹 Step 1: Complete cleanup..."
if [ -d "node_modules" ]; then
    echo "Removing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "Removing package-lock.json..."
    rm package-lock.json
fi

if [ -f ".npmrc" ]; then
    echo "Removing .npmrc..."
    rm .npmrc
fi

echo ""
echo "🔄 Step 2: Clear npm cache..."
npm cache clean --force

echo ""
echo "🔄 Step 3: Update npm to latest version..."
npm install -g npm@latest

echo ""
echo "📦 Step 4: Install dependencies (this may take a few minutes)..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Make sure PostgreSQL is running"
    echo "2. Copy .env.example to .env and update database credentials"
    echo "3. Run: npm run db:generate"
    echo "4. Run: npm run db:push"
    echo "5. Run: npm run db:seed"
    echo "6. Run: npm run db:studio"
    echo ""
    echo "🚀 To start the app: npm run dev"
    echo ""
else
    echo ""
    echo "❌ Installation still failed. Let's try manual installation..."
    echo ""
    echo "Installing core dependencies only..."
    npm install express cors bcryptjs jsonwebtoken dotenv express-validator
    npm install @prisma/client prisma
    npm install next react react-dom
    npm install @reduxjs/toolkit react-redux
    npm install nodemon concurrently
fi
