@echo off
echo ========================================
echo    Instalando Dependencias de Autenticacao
echo    Anydesk Control
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
echo [2/3] Instalando dependencias de autenticacao...
npm install bcrypt jsonwebtoken nodemailer cookie-parser
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [3/3] Configurando variaveis de ambiente...
if not exist .env (
    copy env.example .env
    echo ✓ Arquivo .env criado
    echo.
    echo IMPORTANTE: Configure as seguintes variaveis no arquivo .env:
    echo - SMTP_USER: Seu e-mail para envio de mensagens
    echo - SMTP_PASS: Sua senha de aplicativo
    echo - JWT_SECRET: Chave secreta para tokens JWT
    echo.
    echo Para Gmail, use uma senha de aplicativo:
    echo https://support.google.com/accounts/answer/185833
    echo.
) else (
    echo ✓ Arquivo .env ja existe
)

echo.
echo ========================================
echo    Instalacao concluida!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o arquivo .env com suas credenciais SMTP
echo 2. Execute o script de setup do banco: npm run setup
echo 3. Inicie o servidor: npm start
echo.
pause
