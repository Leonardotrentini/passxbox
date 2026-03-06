# 🚀 Deploy na Vercel - Guia Rápido

## ✅ Por que Vercel?

- ✅ **Domínio GRÁTIS**: `seu-projeto.vercel.app`
- ✅ **HTTPS Automático**: SSL grátis incluído
- ✅ **Deploy em 2 minutos**
- ✅ **Sem custos** (plano gratuito)
- ✅ **Parece mais legítimo** que localhost

## 📋 Deploy Rápido (3 Passos)

### Opção 1: Usando o Arquivo .bat (Mais Fácil)

1. **Clique duas vezes** no arquivo `DEPLOY_RAPIDO.bat`
2. Siga as instruções na tela
3. Pronto! Seu projeto estará online

### Opção 2: Manual (Terminal)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login (abre navegador)
vercel login

# 3. Deploy
vercel --prod
```

## 🌐 Domínio Gerado

Após o deploy, você receberá um domínio como:

```
https://link-tracker-abc123.vercel.app
```

**Muito melhor que localhost!** ✅

## 🎯 Como Usar Após Deploy

### 1. Acesse o Painel:
```
https://seu-projeto.vercel.app
```

### 2. Crie Links com Página Camuflada:
- Marque ✅ "Usar página camuflada (PassXbox)"
- Links serão: `https://seu-projeto.vercel.app/passxbox/XXXXX`

### 3. Compartilhe:
Os links já terão HTTPS e parecerão legítimos!

## ⚠️ Importante: Banco de Dados

**SQLite pode ter limitações na Vercel** (serverless functions).

### Soluções:

#### Opção 1: Usar Localmente (Recomendado para testes)
- Deploy na Vercel apenas para servir a página
- Banco de dados continua local

#### Opção 2: Banco Externo (Para produção)
Use um banco gratuito:
- **MongoDB Atlas** (grátis até 512MB)
- **Supabase** (PostgreSQL grátis)
- **PlanetScale** (MySQL grátis)

## 🔧 Configuração Alternativa: Vercel + Servidor Local

### Estratégia Híbrida:

1. **Frontend na Vercel**: Páginas e interface
2. **Backend Local**: API e banco de dados
3. **Domínio Vercel**: Links ficam legítimos

### Como Fazer:

1. Deploy frontend na Vercel
2. Configure CORS no servidor local
3. Use domínio Vercel nos links
4. API continua local (mais controle)

## 📝 Exemplo de Domínios Vercel

Você pode escolher o nome do projeto:

```
link-tracker.vercel.app
passxbox-verify.vercel.app
xbox-pass-check.vercel.app
microsoft-verify.vercel.app
```

Todos são **GRÁTIS** e com **HTTPS**!

## 🎉 Vantagens

✅ Domínio gratuito
✅ HTTPS automático
✅ Deploy rápido
✅ Sem custos
✅ Escalável
✅ Parece profissional

## 🚀 Próximos Passos

1. **Faça o deploy** usando `DEPLOY_RAPIDO.bat`
2. **Copie o domínio** gerado pela Vercel
3. **Use no painel** - links ficarão muito mais convincentes!

## 💡 Dica Pro

Para ficar ainda melhor:
- Escolha um nome de projeto convincente
- Use página camuflada (PassXbox)
- Links ficarão: `https://passxbox-verify.vercel.app/passxbox/XXXXX`

**Parece um site oficial da Microsoft!** 🎯
