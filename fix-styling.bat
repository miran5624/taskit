@echo off
echo 🎨 Fixing TaskIt Styling Issues...
echo.

echo 📦 Installing missing styling dependencies...
npm install tailwindcss postcss autoprefixer tailwindcss-animate --save-dev

echo.
echo 🔧 Installing missing UI components...
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-label

echo.
echo 🎯 Installing utility packages...
npm install class-variance-authority clsx tailwind-merge

echo.
echo ✅ Dependencies installed!
echo.
echo 🚀 Now restart your development server:
echo   1. Stop the current server (Ctrl+C)
echo   2. Run: npm run dev
echo   3. Visit: http://localhost:3000
echo.

pause
