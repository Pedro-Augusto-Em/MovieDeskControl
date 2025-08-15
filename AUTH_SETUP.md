# 🔐 Sistema de Autenticação - Anydesk Control

## Visão Geral

O sistema de autenticação do Anydesk Control oferece um sistema completo e seguro para gerenciamento de usuários, incluindo:

- ✅ **Registro de usuários** com validação de e-mail
- ✅ **Login seguro** com JWT e proteção contra ataques
- ✅ **Recuperação de senha** via e-mail
- ✅ **Verificação de e-mail** obrigatória
- ✅ **Gestão de perfis** e alteração de senha
- ✅ **Controle de acesso** baseado em roles
- ✅ **Logs de segurança** para auditoria
- ✅ **Proteção contra ataques** (brute force, etc.)

## 🚀 Instalação Rápida

### 1. Instalar Dependências

#### Windows
```cmd
cd backend
install_auth.bat
```

#### Linux/macOS
```bash
cd backend
chmod +x install_auth.sh
./install_auth.sh
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:
```bash
cd backend
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Configurações de E-mail (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app

# Chave JWT (mude em produção!)
JWT_SECRET=sua-chave-secreta-muito-segura-2024
```

### 3. Configurar Banco de Dados

Execute o script de setup:
```bash
npm run setup
```

## 📧 Configuração de E-mail

### Gmail (Recomendado)

1. **Ativar verificação em duas etapas** na sua conta Google
2. **Gerar senha de aplicativo**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Mail" e "Outro (nome personalizado)"
   - Digite "Anydesk Control" e clique em "Gerar"
   - Use a senha gerada no campo `SMTP_PASS`

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
```

### Outros Provedores

Consulte a documentação do seu provedor de e-mail para as configurações SMTP.

## 🗄️ Estrutura do Banco

### Tabelas Criadas

- **`USERS`**: Usuários do sistema
- **`USER_SESSIONS`**: Sessões ativas
- **`AUTH_LOGS`**: Logs de autenticação
- **`SECURITY_SETTINGS`**: Configurações de segurança

### Usuário Padrão

- **Username**: `admin`
- **E-mail**: `admin@anydeskcontrol.com`
- **Senha**: `Admin@123`
- **Role**: `ADMIN`

## 🔑 Funcionalidades

### 1. Registro de Usuário

**Endpoint**: `POST /api/auth/register`

```json
{
  "username": "usuario123",
  "email": "usuario@exemplo.com",
  "password": "Senha@123",
  "firstName": "João",
  "lastName": "Silva"
}
```

**Validações**:
- Username único
- E-mail válido e único
- Senha forte (8+ chars, maiúscula, minúscula, número, especial)

### 2. Login

**Endpoint**: `POST /api/auth/login`

```json
{
  "username": "usuario123",
  "password": "Senha@123"
}
```

**Resposta**:
```json
{
  "success": true,
  "token": "jwt-token-aqui",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "role": "USER"
  }
}
```

### 3. Verificação de E-mail

**Endpoint**: `GET /api/auth/verify-email?token=token-aqui`

- Token enviado por e-mail após registro
- Expira em 24 horas
- Ativa a conta do usuário

### 4. Recuperação de Senha

**Solicitar Reset**: `POST /api/auth/request-password-reset`
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resetar Senha**: `POST /api/auth/reset-password`
```json
{
  "token": "token-do-email",
  "newPassword": "NovaSenha@123"
}
```

### 5. Gestão de Perfil

**Obter Perfil**: `GET /api/auth/profile`
**Atualizar Perfil**: `PUT /api/auth/profile`
**Alterar Senha**: `POST /api/auth/change-password`

### 6. Logout

**Endpoint**: `POST /api/auth/logout`

## 🛡️ Segurança

### Proteções Implementadas

- **Hash de senha**: bcrypt com salt
- **JWT**: Tokens seguros com expiração
- **Rate Limiting**: Proteção contra brute force
- **Bloqueio de conta**: Após múltiplas tentativas falhadas
- **Validação de entrada**: Sanitização de dados
- **Headers de segurança**: CORS, XSS Protection, etc.
- **Logs de auditoria**: Rastreamento de atividades

### Configurações de Segurança

```sql
-- Configurações padrão
PASSWORD_MIN_LENGTH: 8
PASSWORD_REQUIRE_UPPERCASE: true
PASSWORD_REQUIRE_LOWERCASE: true
PASSWORD_REQUIRE_NUMBERS: true
PASSWORD_REQUIRE_SPECIAL: true
MAX_LOGIN_ATTEMPTS: 5
LOCKOUT_DURATION_MINUTES: 30
SESSION_TIMEOUT_HOURS: 24
```

## 🔐 Middleware de Autenticação

### Proteger Rotas

```javascript
const { requireAuth, requireRole } = require('./auth/auth_middleware');

// Rota que requer autenticação
app.get('/api/protected', requireAuth, (req, res) => {
    // req.user contém informações do usuário
});

// Rota que requer role específico
app.get('/api/admin', requireAuth, requireRole('ADMIN'), (req, res) => {
    // Apenas administradores
});
```

### Middleware Disponíveis

- **`requireAuth`**: Usuário deve estar autenticado
- **`requireRole(role)`**: Usuário deve ter role específico
- **`requireAnyRole(roles)`**: Usuário deve ter um dos roles
- **`requireActiveAccount`**: Conta deve estar ativa
- **`requireVerifiedEmail`**: E-mail deve estar verificado

## 📊 Logs e Auditoria

### Logs de Autenticação

- **Registro**: `REGISTER`
- **Login**: `LOGIN_SUCCESS`, `LOGIN_FAILED`
- **Verificação**: `EMAIL_VERIFIED`
- **Reset**: `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET`
- **Alteração**: `PASSWORD_CHANGED`
- **Logout**: `LOGOUT`

### Consultar Logs (Admin)

```bash
GET /api/auth/logs?limit=100&offset=0&action=LOGIN_SUCCESS
```

## 🚀 Deploy em Produção

### 1. Variáveis de Ambiente

```env
NODE_ENV=production
JWT_SECRET=chave-muito-segura-e-aleatoria
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FRONTEND_URL=https://seu-site.netlify.app
SECURE_COOKIES=true
```

### 2. Segurança

- ✅ Use HTTPS em produção
- ✅ Mude `JWT_SECRET` para uma chave aleatória forte
- ✅ Configure `SECURE_COOKIES=true`
- ✅ Use senhas de aplicativo para SMTP
- ✅ Configure CORS com domínio específico

### 3. Monitoramento

- Monitore logs de autenticação
- Configure alertas para tentativas de login suspeitas
- Faça backup regular do banco de dados

## 🆘 Troubleshooting

### Problemas Comuns

**E-mail não enviado**:
- Verifique configurações SMTP
- Use senha de aplicativo para Gmail
- Verifique firewall/antivírus

**Login falha**:
- Verifique se a conta está ativa
- Verifique se o e-mail foi verificado
- Verifique se a conta não está bloqueada

**Token inválido**:
- Verifique se não expirou
- Verifique se o `JWT_SECRET` está correto
- Verifique se o token está sendo enviado corretamente

**Erro de CORS**:
- Configure `FRONTEND_URL` corretamente
- Verifique se o frontend está usando HTTPS em produção

### Logs de Debug

```bash
# Ver logs do servidor
npm start

# Ver logs específicos de autenticação
# Os logs aparecem no console com prefixo 🔐
```

## 📚 Recursos Adicionais

### Documentação

- [JWT.io](https://jwt.io/) - Documentação JWT
- [bcrypt](https://github.com/dcodeIO/bcrypt.js) - Hash de senhas
- [Nodemailer](https://nodemailer.com/) - Envio de e-mails
- [Express.js](https://expressjs.com/) - Framework web

### Exemplos de Uso

Veja os arquivos em `backend/auth/` para exemplos completos de implementação.

---

## 🎯 Próximos Passos

1. **Configure as variáveis de ambiente**
2. **Teste o registro e login**
3. **Configure seu provedor de e-mail**
4. **Teste a verificação de e-mail**
5. **Teste a recuperação de senha**
6. **Configure o frontend para usar autenticação**

O sistema de autenticação está pronto para uso! 🚀
