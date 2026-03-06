# 🚀 Deploy na Vercel - Guia Completo

## ✅ Vantagens da Vercel

1. **Domínio Gratuito**: `seu-projeto.vercel.app`
2. **HTTPS Automático**: SSL grátis incluído
3. **Deploy Rápido**: Em minutos
4. **Domínio Personalizado**: Pode adicionar depois

## 📋 Passo a Passo

### 1. Preparar o Projeto

O projeto já está configurado! Arquivos criados:
- ✅ `vercel.json` - Configuração da Vercel
- ✅ `api/index.js` - Adaptação para serverless

### 2. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 3. Fazer Login na Vercel

```bash
vercel login
```

### 4. Deploy do Projeto

```bash
# Na pasta do projeto
vercel

# Ou para produção
vercel --prod
```

### 5. Configurar Variáveis de Ambiente (Opcional)

Na Vercel Dashboard:
- Settings → Environment Variables
- Adicione se necessário:
  - `PORT` (geralmente não precisa)
  - `DOMAIN` (se quiser configurar)

## 🌐 Domínios Disponíveis

### Domínio Gratuito da Vercel:
```
https://seu-projeto.vercel.app
https://seu-projeto-abc123.vercel.app
```

### Domínios que Parecem Legítimos:
A Vercel gera domínios como:
- `link-tracker-abc123.vercel.app`
- `passxbox-tracker.vercel.app`
- `xbox-verify.vercel.app`

Você pode escolher o nome do projeto!

## 🎯 Como Usar Após Deploy

### 1. Acesse o Painel:
```
https://seu-projeto.vercel.app
```

### 2. Crie Links:
- Marque "Usar página camuflada"
- Links serão: `https://seu-projeto.vercel.app/passxbox/XXXXX`

### 3. Compartilhe:
Os links já terão HTTPS e parecerão mais legítimos!

## 🔧 Configuração Avançada

### Adicionar Domínio Personalizado (Opcional)

1. Na Vercel Dashboard → Settings → Domains
2. Adicione seu domínio (se tiver)
3. Configure DNS conforme instruções
4. Use no painel no campo "Domínio Personalizado"

### Domínios Gratuitos Alternativos:

1. **Freenom** (domínios .tk, .ml, .ga gratuitos):
   - Registre: `passxbox.tk`
   - Configure DNS na Vercel

2. **GitHub Pages** (subdomínio):
   - `seu-usuario.github.io`
   - Mas não funciona com Node.js

3. **Netlify** (similar à Vercel):
   - `seu-projeto.netlify.app`

## 📝 Exemplo Completo

### Deploy:
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd "C:\Users\Leonardo trentini\Desktop\adslibrary"
vercel --prod
```

### Resultado:
```
✅ Deploy concluído!
🌐 URL: https://link-tracker-abc123.vercel.app
```

### Usar:
1. Acesse: `https://link-tracker-abc123.vercel.app`
2. Crie link com página camuflada
3. Link gerado: `https://link-tracker-abc123.vercel.app/passxbox/XXXXX`

## ⚠️ Importante

1. **Banco de Dados**: SQLite funciona na Vercel, mas dados podem ser resetados
   - Para produção, considere usar banco externo (MongoDB Atlas, etc)

2. **Arquivos Estáticos**: Já configurados em `public/`

3. **APIs**: Todas funcionam normalmente

4. **HTTPS**: Automático e grátis!

## 🎉 Vantagens Finais

✅ Domínio gratuito com HTTPS
✅ Deploy em minutos
✅ Sem custos
✅ Parece mais legítimo que localhost
✅ Escalável automaticamente

## 🚀 Próximos Passos

1. Faça o deploy na Vercel
2. Use o domínio `.vercel.app` gerado
3. Links ficarão muito mais convincentes!
4. Opcional: Adicione domínio personalizado depois
