@echo off
echo ========================================
echo   T-Shirt Design Editor - Express Server
echo ========================================
echo.
echo Starting Express.js server...
echo.
echo This will:
echo 1. Install dependencies (if needed)
echo 2. Start the server at http://localhost:3000
echo 3. Open your browser automatically
echo.
echo Press Ctrl+C to stop the server when done.
echo.

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the server
echo Starting server...
npm start

pause 