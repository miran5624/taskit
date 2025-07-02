@echo off
echo 🔧 Fixing TaskIt Installation Issues...
echo.

echo 📁 Current directory: %CD%
echo.

echo 🧹 Cleaning up previous installation...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo 📦 Installing dependencies with legacy peer deps...
npm install --legacy-peer-deps

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Installation successful!
    echo.
    echo 🎯 Next steps:
    echo 1. Make sure PostgreSQL is running
    echo 2. Update .env file with your database credentials
    echo 3. Run: npm run db:generate
    echo 4. Run: npm run db:push
    echo 5. Run: npm run db:seed
    echo 6. Run: npm run db:studio
    echo.
) else (
    echo.
    echo ❌ Installation failed. Trying alternative method...
    echo.
    npm install --force
)

pause
