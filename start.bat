@echo off
echo ========================================
echo    Sistema de BI - Movidesk Control
echo ========================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/3] Instalando dependencias...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [3/3] Iniciando servidor...
echo.
echo 🚀 Servidor iniciando na porta 3000...
echo 📊 Acesse: http://localhost:3000
echo 📁 Frontend: index.html
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node server.js
