# 🧪 GUIA DE TESTE - Link Tracker Avançado

## ✅ Status: Pronto para Teste

A ferramenta está configurada e rodando com **coleta 100% silenciosa** - sem pedir nenhuma permissão!

---

## 🚀 Como Testar

### 1. Iniciar o Servidor

```bash
npm start
```

O servidor iniciará em: **http://localhost:3000**

### 2. Acessar o Painel

Abra no navegador: **http://localhost:3000**

Você verá o painel de controle com:
- 📊 Estatísticas em tempo real
- 🔗 Criação de links de rastreamento
- 📋 Lista de todos os links criados

### 3. Criar um Link de Rastreamento

1. No campo **"URL de Destino"**, digite qualquer URL (ex: `https://google.com`)
2. Opcionalmente, marque **"Usar página camuflada (PassXbox)"** para usar a página de camuflagem
3. Clique em **"🚀 Gerar Link de Rastreamento"**
4. O link será gerado e exibido (ex: `http://localhost:3000/t/abc12345`)

### 4. Testar o Link Gerado

1. **Copie o link gerado**
2. **Abra em uma nova aba** (ou envie para alguém)
3. O link irá:
   - ✅ Coletar TODOS os dados silenciosamente (sem pedir permissão)
   - ✅ Coletar IP e localização automaticamente no servidor
   - ✅ Redirecionar para a URL de destino após ~1 segundo

### 5. Ver os Dados Coletados

1. Volte para o painel principal
2. Clique no link criado na lista
3. Você verá um modal com:
   - 📍 **IP e Localização** (coletados automaticamente)
   - 🌐 **Dados do Navegador**
   - 📱 **Dados do Dispositivo**
   - 🔍 **Fingerprinting completo**
   - 🎯 **Comportamento do usuário**
   - 📧 **Emails e contas detectadas**
   - 🔐 **Tokens de autenticação**
   - ⚠️ **Score de Risco**
   - 🛡️ **Detecção de VPN/Proxy/Tor**

---

## 📊 Dados Coletados Automaticamente

### ✅ No Servidor (Sem Pedir Nada):
- **IP Público** - Extraído automaticamente
- **Localização por IP**:
  - País, Estado, Cidade
  - Latitude/Longitude aproximadas
  - Timezone
  - ISP (Provedor de Internet)
  - Organização
  - ASN
- **Detecção de VPN/Proxy/Tor**
- **User-Agent completo** (parseado)

### ✅ No Cliente (Silencioso - Sem Pedir Nada):
- **Fingerprinting**:
  - Canvas Fingerprint
  - WebGL Fingerprint
  - Audio Fingerprint
  - Font Fingerprint
  - Composite Hash
- **Dados do Navegador**:
  - User-Agent completo
  - Navegador e versão
  - Sistema operacional
  - Idioma
  - Modo privado detectado
  - Automação/Bot detectado
- **Dados do Dispositivo**:
  - Resolução da tela
  - CPU cores
  - Memória
  - Timezone
- **Comportamento**:
  - Movimentos do mouse
  - Clicks
  - Scroll
  - Timing de teclas
  - Tempo na página
- **Storage**:
  - Todos os cookies
  - LocalStorage completo
  - SessionStorage completo
- **Emails e Contas**:
  - Emails encontrados em cookies/storage
  - Contas logadas detectadas (Google, Facebook, etc)
  - Tokens de autenticação
- **Performance e Timing**:
  - Tempo de carregamento
  - Uso de memória
  - Resource timing

---

## 🎯 Teste Completo

### Teste 1: Link Simples
1. Crie um link para `https://google.com`
2. Abra o link em uma nova aba
3. Verifique se redirecionou para Google
4. Volte ao painel e veja os dados coletados

### Teste 2: Link com Página Camuflada
1. Crie um link para `https://google.com` marcando "Usar página camuflada"
2. Abra o link - você verá a página PassXbox por ~1 segundo
3. Verifique se redirecionou para Google
4. Veja os dados coletados no painel

### Teste 3: Múltiplos Cliques
1. Crie um link
2. Abra o link várias vezes (de diferentes navegadores se possível)
3. Veja todos os cliques registrados no painel
4. Compare os dados coletados de cada clique

### Teste 4: Verificar Coleta Silenciosa
1. Abra o link gerado
2. **NÃO deve aparecer nenhum popup de permissão**
3. O link deve redirecionar normalmente
4. Todos os dados devem ser coletados silenciosamente

---

## 🔍 O Que Verificar

### ✅ Funcionamento Correto:
- [ ] Servidor inicia sem erros
- [ ] Painel carrega corretamente
- [ ] Links são criados com sucesso
- [ ] Link gerado redireciona corretamente
- [ ] Dados são coletados e salvos
- [ ] Modal mostra todos os dados coletados
- [ ] IP e localização aparecem corretamente
- [ ] Estatísticas são atualizadas

### ✅ Coleta Silenciosa:
- [ ] Nenhum popup de permissão aparece
- [ ] Geolocalização GPS não é solicitada
- [ ] Câmera não é solicitada
- [ ] Microfone não é solicitado
- [ ] Clipboard não é solicitado
- [ ] Dados são coletados mesmo assim

### ✅ Dados Coletados:
- [ ] IP aparece corretamente
- [ ] Localização (país/cidade) aparece
- [ ] User-Agent está parseado
- [ ] Fingerprints são gerados
- [ ] Comportamento é rastreado
- [ ] Emails são detectados (se houver)
- [ ] Contas são detectadas (se logadas)
- [ ] Score de risco é calculado

---

## 🐛 Solução de Problemas

### Servidor não inicia:
```bash
# Verificar se a porta 3000 está livre
netstat -ano | findstr :3000

# Instalar dependências
npm install

# Tentar novamente
npm start
```

### Dados não aparecem:
- Verifique o console do navegador (F12)
- Verifique se o banco de dados foi criado (`tracker.db`)
- Verifique os logs do servidor

### Link não redireciona:
- Verifique se a URL de destino é válida
- Verifique o console do navegador para erros
- Verifique se o `collector.js` está carregando

---

## 📝 Notas Importantes

1. **Coleta 100% Silenciosa**: Nenhuma permissão é solicitada
2. **IP e Localização**: Coletados automaticamente no servidor
3. **Redirecionamento Rápido**: ~1 segundo após o clique
4. **Dados Persistentes**: Todos os dados são salvos no banco SQLite
5. **Tempo Real**: Estatísticas atualizam a cada 30 segundos

---

## 🎉 Pronto para Uso!

A ferramenta está completamente funcional e pronta para rastrear links e coletar dados de forma silenciosa e automática!
