@echo off
REM GroceryOS Platform - Quick Setup Script for Windows
REM This script sets up the entire platform automatically

echo.
echo ========================================
echo    GroceryOS Platform Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found.
    echo Please make sure .env file exists in the project root.
    pause
    exit /b 1
)

echo [OK] Environment file found
echo.

REM Build and start containers
echo [INFO] Building Docker containers...
docker-compose down
docker-compose build

echo.
echo [INFO] Starting services...
docker-compose up -d

echo.
echo [INFO] Waiting for database to be ready...
timeout /t 15 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo [ERROR] Some services failed to start. Check logs with: docker-compose logs
    pause
    exit /b 1
)

echo [OK] All services are running
echo.

echo [INFO] Initializing Super Admin account...
docker-compose exec -T backend node -e "const prisma = require('./src/db'); const bcrypt = require('bcrypt'); (async () => { try { const exists = await prisma.superAdmin.findUnique({ where: { email: 'admin@groceryos.com' } }); if (!exists) { await prisma.superAdmin.create({ data: { fullName: 'Super Admin', email: 'admin@groceryos.com', password: await bcrypt.hash('admin123', 12), isActive: true } }); console.log('Super Admin created'); } else { console.log('Super Admin already exists'); } } catch(e) { console.error(e); } process.exit(0); })();"

echo.
echo ========================================
echo  GroceryOS Platform is Ready!
echo ========================================
echo.
echo Access Points:
echo    - Frontend: http://localhost
echo    - API: http://localhost:5000
echo    - Super Admin: http://localhost/superadmin
echo.
echo Default Super Admin Credentials:
echo    - Email: admin@groceryos.com
echo    - Password: admin123
echo.
echo [IMPORTANT] Change the default password after first login!
echo.
echo Next Steps:
echo    1. Open http://localhost/superadmin in your browser
echo    2. Login with credentials above
echo    3. Create your first store
echo    4. Login as store owner and start using the system
echo.
echo Documentation: See DEPLOYMENT.md for detailed instructions
echo.
echo To stop the platform: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause
