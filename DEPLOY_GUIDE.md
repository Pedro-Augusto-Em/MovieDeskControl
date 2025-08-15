# Guia de Deploy - Anydesk Control

## 🌐 Deploy Frontend (GitHub Pages)

### 1. Preparar o Repositório
```bash
# Inicializar git (se não existir)
git init
git add .
git commit -m "Sistema de BI Anydesk Control"

# Criar repositório no GitHub
# Conectar com o repositório local
git remote add origin https://github.com/SEU_USUARIO/AnydeskControl.git
git push -u origin main
```

### 2. Configurar GitHub Pages
1. Vá para **Settings** > **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)
5. Salve

### 3. Configurar Frontend para Produção
- O arquivo `front_end.html` já está configurado
- Acesse: `https://SEU_USUARIO.github.io/AnydeskControl/front_end.html`

## 🖥️ Deploy Backend

### Opção 1: Render (Gratuito)
1. Conecte seu repositório GitHub
2. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Environment Variables**: `PORT=3000`

### Opção 2: Railway
1. Conecte GitHub
2. Deploy automático
3. Configure variáveis de ambiente

### Opção 3: Heroku
```bash
# Instalar Heroku CLI
heroku create anydesk-control-bi
git push heroku main
```

## 🔧 Configuração de Produção

### 1. Variáveis de Ambiente
Criar arquivo `.env`:
```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://SEU_USUARIO.github.io
```

### 2. PM2 (Para servidores VPS)
```bash
npm install -g pm2
pm2 start backend/server.js --name "anydesk-control"
pm2 startup
pm2 save
```

### 3. Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
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

## 📱 URLs de Acesso

### Desenvolvimento
- **Frontend**: `http://localhost:3000` ou `file:///caminho/front_end.html`
- **Backend**: `http://localhost:3000`

### Produção
- **Frontend**: `https://SEU_USUARIO.github.io/AnydeskControl/front_end.html`
- **Backend**: `https://seu-backend.railway.app` (ou outro serviço)

## 🔄 Atualizações
```bash
# Fazer alterações
git add .
git commit -m "Nova funcionalidade"
git push origin main

# Deploy automático (se configurado)
# Ou manual no painel do serviço
```

## 📊 Monitoramento
- **Logs**: Verificar logs do serviço de deploy
- **Status**: Monitorar uptime do backend
- **Performance**: Verificar tempo de resposta das APIs
