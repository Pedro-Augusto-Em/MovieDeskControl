# 🚀 Deploy Rápido no Netlify

## ⚡ Passos em 5 minutos

### 1. Acesse o Netlify
- Vá para [netlify.com](https://www.netlify.com)
- Faça login com sua conta GitHub

### 2. Conecte o Repositório
- Clique em **"New site from Git"**
- Escolha **"GitHub"**
- Selecione o repositório **`AnydeskControl`**

### 3. Configure o Deploy
- **Build command**: Deixe vazio
- **Publish directory**: Deixe vazio
- Clique em **"Deploy site"**

### 4. Aguarde e Acesse
- Deploy leva ~2 minutos
- URL será: `https://seu-site.netlify.app`

## 🔧 Configurações Importantes

### Backend
O backend precisa estar rodando em:
- **Render**: [render.com](https://render.com) - Gratuito
- **Railway**: [railway.app](https://railway.app) - Créditos gratuitos
- **Heroku**: [heroku.com](https://heroku.com) - Pago

### CORS
Atualize o backend para aceitar o domínio do Netlify:
```javascript
app.use(cors({
  origin: ['https://seu-site.netlify.app', 'http://localhost:3000']
}));
```

## ✅ Verificações Pós-Deploy

- [ ] Frontend carrega sem erros
- [ ] Gráficos são exibidos
- [ ] Upload de Excel funciona
- [ ] Tutorial funciona
- [ ] Backend responde às APIs

## 🆘 Problemas Comuns

**Erro 404**: Verifique se `index.html` está na raiz
**CORS**: Configure o backend para aceitar o domínio do Netlify
**Arquivos não carregam**: Verifique se todos os arquivos estão no GitHub

## 📞 Suporte
- [Documentação Netlify](https://docs.netlify.com)
- [Comunidade](https://community.netlify.com)

---
**🎯 Dica**: O deploy automático acontece a cada push no GitHub!
