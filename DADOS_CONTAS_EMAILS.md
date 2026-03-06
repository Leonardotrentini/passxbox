# 🔍 Detecção de Contas Vinculadas e Emails

## 📧 Sistema de Detecção de Emails

A ferramenta agora coleta **todos os emails encontrados** em:

### Fontes de Emails:
1. **Cookies** - Emails armazenados em cookies
2. **LocalStorage** - Emails em chaves e valores do localStorage
3. **SessionStorage** - Emails em chaves e valores do sessionStorage
4. **Inputs de Email** - Campos de formulário do tipo email
5. **Campos com "email" no nome** - Qualquer campo que contenha "email" no nome/id

### Formato de Detecção:
- Regex: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
- Todos os emails são normalizados (lowercase)
- Duplicatas são removidas automaticamente

## 🔗 Sistema de Detecção de Contas Vinculadas

A ferramenta detecta contas logadas nos seguintes serviços:

### Serviços Detectados:

1. **Google** (Gmail, YouTube, Google Services)
   - Cookies: `google`, `gmail`, `youtube`, `GA_`, `_ga`
   - Storage keys contendo "google" ou "gmail"
   - Email extraído quando disponível

2. **Facebook**
   - Cookies: `facebook`, `fb_`, `fr=`
   - User ID extraído de `c_user`
   - Storage keys do Facebook

3. **Twitter/X**
   - Cookies: `twitter`, `twid=`
   - Indicadores de login

4. **Microsoft** (Outlook, Office, Live)
   - Cookies: `microsoft`, `live.com`, `outlook`, `office`
   - Email extraído quando disponível

5. **Amazon**
   - Cookies: `amazon`, `aws-`
   - Indicadores de conta ativa

6. **Apple** (iCloud)
   - Cookies: `apple`, `icloud`
   - Indicadores de login

7. **GitHub**
   - Cookies: `github`, `_gh_`
   - Username quando disponível

8. **LinkedIn**
   - Cookies: `linkedin`, `li_`
   - Indicadores de perfil ativo

9. **Instagram**
   - Cookies: `instagram`
   - Indicadores de login

10. **YouTube**
    - Cookies: `youtube`, `VISITOR_INFO`
    - Indicadores de conta vinculada

11. **PayPal**
    - Cookies: `paypal`, `pp_`
    - Email quando disponível

12. **Spotify**
    - Cookies: `spotify`
    - Indicadores de conta premium

13. **Netflix**
    - Cookies: `netflix`, `NetflixId`
    - Indicadores de assinatura

## 🔐 Detecção de Tokens de Autenticação

A ferramenta identifica e extrai:

### Tipos de Tokens:

1. **JWT Tokens**
   - Padrão: Começam com `eyJ`
   - Chaves contendo "jwt" ou "token"
   - Preview dos primeiros 50 caracteres

2. **OAuth Tokens**
   - Chaves contendo "oauth" ou "access_token"
   - Tokens de acesso de serviços de terceiros

3. **Session Tokens**
   - Chaves contendo "session" ou "sid"
   - Tokens de sessão de aplicações

4. **API Keys**
   - Chaves contendo "api" ou "key"
   - Chaves de API de serviços

### Fontes:
- **LocalStorage** - Tokens armazenados localmente
- **SessionStorage** - Tokens de sessão
- **Cookies** - Tokens em cookies HTTP

## 🌐 Detecção de Serviços de Terceiros

A ferramenta identifica serviços carregados na página:

### Categorias:

1. **Analytics**
   - Google Analytics
   - Facebook Pixel
   - Outros serviços de analytics

2. **Advertising**
   - Google Ads
   - DoubleClick
   - Outros serviços de publicidade

3. **Social**
   - Facebook embeds
   - Twitter widgets
   - Outros widgets sociais

4. **Payment**
   - PayPal
   - Stripe
   - Braintree

5. **CDN**
   - Cloudflare
   - CloudFront
   - Fastly

## 📊 Cross-Site Tracking

Detecção de rastreamento entre sites:

- **Third-Party Cookies** - Cookies de tracking (`_ga`, `_gid`, `_fbp`, `_fbc`, `utm_`)
- **LocalStorage de Tracking** - Dados de analytics armazenados
- **SessionStorage de Tracking** - Dados temporários de tracking

## 🔍 Dados de Autenticação

Análise completa de autenticação:

- **Status de Autenticação** - Se o usuário está logado
- **Métodos de Autenticação** - JWT, OAuth, Session
- **Provedores** - Quais serviços estão logados
- **Histórico de Login** - Tentativas anteriores (quando disponível)

## 💾 Armazenamento no Banco de Dados

### Tabela `emails`:
```sql
- id (INTEGER PRIMARY KEY)
- email (TEXT NOT NULL)
- click_id (INTEGER)
- source (TEXT)
- timestamp (DATETIME)
```

### Tabela `linked_accounts`:
```sql
- id (INTEGER PRIMARY KEY)
- click_id (INTEGER)
- service (TEXT)
- logged_in (INTEGER)
- user_id (TEXT)
- email (TEXT)
- indicators (TEXT)
- timestamp (DATETIME)
```

## 📡 APIs Disponíveis

### Buscar Emails Encontrados:
```
GET /api/emails
Retorna lista de todos os emails únicos encontrados
```

### Buscar Contas por Serviço:
```
GET /api/accounts/:service
Retorna todas as contas detectadas de um serviço específico
```

## 🎯 Casos de Uso para Investigação

### 1. Identificação de Suspeitos
- Emails encontrados podem identificar o suspeito
- Contas vinculadas revelam identidade digital
- Tokens podem ser rastreados para outras atividades

### 2. Rastreamento de Atividades
- Múltiplas contas vinculadas indicam padrão de comportamento
- Emails em diferentes cliques podem conectar casos
- Histórico de login revela frequência de acesso

### 3. Análise de Redes
- Contas vinculadas revelam conexões entre serviços
- Cross-site tracking mostra padrões de navegação
- Serviços de terceiros indicam outros sites visitados

### 4. Evidências Digitais
- Emails e contas são evidências de identidade
- Tokens podem ser usados para rastrear outras atividades
- Dados de autenticação provam acesso a serviços

## ⚠️ Limitações

- **Cookies de Terceiros**: Limitados por políticas de privacidade
- **Same-Origin Policy**: Alguns dados não são acessíveis entre domínios
- **Modo Privado**: Alguns dados podem não estar disponíveis
- **Extensões de Privacidade**: Podem bloquear detecção

## 🔒 Privacidade e Legalidade

**IMPORTANTE**: 
- Esta ferramenta deve ser usada apenas com autorização judicial
- Emails e contas são dados pessoais protegidos por LGPD/GDPR
- Sempre obtenha consentimento quando necessário
- Use apenas para investigações legítimas
