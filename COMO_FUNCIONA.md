# 📖 COMO FUNCIONA - Link Tracker

## 🎯 Conceito Principal

A ferramenta cria um **link intermediário** que:
1. **Coleta dados** do usuário quando ele clica
2. **Redireciona** para a URL final que você especificar

---

## 🔄 Fluxo Completo

### Exemplo Prático:

**Seu App na Vercel:** `https://meuapp.vercel.app`

**Link de Rastreamento Gerado:** `https://seu-tracker.vercel.app/t/abc12345`

### O que acontece:

1. **Usuário recebe o link:** `https://seu-tracker.vercel.app/t/abc12345`
2. **Usuário clica no link**
3. **Sistema coleta dados silenciosamente** (IP, localização, fingerprinting, etc.)
4. **Sistema redireciona para:** `https://meuapp.vercel.app` (sua URL de destino)

---

## 📝 Como Usar

### Passo 1: Criar Link de Rastreamento

No painel, você vai:

1. **Campo "URL de Destino"**: Coloque a URL do seu app na Vercel
   - Exemplo: `https://meuapp.vercel.app`
   - Ou: `https://meuapp.com.br` (se tiver domínio próprio)

2. **Marcar "Usar página camuflada"** (opcional mas recomendado)
   - Cria uma página que parece ser passxbox.com antes de redirecionar
   - Aumenta a taxa de cliques

3. **Clicar em "Gerar Link de Rastreamento"**

### Passo 2: Usar o Link Gerado

O sistema vai gerar um link como:
```
https://seu-tracker.vercel.app/t/abc12345
```

**Este é o link que você vai compartilhar/enviar!**

### Passo 3: Quando Alguém Clicar

1. Usuário clica no link de rastreamento
2. Sistema coleta TODOS os dados silenciosamente
3. Sistema redireciona automaticamente para seu app na Vercel
4. Usuário nem percebe que passou pelo tracker

---

## 🎯 Casos de Uso

### Caso 1: Rastrear Acessos ao Seu App

**URL de Destino:** `https://meuapp.vercel.app`

**Link Gerado:** `https://tracker.vercel.app/t/xyz789`

**Uso:** Enviar o link gerado para pessoas e rastrear quem acessou seu app

### Caso 2: Rastrear Link Específico

**URL de Destino:** `https://meuapp.vercel.app/pagina-especial`

**Link Gerado:** `https://tracker.vercel.app/t/abc123`

**Uso:** Rastrear quem acessou uma página específica do seu app

### Caso 3: Rastrear Campanha

**URL de Destino:** `https://meuapp.vercel.app/?campanha=promocao`

**Link Gerado:** `https://tracker.vercel.app/t/promo123`

**Uso:** Rastrear cliques de uma campanha específica

---

## 🔍 O Que É Coletado

Quando alguém clica no link de rastreamento, o sistema coleta:

### ✅ Automaticamente (Servidor):
- **IP Público**
- **Localização** (País, Estado, Cidade)
- **ISP** (Provedor de Internet)
- **Detecção de VPN/Proxy/Tor**
- **User-Agent completo**

### ✅ Silenciosamente (Cliente):
- **Fingerprinting** (Canvas, WebGL, Audio, Fonts)
- **Dados do Navegador** (Chrome, Firefox, etc)
- **Dados do Dispositivo** (Tela, CPU, Memória)
- **Comportamento** (Mouse, Clicks, Scroll)
- **Emails e Contas** (quando detectáveis)
- **Tokens de Autenticação** (quando em storage)

**Tudo isso SEM pedir nenhuma permissão!**

---

## 📊 Ver os Dados Coletados

1. Acesse o painel: `https://seu-tracker.vercel.app`
2. Clique no link criado na lista
3. Veja todos os dados coletados de cada clique
4. Exporte os dados em CSV se necessário

---

## 🚀 Deploy na Vercel

### Seu Tracker:
- Deploy em: `https://seu-tracker.vercel.app`
- Este é o painel onde você cria links e vê dados

### Seu App:
- Deploy em: `https://meuapp.vercel.app`
- Este é o destino final (URL de destino)

### Fluxo:
```
Usuário → seu-tracker.vercel.app/t/abc123 → Coleta Dados → meuapp.vercel.app
```

---

## 💡 Dicas

1. **Use página camuflada** para aumentar taxa de cliques
2. **Configure domínio próprio** para o tracker (mais confiável)
3. **Monitore os dados** regularmente no painel
4. **Exporte dados** em CSV para análise externa

---

## ❓ Perguntas Frequentes

### Q: Posso usar qualquer URL como destino?
**R:** Sim! Pode ser:
- Seu app na Vercel
- Qualquer site
- Link de download
- Link de vídeo
- Qualquer URL válida

### Q: O usuário vai perceber que está sendo rastreado?
**R:** Não! A coleta é 100% silenciosa e o redirecionamento é instantâneo (~1 segundo)

### Q: Preciso ter o tracker e o app no mesmo domínio?
**R:** Não! Podem ser domínios diferentes. O tracker só redireciona para a URL que você especificar.

### Q: Quantos links posso criar?
**R:** Quantos quiser! Cada link tem um ID único e rastreia separadamente.

---

## 🎉 Resumo

1. **URL de Destino** = Seu app na Vercel (ou qualquer URL)
2. **Link Gerado** = Link de rastreamento que você compartilha
3. **Quando clicado** = Coleta dados + Redireciona para destino
4. **Ver dados** = Acesse o painel e clique no link criado

**Simples assim!** 🚀
