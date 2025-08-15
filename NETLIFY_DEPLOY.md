# Deploy no Netlify

## Visão Geral
Este guia explica como fazer o deploy do Movidesk Control no Netlify, uma plataforma de hospedagem gratuita e fácil de usar.

## Pré-requisitos
- Conta no GitHub
- Conta no Netlify (gratuita)
- Projeto Movidesk Control configurado e funcionando localmente

## Passo a Passo

### 1. Preparar o Projeto

#### 1.1 Estrutura de Arquivos
Seu projeto já está configurado com a estrutura correta:
```
MovideskControl/
├── index.html                  # Interface principal (já renomeado)
├── backend/                    # Servidor Node.js
├── database/                   # Configurações Firebird
├── _redirects                  # Configurações Netlify
├── _headers                    # Headers de segurança
└── README.md                   # Documentação
```

#### 1.2 Frontend Configurado
O arquivo já foi renomeado para `index.html` e está pronto para o Netlify!

#### 1.3 Verificar Dependências
O `index.html` já inclui todas as dependências via CDN:
- Tailwind CSS
- Chart.js
- Font Awesome
- XLSX.js
- SortableJS

### 2. Deploy no Netlify

#### 2.1 Método 1: Deploy via GitHub (Recomendado)

1. **Acesse o Netlify**
   - Vá para [netlify.com](https://www.netlify.com)
   - Faça login com sua conta GitHub

2. **Conecte o Repositório**
   - Clique em "New site from Git"
   - Escolha "GitHub"
   - Autorize o Netlify a acessar seus repositórios
   - Selecione o repositório `MovideskControl`

3. **Configure o Deploy**
   - **Build command**: Deixe vazio (não é necessário build)
   - **Publish directory**: Deixe vazio (deploy direto da raiz)
   - **Branch**: `main` ou `master`

4. **Configurações Avançadas**
   - Clique em "Show advanced"
   - **Base directory**: Deixe vazio
   - **Functions directory**: Deixe vazio

5. **Deploy**
   - Clique em "Deploy site"
   - Aguarde o processo completar

#### 2.2 Método 2: Deploy Manual (Drag & Drop)

1. **Acesse o Netlify**
   - Vá para [netlify.com](https://www.netlify.com)
   - Faça login

2. **Deploy Manual**
   - Clique em "New site from Git"
   - Escolha "Deploy manually"
   - Arraste a pasta do projeto para a área de deploy

### 3. Configurações do Site

#### 3.1 Nome Personalizado
- No painel do site, clique em "Site settings"
- Em "Site information", clique em "Change site name"
- Digite um nome como `movidesk-control` ou `ticket-bi-system`

#### 3.2 Domínio Personalizado (Opcional)
- Em "Domain management", clique em "Add custom domain"
- Configure seu domínio se desejar

### 4. Configurações de Build

#### 4.1 Redirecionamentos
Crie um arquivo `_redirects` na raiz do projeto:
```
/*    /index.html   200
```

#### 4.2 Headers de Segurança
Crie um arquivo `_headers` na raiz do projeto:
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 5. Configuração do Backend

#### 5.1 Variáveis de Ambiente
No Netlify, vá em "Site settings" > "Environment variables":
```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3050
DB_NAME=movidesk_control
DB_USER=SYSDBA
DB_PASSWORD=sua_senha
```

#### 5.2 Deploy do Backend
O backend pode ser deployado em:
- **Render**: [render.com](https://render.com)
- **Railway**: [railway.app](https://railway.app)
- **Heroku**: [heroku.com](https://heroku.com)

### 6. Testando o Deploy

#### 6.1 Verificar Frontend
- Acesse a URL fornecida pelo Netlify
- Verifique se todos os gráficos carregam
- Teste a funcionalidade de upload de Excel
- Verifique se o tutorial funciona

#### 6.2 Verificar Backend
- Teste as APIs do backend
- Verifique a conexão com o banco de dados
- Teste o upload de arquivos

### 7. Atualizações Automáticas

#### 7.1 GitHub Integration
- O Netlify detecta automaticamente mudanças no GitHub
- Cada push para a branch principal gera um novo deploy
- Você pode configurar branches específicas para deploy

#### 7.2 Deploy Manual
- No painel do Netlify, clique em "Deploys"
- Clique em "Trigger deploy" > "Deploy site"

### 8. Monitoramento

#### 8.1 Analytics
- O Netlify fornece analytics básicos gratuitos
- Acesse "Analytics" no painel do site

#### 8.2 Logs
- Em "Deploys", clique em um deploy específico
- Visualize os logs de build e deploy

### 9. Troubleshooting

#### 9.1 Problemas Comuns

**Erro 404 em rotas**
- Verifique se o arquivo `_redirects` está configurado
- Confirme que o `index.html` está na raiz

**CORS Errors**
- Configure o backend para aceitar o domínio do Netlify
- Verifique as variáveis de ambiente

**Arquivos não carregam**
- Verifique se todos os arquivos estão no repositório
- Confirme as permissões de arquivo

#### 9.2 Suporte
- [Documentação do Netlify](https://docs.netlify.com)
- [Comunidade do Netlify](https://community.netlify.com)
- [Status do Netlify](https://status.netlify.com)

### 10. Vantagens do Netlify

✅ **Gratuito** para projetos pessoais
✅ **Deploy automático** via GitHub
✅ **HTTPS automático**
✅ **CDN global**
✅ **Formulários** (se necessário)
✅ **Funções serverless** (se necessário)
✅ **Integração contínua**
✅ **Preview deployments**

### 11. Próximos Passos

1. **Deploy do Frontend**: Siga os passos acima
2. **Deploy do Backend**: Escolha uma plataforma (Render/Railway/Heroku)
3. **Configuração de CORS**: Atualize o backend para aceitar o domínio do Netlify
4. **Testes**: Verifique todas as funcionalidades
5. **Monitoramento**: Configure alertas e analytics

## Conclusão

O Netlify oferece uma solução robusta e gratuita para hospedar o frontend do Movidesk Control. Com deploy automático via GitHub e configurações simples, você terá seu sistema rodando em produção rapidamente.

Para dúvidas específicas, consulte a documentação oficial do Netlify ou entre em contato com a comunidade.
