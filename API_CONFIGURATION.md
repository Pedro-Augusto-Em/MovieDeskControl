# Configuração das APIs

## Problema Identificado

O sistema estava fazendo chamadas para `localhost:3000`, que funciona apenas em desenvolvimento local. Quando publicado no Netlify, essas chamadas falham porque o backend não está rodando localmente.

## Solução Implementada

### 1. Arquivo de Configuração (`config.js`)

Criamos um arquivo `config.js` que:
- Detecta automaticamente se está rodando localmente ou em produção
- Permite configurar facilmente a URL do backend em produção
- Centraliza todas as configurações de API

### 2. Função `apiCall()` Unificada

Todas as chamadas de API agora usam a função `apiCall()` que:
- Aplica automaticamente a URL base correta
- Inclui headers padrão
- Trata erros de forma consistente

## Como Configurar

### Para Desenvolvimento Local
Não é necessário fazer nada. O sistema detecta automaticamente que está rodando em `localhost` e usa `http://localhost:3000`.

### Para Produção (Netlify)

1. **Edite o arquivo `config.js`**
   ```javascript
   const API_CONFIG = {
       // Substitua pela URL real do seu backend
       PRODUCTION_URL: 'https://seu-backend.herokuapp.com',
       // ... resto da configuração
   };
   ```

2. **Opções de Backend para Produção:**

   **Opção A: Heroku**
   - Deploy do backend no Heroku
   - URL: `https://seu-app.herokuapp.com`

   **Opção B: Railway**
   - Deploy do backend no Railway
   - URL: `https://seu-app.railway.app`

   **Opção C: Render**
   - Deploy do backend no Render
   - URL: `https://seu-app.onrender.com`

   **Opção D: VPS/Servidor Próprio**
   - Deploy em seu próprio servidor
   - URL: `https://seudominio.com` ou `http://seu-ip:3000`

## Estrutura das APIs

### Endpoints Disponíveis
- `/api/dashboard/stats` - Estatísticas do dashboard
- `/api/upload-excel` - Upload de arquivos Excel
- `/api/profile` - Gerenciamento de perfil
- `/api/tickets` - Listagem de tickets
- `/api/data-sources` - Gerenciamento de fontes de dados

### Exemplo de Uso
```javascript
// Antes (não funciona em produção)
const response = await fetch('http://localhost:3000/api/dashboard/stats');

// Agora (funciona em ambos os ambientes)
const response = await apiCall('/api/dashboard/stats');
```

## Verificação

### 1. Teste Local
```bash
# Inicie o backend
cd backend
npm start

# Acesse o frontend
# As APIs devem funcionar normalmente
```

### 2. Teste em Produção
1. Configure a URL do backend em `config.js`
2. Faça deploy no Netlify
3. Verifique se as APIs estão funcionando no console do navegador

## Troubleshooting

### Erro: "Failed to fetch"
- Verifique se a URL do backend em `config.js` está correta
- Confirme se o backend está rodando e acessível
- Verifique se há problemas de CORS no backend

### Erro: "CORS policy"
- Configure o CORS no backend para permitir seu domínio do Netlify
- Exemplo no `server.js`:
  ```javascript
  origin: ['https://seu-site.netlify.app', 'http://localhost:3000']
  ```

### Erro: "404 Not Found"
- Verifique se as rotas da API estão corretas no backend
- Confirme se o backend está rodando na porta correta

## Próximos Passos

1. **Deploy do Backend**: Escolha uma plataforma e faça deploy
2. **Configuração**: Atualize `config.js` com a URL real
3. **Teste**: Verifique se todas as funcionalidades estão funcionando
4. **Monitoramento**: Use o console do navegador para verificar erros

## Arquivos Modificados

- `index.html` - Todas as chamadas de API atualizadas
- `config.js` - Novo arquivo de configuração
- `API_CONFIGURATION.md` - Este guia
