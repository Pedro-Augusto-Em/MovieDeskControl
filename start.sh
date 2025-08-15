#!/bin/bash

echo "========================================"
echo "   Sistema de BI - Movidesk Control"
echo "========================================"
echo

echo "[1/3] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    echo "Instale o Node.js em: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js encontrado"

echo
echo "[2/3] Instalando dependências..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao instalar dependências!"
    exit 1
fi
echo "✓ Dependências instaladas"

echo
echo "[3/3] Iniciando servidor..."
echo
echo "🚀 Servidor iniciando na porta 3000..."
echo "📊 Acesse: http://localhost:3000"
echo "📁 Frontend: index.html"
echo
echo "Pressione Ctrl+C para parar o servidor"
echo

node server.js
