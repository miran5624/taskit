@echo off
echo 🔧 Complete TaskIt Installation Fix
echo ================================
echo.

echo 📁 Current directory: %CD%
echo.

echo 🧹 Step 1: Complete cleanup...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

if exist .npmrc (
    echo Removing .npmrc...
    del .npmrc
)

echo.
echo 🔄 Step 2: Clear npm cache...
npm cache clean --force

echo.
echo 🔄 Step 3: Update npm to latest version...
npm install -g npm@latest

echo.
echo 📦 Step 4: Install dependencies (this may take a few minutes)...
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Installation successful!
    echo.
    echo 🎯 Next steps:
    echo 1. Make sure PostgreSQL is running
    echo 2. Copy .env.example to .env and update database credentials
    echo 3. Run: npm run db:generate
    echo 4. Run: npm run db:push  
    echo 5. Run: npm run db:seed
    echo 6. Run: npm run db:studio
    echo.
    echo 🚀 To start the app: npm run dev
    echo.
) else (
    echo.
    echo ❌ Installation still failed. Let's try manual installation...
    echo.
    echo Installing core dependencies only...
    npm install express cors bcryptjs jsonwebtoken dotenv express-validator
    npm install @prisma/client prisma
    npm install next react react-dom
    npm install @reduxjs/toolkit react-redux
    npm install nodemon concurrently
)

echo.
echo Press any key to continue...
pause > nul
