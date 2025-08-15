# Anydesk Control - Sistema de BI para Tickets

Sistema de Business Intelligence (BI) para análise e visualização de dados de tickets através de dashboards interativos.

## 🚀 Funcionalidades

- **📊 Dashboard Interativo**: Visualizações dinâmicas com Chart.js
- **📁 Importação Excel**: Processamento automático de arquivos .xlsx/.xls
- **🎯 Múltiplos Dashboards**: Criação e gerenciamento de dashboards customizados
- **👤 Gestão de Perfil**: Personalização de avatar, nome e função
- **🎨 Configurações Avançadas**: Personalização completa de gráficos
- **📚 Tutorial Interativo**: Guia passo-a-passo com animações
- **🗄️ Banco Firebird 5.0**: Armazenamento robusto e escalável
- **🔐 Sistema de Autenticação**: Registro, login, verificação de e-mail e recuperação de senha

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript, Chart.js
- **Backend**: Node.js, Express
- **Banco de Dados**: Firebird 5.0
- **Processamento**: XLSX.js para arquivos Excel

## 📋 Pré-requisitos

- Node.js 16+ 
- Firebird 5.0
- Navegador moderno

## 🚀 Como Executar

### Opção 1: Script Automático (Recomendado)

#### Windows
```cmd
start_firebird.bat
```

#### Linux/macOS
```bash
./start_firebird.sh
```

### Opção 2: Manual

1. **Instalar dependências**:
```bash
cd backend
npm install
```

2. **Configurar Firebird 5.0**:
```bash
npm run setup
```

3. **Iniciar servidor**:
```bash
npm start
```

4. **Acessar sistema**:
```
http://localhost:3000
```

## 🌐 Deploy em Produção

### Frontend (Netlify)
O frontend está configurado para deploy automático no Netlify:

1. **Conecte seu repositório GitHub** ao Netlify
2. **Deploy automático** a cada push
3. **HTTPS gratuito** e CDN global
4. **Configurações** em `NETLIFY_DEPLOY.md`

### Backend (Render/Railway/Heroku)
O backend pode ser deployado em:
- **Render**: [render.com](https://render.com) - Gratuito
- **Railway**: [railway.app](https://railway.app) - Créditos gratuitos
- **Heroku**: [heroku.com](https://heroku.com) - Plano pago

## 🗄️ Banco de Dados

### Firebird 5.0 (Produção)

O sistema usa **Firebird 5.0** como banco de dados principal:

- **Configuração**: `database/firebird_connection.js`
- **Schema**: `database/firebird_schema.sql`
- **Setup**: `database/setup_firebird.js`

### Estrutura do Banco

```sql
-- Tabelas principais
TICKETS          -- Dados dos tickets importados
USERS            -- Perfis dos usuários
DASHBOARDS       -- Configurações dos dashboards
DASHBOARD_CHARTS -- Configurações dos gráficos
DATA_SOURCES     -- Fontes de dados importadas
```

### Configuração Rápida

1. **Instalar Firebird 5.0**:
   - Windows: Download do site oficial
   - Linux: `sudo apt-get install firebird5.0-server`
   - macOS: `brew install firebird`

2. **Executar setup**:
```bash
node database/setup_firebird.js
```

3. **Verificar conexão**:
```bash
npm run setup
```

## 📁 Estrutura do Projeto

```
AnydeskControl/
├── index.html                  # Interface principal
├── backend/
│   ├── server.js              # Servidor Express
│   ├── package.json           # Dependências
│   └── uploads/               # Arquivos temporários
├── database/
│   ├── firebird_schema.sql    # Estrutura do banco
│   ├── firebird_connection.js # Conexão Firebird
│   ├── setup_firebird.js      # Script de configuração
│   └── anydesk_control.fdb    # Arquivo do banco
├── start_firebird.bat         # Script Windows
├── start_firebird.sh          # Script Linux/macOS
├── FIREBIRD_SETUP.md          # Documentação Firebird
└── README.md                  # Este arquivo
```

## 📊 Funcionalidades do Dashboard

### Gráficos Disponíveis
- **Pizza**: Distribuição por status
- **Barras**: Tickets por responsável
- **Linha**: Evolução temporal
- **Radar**: Métricas de performance
- **Scatter**: Correlação tempo vs prioridade

### Configurações
- **Cores**: Personalização completa
- **Dados**: Filtros e agrupamentos
- **Layout**: Posicionamento e tamanho
- **Animações**: Efeitos visuais

## 🎯 Múltiplos Dashboards

- **Criação**: Dashboards customizados
- **Gerenciamento**: Adicionar/remover gráficos
- **Persistência**: Configurações salvas
- **Navegação**: Troca entre dashboards

## 📚 Tutorial Interativo

- **Passo-a-passo**: Guia completo
- **Animações**: Efeitos visuais
- **Persistência**: Progresso salvo
- **Navegação**: Anterior/Próximo/Pular

## 🔧 Configurações

### Variáveis de Ambiente (.env)
```env
# Firebird
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:/AnydeskControl/database/anydesk_control.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# Servidor
PORT=3000
NODE_ENV=production
```

## 🚀 Deploy

### Frontend (GitHub Pages)
1. Fazer push para branch `gh-pages`
2. Configurar GitHub Pages
3. Acessar via URL do GitHub

### Backend (Produção)
- **Render**: Deploy automático
- **Railway**: Container deployment
- **Heroku**: App deployment
- **VPS**: PM2 + Nginx

## 📖 Documentação

- **Firebird**: `FIREBIRD_SETUP.md`
- **Deploy**: `NETLIFY_DEPLOY.md`
- **Banco**: `DATABASE_SETUP.md`
- **Autenticação**: `AUTH_SETUP.md`

## 🛠️ Troubleshooting

### Erro de Conexão Firebird
```bash
# Verificar serviço
systemctl status firebird5.0

# Testar conexão
isql-fb -u SYSDBA -p masterkey localhost:3050
```

### Erro de Upload
- Verificar formato do arquivo (.xlsx/.xls)
- Verificar cabeçalhos esperados
- Verificar tamanho do arquivo (max 10MB)

### Erro de Dependências
```bash
# Limpar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📞 Suporte

### Logs
- **Aplicação**: `logs/app.log`
- **Firebird**: `firebird.log`
- **Sistema**: Event Viewer / syslog

### Comandos Úteis
```bash
# Status do sistema
npm run setup

# Backup do banco
gbak -b -u SYSDBA -p masterkey database.fdb backup.fbk

# Restore do banco
gbak -r -u SYSDBA -p masterkey backup.fbk database.fdb
```

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes.

---

**Desenvolvido para controle e análise de tickets com foco em Business Intelligence**
