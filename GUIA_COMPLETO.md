# 🔍 Guia Completo - Link Tracker Avançado para Investigação Policial

## 📋 Visão Geral

Esta ferramenta foi desenvolvida especificamente para **investigações policiais** de golpes e fraudes online. Ela coleta o **máximo de dados possíveis** sobre quem clica em links suspeitos, fornecendo informações detalhadas para rastreamento e identificação.

## 🚀 Instalação Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor
npm start

# 3. Acessar no navegador
# http://localhost:3000
```

## 📊 Dados Coletados (Lista Completa)

### 🔴 Dados de Rede e IP
- ✅ IP Address (IPv4/IPv6) - **SEMPRE COLETADO**
- ✅ ISP (Provedor de Internet)
- ✅ ASN (Autonomous System Number)
- ✅ País, Cidade, Estado/Região
- ✅ Coordenadas Geográficas (aproximadas)
- ✅ Timezone
- ✅ **Detecção de VPN/Proxy/Tor** (múltiplas APIs)
- ✅ **IPs Locais via WebRTC** (LAN)
- ✅ Tipo de Conexão
- ✅ Velocidade da Conexão

### 🌐 Dados do Navegador
- ✅ User-Agent Completo
- ✅ Navegador e Versão (Chrome, Firefox, Safari, Edge)
- ✅ Sistema Operacional (Windows, macOS, Linux, iOS, Android)
- ✅ Versão do SO
- ✅ Engine de Renderização
- ✅ Idiomas Configurados
- ✅ Cookies Habilitados
- ✅ JavaScript Habilitado
- ✅ Do Not Track (DNT)
- ✅ **Modo Privado/Incógnito** (detectado)
- ✅ **Extensões Detectadas** (AdBlock, Privacy)
- ✅ **Automação/Bot Detectado**

### 📱 Dados do Dispositivo
- ✅ Tipo (desktop, tablet, celular)
- ✅ Marca e Modelo (quando disponível)
- ✅ Resolução de Tela
- ✅ Profundidade de Cor
- ✅ Orientação da Tela
- ✅ Touch Screen
- ✅ Viewport Size
- ✅ Hardware Concurrency (CPU cores)
- ✅ Device Memory (RAM)

### 🔧 Dados Técnicos
- ✅ Plugins Instalados
- ✅ MIME Types
- ✅ **WebGL Info** (GPU real)
- ✅ **Canvas Fingerprinting**
- ✅ **Audio Fingerprinting**
- ✅ Fonts Instaladas
- ✅ Timezone
- ✅ Java/Flash

### 🎯 Dados de Comportamento (TEMPO REAL)
- ✅ **Movimentos do Mouse** (últimos 50)
- ✅ **Cliques** (posição, elemento)
- ✅ **Scroll** (posição, velocidade)
- ✅ **Keystrokes** (timing)
- ✅ Eventos de Foco
- ✅ Mudanças de Visibilidade
- ✅ Redimensionamento
- ✅ Eventos Touch
- ✅ Tempo na Página
- ✅ **Análise de Comportamento Suspeito**

### 📈 Dados de Performance
- ✅ Tempo de Carregamento (DNS, TCP, resposta)
- ✅ Tempo de Renderização
- ✅ Uso de Memória
- ✅ Storage Info

### 🔐 Dados de Segurança
- ✅ **VPN/Proxy Detectado**
- ✅ **Tor Detectado**
- ✅ **Score de Risco** (0-100)
- ✅ **Nível de Risco** (LOW/MEDIUM/HIGH)
- ✅ Headers de Segurança
- ✅ Mixed Content
- ✅ CORS Info

### 📍 Dados de Localização
- ✅ Geolocalização por IP (servidor)
- ✅ **GPS** (se permitido pelo usuário)
- ✅ Precisão
- ✅ Altitude
- ✅ Velocidade (se em movimento)

### 💾 Dados de Armazenamento
- ✅ LocalStorage (todos os itens)
- ✅ SessionStorage
- ✅ Cookies (todos)
- ✅ IndexedDB

### 🎥 Dados de Mídia
- ✅ Dispositivos de Mídia (câmera, microfone)
- ✅ Permissões (status)
- ✅ Bateria (nível, carregando)
- ✅ Vibração
- ✅ Orientação do Dispositivo
- ✅ Movimento do Dispositivo
- ✅ Iluminação Ambiente

### 🔗 Dados de Acesso
- ✅ URL Completa
- ✅ Referrer (página de origem)
- ✅ Protocolo, Host, Pathname
- ✅ Query String, Hash
- ✅ Histórico de Navegação

### 📱 Dados de Redes Sociais
- ✅ Referrer de Rede Social
- ✅ Plataforma Detectada
- ✅ Dados de Compartilhamento
- ✅ Dados de Embed

### 🔍 Fingerprinting Avançado
- ✅ Canvas Fingerprint
- ✅ WebGL Fingerprint
- ✅ Audio Fingerprint
- ✅ Fonts Fingerprint
- ✅ Composite Fingerprint
- ✅ Hash Único

## 🚨 Sistema de Análise de Risco

### Score de Risco (0-100)

O sistema calcula automaticamente um score baseado em:

| Fator | Pontos |
|-------|--------|
| VPN Detectada | +30 |
| Proxy Detectado | +30 |
| Tor Detectado | +50 |
| Comportamento Suspeito | +20 |
| Automação Detectada | +40 |
| Bot Detectado | +30 |
| Modo Privado | +10 |
| Pouco Tempo na Página | +15 |

### Níveis de Risco

- **LOW (0-39)**: Risco baixo, comportamento normal
- **MEDIUM (40-69)**: Risco médio, atenção necessária
- **HIGH (70-100)**: Risco alto, investigação prioritária

## 🔒 Detecção de VPN/Proxy

O sistema usa **múltiplas APIs** para detectar:

1. **ipapi.co** - Detecção básica de VPN/Proxy
2. **ip-api.com** - Detecção avançada com confiança
3. **Análise de padrões** - IPs conhecidos de datacenters

## 📡 APIs Disponíveis

### Endpoints Principais

```
POST /api/create-link
Cria um novo link de rastreamento

Body: { "url": "https://exemplo.com" }
Response: { "linkId": "abc123", "trackingUrl": "http://...", "originalUrl": "..." }
```

```
POST /api/track/:linkId
Coleta dados de um clique (chamado automaticamente)

Body: { ...dados coletados... }
Response: { "redirectUrl": "...", "riskScore": 45, "riskLevel": "MEDIUM" }
```

```
GET /api/link/:linkId
Obter todos os dados coletados de um link

Response: {
  "link": { ... },
  "clicks": [
    {
      "id": 1,
      "ip_address": "...",
      "timestamp": "...",
      "risk_score": 45,
      "data": { ...dados completos... },
      "vpn_proxy": { ... }
    }
  ]
}
```

```
GET /api/links
Listar todos os links criados

Response: [ { "id": "...", "original_url": "...", "click_count": 5, ... } ]
```

```
GET /api/stats
Estatísticas gerais

Response: {
  "totalLinks": 10,
  "totalClicks": 50,
  "uniqueIPs": 30,
  "highRiskClicks": 5
}
```

```
GET /api/clicks-by-ip/:ip
Buscar todos os cliques de um IP específico

Response: [ { ...clique... } ]
```

```
GET /api/export/:linkId
Exportar dados em CSV

Response: arquivo CSV para download
```

## 🎯 Casos de Uso para Polícia

### 1. Rastreamento de Golpes
- Gerar link suspeito e compartilhar com vítima
- Coletar IP, localização e comportamento
- Identificar padrões de golpistas

### 2. Análise de Padrões
- Agrupar cliques por IP
- Identificar múltiplas vítimas do mesmo golpista
- Rastrear evolução do golpe

### 3. Detecção de Bots
- Identificar automação em golpes
- Detectar comportamento não-humano
- Priorizar investigações reais

### 4. Geolocalização
- Obter coordenadas GPS (se permitido)
- Localizar suspeitos em tempo real
- Mapear áreas de atuação

### 5. Análise de Risco
- Priorizar investigações baseado em score
- Identificar golpistas experientes (alto risco)
- Alertar sobre padrões suspeitos

### 6. Exportação de Dados
- Gerar relatórios em CSV
- Integrar com sistemas policiais
- Criar evidências digitais

## 📝 Exemplo de Uso

### 1. Criar Link de Rastreamento

```javascript
// Via interface web ou API
POST /api/create-link
{
  "url": "https://site-suspeito.com/golpe"
}

// Resposta
{
  "linkId": "abc12345",
  "trackingUrl": "http://localhost:3000/t/abc12345",
  "originalUrl": "https://site-suspeito.com/golpe"
}
```

### 2. Compartilhar Link

Compartilhe o `trackingUrl` com a vítima ou publique em redes sociais. Quando alguém clicar, os dados serão coletados automaticamente.

### 3. Visualizar Dados

```javascript
GET /api/link/abc12345

// Retorna todos os cliques com dados completos
```

### 4. Analisar Risco

Cada clique inclui:
- Score de risco (0-100)
- Nível de risco (LOW/MEDIUM/HIGH)
- Detecção de VPN/Proxy/Tor
- Análise de comportamento suspeito

## ⚠️ Limitações e Considerações

### Dados que Requerem Permissão
- **GPS**: Aparece pedido de permissão ao usuário
- **Câmera/Microfone**: Requer permissão explícita
- **Clipboard**: Pode ser bloqueado

### Dados Limitados por Segurança
- **Screenshot completo**: Requer biblioteca externa (html2canvas)
- **Histórico de navegação**: Limitado por CORS
- **MAC Address**: Não acessível via JavaScript
- **Processos do sistema**: Não acessível

### Bloqueios Possíveis
- **Extensões de privacidade**: Podem bloquear coleta
- **Modo privado**: Alguns dados não disponíveis
- **VPN/Proxy**: Pode mascarar IP real
- **Tor**: Anonimiza completamente

## 🔧 Melhorias Futuras

- [ ] Integração com APIs de geolocalização mais precisas
- [ ] Machine Learning para detecção de padrões
- [ ] Screenshot completo da página
- [ ] Integração com bancos de dados de IPs suspeitos
- [ ] Alertas em tempo real para IPs de alto risco
- [ ] Dashboard avançado com gráficos
- [ ] Exportação em múltiplos formatos (JSON, PDF)
- [ ] API de webhooks para integração

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- `README.md` - Instalação e uso básico
- `RECURSOS_AVANCADOS.md` - Lista completa de recursos
- Código-fonte comentado

## ⚖️ Avisos Legais

**IMPORTANTE**: Esta ferramenta deve ser usada apenas para:
- ✅ Investigações policiais legítimas
- ✅ Casos com autorização judicial
- ✅ Conformidade com LGPD/GDPR
- ✅ Consentimento quando necessário

**NÃO USE** para:
- ❌ Vigilância não autorizada
- ❌ Coleta de dados sem consentimento
- ❌ Violação de privacidade
- ❌ Fins ilegais

Sempre consulte a legislação local antes de usar esta ferramenta.
