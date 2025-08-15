# Configuração Firebird 5.0 - Anydesk Control

## 📋 Pré-requisitos

### 1. Instalação do Firebird 5.0

#### Windows
1. Baixe o Firebird 5.0 em: https://firebirdsql.org/en/firebird-5-0/
2. Execute o instalador como administrador
3. Escolha "Super Server" como arquitetura
4. Configure a senha do SYSDBA (padrão: masterkey)
5. Mantenha a porta padrão 3050

#### Linux (Ubuntu/Debian)
```bash
# Adicionar repositório
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:mapopa/firebird3.0
sudo apt-get update

# Instalar Firebird 5.0
sudo apt-get install firebird5.0-server
sudo dpkg-reconfigure firebird5.0-server
```

#### macOS
```bash
# Usando Homebrew
brew install firebird

# Ou baixar do site oficial
```

### 2. Verificar Instalação

#### Windows
```cmd
# Verificar se o serviço está rodando
sc query FirebirdGuardianDefaultInstance

# Iniciar serviço se necessário
net start FirebirdGuardianDefaultInstance
```

#### Linux
```bash
# Verificar status
sudo systemctl status firebird5.0

# Iniciar se necessário
sudo systemctl start firebird5.0
sudo systemctl enable firebird5.0
```

## 🚀 Configuração Rápida

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Executar Setup Automático
```bash
# Windows
npm run setup

# Linux/macOS
node database/setup_firebird.js
```

### 3. Iniciar Sistema
```bash
npm start
```

## ⚙️ Configuração Manual

### 1. Criar Banco de Dados

#### Usando isql-fb
```bash
# Conectar ao servidor
isql-fb -u SYSDBA -p masterkey localhost:3050

# Criar banco
CREATE DATABASE 'C:/AnydeskControl/database/anydesk_control.fdb'
PAGE_SIZE 4096
DEFAULT CHARACTER SET UTF8;

# Sair
QUIT;
```

#### Usando gbak (restore)
```bash
# Se você tem um backup
gbak -r -u SYSDBA -p masterkey backup.fbk C:/AnydeskControl/database/anydesk_control.fdb
```

### 2. Executar Script SQL
```bash
# Conectar e executar script
isql-fb -u SYSDBA -p masterkey localhost:3050/anydesk_control.fdb -i database/firebird_schema.sql
```

### 3. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:
```env
# Configurações do Firebird
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:/AnydeskControl/database/anydesk_control.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações de Segurança
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Configurações de Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🔧 Configurações Avançadas

### 1. Configuração do firebird.conf

Localização:
- **Windows**: `C:\Program Files\Firebird\Firebird_5_0\firebird.conf`
- **Linux**: `/etc/firebird/5.0/firebird.conf`
- **macOS**: `/usr/local/firebird/firebird.conf`

Configurações recomendadas:
```ini
# Configurações de memória
DefaultDbCachePages = 2048
FileSystemCacheThreshold = 67108864

# Configurações de rede
RemoteServicePort = 3050
RemoteServiceName = gds_db

# Configurações de segurança
AuthServer = Srp256
UserManager = Srp
WireCrypt = Enabled

# Configurações de log
LogServices = Default
LogConfig = firebird.log
```

### 2. Configuração de Usuários

#### Criar usuário específico
```sql
-- Conectar como SYSDBA
CREATE USER ANYDESK_USER PASSWORD 'anydesk123';

-- Conceder permissões
GRANT ALL ON TICKETS TO ANYDESK_USER;
GRANT ALL ON USERS TO ANYDESK_USER;
GRANT ALL ON DASHBOARDS TO ANYDESK_USER;
GRANT ALL ON DASHBOARD_CHARTS TO ANYDESK_USER;
GRANT ALL ON DATA_SOURCES TO ANYDESK_USER;
```

#### Atualizar .env com novo usuário
```env
FIREBIRD_USER=ANYDESK_USER
FIREBIRD_PASSWORD=anydesk123
```

### 3. Backup e Restore

#### Backup automático
```bash
# Script de backup (Windows)
@echo off
set BACKUP_DIR=C:\backups
set DB_PATH=C:\AnydeskControl\database\anydesk_control.fdb
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

gbak -b -u SYSDBA -p masterkey %DB_PATH% %BACKUP_DIR%\anydesk_control_%DATE%.fbk

echo Backup concluido: anydesk_control_%DATE%.fbk
```

#### Restore
```bash
# Parar aplicação
# Restaurar backup
gbak -r -u SYSDBA -p masterkey backup.fbk C:/AnydeskControl/database/anydesk_control.fdb
# Reiniciar aplicação
```

## 🛠️ Troubleshooting

### 1. Erro de Conexão
```
Error: connection failed
```

**Soluções:**
- Verificar se o Firebird está rodando
- Verificar porta 3050
- Verificar credenciais
- Verificar firewall

### 2. Erro de Permissão
```
Error: no permission for read/write access
```

**Soluções:**
- Verificar permissões do usuário
- Verificar permissões do diretório
- Executar como administrador

### 3. Erro de Arquivo não Encontrado
```
Error: file not found
```

**Soluções:**
- Verificar caminho do banco
- Criar diretório se não existir
- Verificar permissões

### 4. Erro de Memória
```
Error: memory allocation failed
```

**Soluções:**
- Aumentar DefaultDbCachePages
- Verificar memória disponível
- Otimizar queries

## 📊 Monitoramento

### 1. Logs do Firebird
```bash
# Windows
tail -f "C:\Program Files\Firebird\Firebird_5_0\firebird.log"

# Linux
tail -f /var/log/firebird/firebird.log
```

### 2. Estatísticas do Banco
```sql
-- Conectar ao banco
SELECT 
    RDB$RELATION_NAME as TABLE_NAME,
    RDB$RECORD_SEGMENTS as SEGMENTS,
    RDB$RECORD_LENGTH as RECORD_LENGTH
FROM RDB$RELATIONS 
WHERE RDB$VIEW_BLR IS NULL 
AND RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0;
```

### 3. Monitor de Performance
```sql
-- Verificar conexões ativas
SELECT * FROM MON$ATTACHMENTS;

-- Verificar transações
SELECT * FROM MON$TRANSACTIONS;

-- Verificar estatísticas de tabelas
SELECT * FROM MON$RECORD_STATS;
```

## 🔒 Segurança

### 1. Configurações de Segurança
```ini
# firebird.conf
WireCrypt = Enabled
AuthServer = Srp256
UserManager = Srp
```

### 2. Firewall
```bash
# Windows
netsh advfirewall firewall add rule name="Firebird" dir=in action=allow protocol=TCP localport=3050

# Linux
sudo ufw allow 3050
```

### 3. Backup de Segurança
- Backup diário automático
- Backup antes de atualizações
- Teste de restore regular
- Criptografia de backups

## 📈 Performance

### 1. Índices Otimizados
```sql
-- Índices já criados no schema
CREATE INDEX IDX_TICKETS_STATUS ON TICKETS(STATUS);
CREATE INDEX IDX_TICKETS_RESPONSAVEL ON TICKETS(RESPONSAVEL);
CREATE INDEX IDX_TICKETS_DATA_SOURCE ON TICKETS(DATA_SOURCE);
```

### 2. Configurações de Cache
```ini
# firebird.conf
DefaultDbCachePages = 4096
FileSystemCacheThreshold = 134217728
```

### 3. Manutenção Regular
```sql
-- Estatísticas
SET STATISTICS INDEX RDB$PRIMARY1;

-- Garbage Collection
SET GARBAGE COLLECTION ON;
```

## 🚀 Deploy em Produção

### 1. Preparação
```bash
# Instalar dependências
npm install --production

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com configurações de produção

# Configurar banco
npm run setup
```

### 2. PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Configurar PM2
pm2 start ecosystem.config.js

# Configurar startup automático
pm2 startup
pm2 save
```

### 3. Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Suporte

### Logs Úteis
- Firebird: `firebird.log`
- Aplicação: `logs/app.log`
- Sistema: Event Viewer (Windows) / syslog (Linux)

### Comandos de Diagnóstico
```bash
# Status do serviço
systemctl status firebird5.0

# Teste de conexão
isql-fb -u SYSDBA -p masterkey localhost:3050

# Backup de teste
gbak -b -u SYSDBA -p masterkey database.fdb backup.fbk
```

---

**Nota**: Este guia assume Firebird 5.0. Para versões anteriores, alguns comandos podem variar.
