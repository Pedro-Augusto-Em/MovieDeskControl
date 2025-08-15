#!/bin/bash

echo "========================================"
echo "   Sistema Movidesk Control"
echo "   Configuração Firebird 5.0"
echo "========================================"
echo

echo "[1/4] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    echo "Instale o Node.js em: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js encontrado"

echo
echo "[2/4] Verificando Firebird 5.0..."
if ! systemctl is-active --quiet firebird5.0; then
    echo "⚠️ Firebird 5.0 não está rodando"
    echo "Tentando iniciar o serviço..."
    sudo systemctl start firebird5.0
    if [ $? -ne 0 ]; then
        echo "ERRO: Não foi possível iniciar o Firebird 5.0"
        echo "Instale o Firebird 5.0 ou verifique a instalação"
        exit 1
    fi
fi
echo "✓ Firebird 5.0 está rodando"

echo
echo "[3/4] Instalando dependências..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao instalar dependências!"
    exit 1
fi
echo "✓ Dependências instaladas"

echo
echo "[4/4] Configurando banco de dados..."
node ../database/setup_firebird.js
if [ $? -ne 0 ]; then
    echo "⚠️ Erro na configuração do banco"
    echo "Verifique se o Firebird está rodando"
    exit 1
fi
echo "✓ Banco configurado"

echo
echo "========================================"
echo "   Configuração concluída!"
echo "========================================"
echo
echo "🚀 Iniciando servidor..."
echo "📊 Acesse: http://localhost:3000"
echo "📁 Frontend: index.html"
echo "🗄️ Banco: Firebird 5.0"
echo
echo "Pressione Ctrl+C para parar o servidor"
echo

node server.js
