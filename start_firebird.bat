@echo off
echo ========================================
echo    Sistema Anydesk Control
echo    Configuracao Firebird 5.0
echo ========================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/4] Verificando Firebird 5.0...
sc query FirebirdGuardianDefaultInstance >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Firebird 5.0 nao encontrado ou nao esta rodando
    echo Instale o Firebird 5.0 em: https://firebirdsql.org/
    echo Ou inicie o servico: net start FirebirdGuardianDefaultInstance
    pause
    exit /b 1
)
echo ✓ Firebird 5.0 encontrado

echo.
echo [3/4] Instalando dependencias...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [4/4] Configurando banco de dados...
node ../database/setup_firebird.js
if %errorlevel% neq 0 (
    echo ⚠️ Erro na configuracao do banco
    echo Verifique se o Firebird esta rodando
    pause
    exit /b 1
)
echo ✓ Banco configurado

echo.
echo ========================================
echo    Configuracao concluida!
echo ========================================
echo.
echo 🚀 Iniciando servidor...
echo 📊 Acesse: http://localhost:3000
echo 📁 Frontend: front_end.html
echo 🗄️ Banco: Firebird 5.0
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node server.js
