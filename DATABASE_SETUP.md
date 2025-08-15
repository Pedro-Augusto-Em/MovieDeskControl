# Configuração de Banco de Dados - Movidesk Control

## 🗄️ Banco de Dados Atual
O sistema atualmente usa **dados em memória** para facilitar o desenvolvimento e testes.

## 🔄 Como Migrar para Banco Real

### Opção 1: Firebird 5.0 (Recomendado)
```bash
# Instalar Firebird 5.0
# Configurar conexão no backend/server.js
```

### Opção 2: MySQLSelecion
```bash
# Instalar MySQL
# Configurar conexão no backend/server.js
```

### Opção 3: SQLite (Mais Simples)
```bash
npm install sqlite3
# Configurar no backend/server.js
```

## 📊 Estrutura de Dados
```sql
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY,
    numero_ticket VARCHAR(50),
    aberto_em DATETIME,
    responsavel VARCHAR(100),
    cliente_classificacao VARCHAR(50),
    cliente_completo VARCHAR(200),
    cliente_organizacao VARCHAR(200),
    assunto TEXT,
    tempo_vida_horas DECIMAL(10,2),
    status VARCHAR(50),
    nr_mantis VARCHAR(50),
    data_source VARCHAR(100),
    created_at DATETIME,
    updated_at DATETIME
);
```

## 🔧 Configuração
1. Instalar dependências do banco escolhido
2. Modificar `backend/server.js` para usar conexão com banco
3. Criar tabelas e índices
4. Migrar dados existentes
