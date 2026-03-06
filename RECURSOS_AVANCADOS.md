# Recursos Avançados de Coleta de Dados

## 📊 Dados Coletados (Lista Completa)

### 🔴 Dados de Rede e IP
- **IP Address** (IPv4/IPv6)
- **ISP** (Provedor de Internet)
- **ASN** (Autonomous System Number)
- **País, Cidade, Estado/Região**
- **Coordenadas Geográficas** (aproximadas)
- **Timezone**
- **Detecção de VPN/Proxy/Tor** (múltiplas APIs)
- **IPs Locais via WebRTC** (LAN)
- **Tipo de Conexão** (móvel, banda larga)
- **Velocidade da Conexão**

### 🌐 Dados do Navegador
- **User-Agent Completo**
- **Navegador e Versão** (Chrome, Firefox, Safari, Edge)
- **Sistema Operacional** (Windows, macOS, Linux, iOS, Android)
- **Versão do SO**
- **Engine de Renderização** (Webkit, Gecko, Blink)
- **Idiomas Configurados**
- **Cookies Habilitados**
- **JavaScript Habilitado**
- **Do Not Track (DNT)**
- **Modo Privado/Incógnito**
- **Extensões Detectadas** (AdBlock, Privacy)
- **Automação/Bot Detectado**

### 📱 Dados do Dispositivo
- **Tipo** (desktop, tablet, celular, smart TV)
- **Marca e Modelo** (quando disponível)
- **Resolução de Tela**
- **Resolução Disponível** (sem barras de tarefa)
- **Profundidade de Cor**
- **Orientação da Tela** (portrait/landscape)
- **Touch Screen** (sim/não)
- **Número de Pontos de Touch**
- **Viewport Size**
- **Hardware Concurrency** (núcleos de CPU)
- **Device Memory** (RAM disponível)

### 🔧 Dados Técnicos
- **Plugins Instalados** (lista completa)
- **MIME Types Suportados**
- **WebGL Info** (vendor, renderer, versão)
- **WebGL Debug Info** (GPU real)
- **Canvas Fingerprinting**
- **Audio Fingerprinting**
- **Fonts Instaladas** (detecção)
- **Timezone e Offset**
- **Horário Local**
- **Java Instalado**
- **Flash Instalado** (quando disponível)

### 🎯 Dados de Comportamento (TEMPO REAL)
- **Movimentos do Mouse** (últimos 50)
- **Cliques** (posição, elemento clicado)
- **Scroll** (posição, velocidade)
- **Keystrokes** (timing, não conteúdo)
- **Eventos de Foco** (focus/blur)
- **Mudanças de Visibilidade** (tab switching)
- **Redimensionamento da Janela**
- **Eventos Touch** (mobile)
- **Tempo na Página**
- **Análise de Comportamento Suspeito**

### 📈 Dados de Performance
- **Tempo de Carregamento** (DNS, TCP, resposta)
- **Tempo de Renderização**
- **Uso de Memória** (JS Heap)
- **Storage Info** (quota, uso)
- **Network Timing** (detalhado)

### 🔐 Dados de Segurança
- **VPN/Proxy Detectado**
- **Tor Detectado**
- **Score de Risco** (0-100)
- **Nível de Risco** (LOW/MEDIUM/HIGH)
- **Headers de Segurança**
- **Mixed Content**
- **CORS Info**
- **Content Security Policy**

### 📍 Dados de Localização
- **Geolocalização por IP** (servidor)
- **GPS** (se permitido pelo usuário)
- **Precisão**
- **Altitude**
- **Velocidade** (se em movimento)
- **Heading** (direção)

### 💾 Dados de Armazenamento
- **LocalStorage** (todos os itens)
- **SessionStorage** (todos os itens)
- **Cookies** (todos os cookies)
- **IndexedDB** (quando disponível)

### 🎥 Dados de Mídia
- **Dispositivos de Mídia** (câmera, microfone)
- **Permissões** (status de cada permissão)
- **Bateria** (nível, carregando)
- **Vibração** (disponível)
- **Orientação do Dispositivo** (alpha, beta, gamma)
- **Movimento do Dispositivo** (aceleração)
- **Iluminação Ambiente**

### 🔗 Dados de Acesso
- **URL Completa**
- **Referrer** (página de origem)
- **Protocolo**
- **Host e Hostname**
- **Pathname**
- **Query String**
- **Hash**
- **Histórico de Navegação** (length)

### 📱 Dados de Redes Sociais
- **Referrer de Rede Social**
- **Plataforma Detectada** (Facebook, Twitter, etc)
- **Dados de Compartilhamento**
- **Dados de Embed** (se iframe)

### 🖼️ Dados Visuais
- **Screenshot da Página** (metadados)
- **Dimensões da Página**
- **Scroll Dimensions**

### 📋 Dados de Formulários
- **Formulários na Página**
- **Campos Detectados**
- **Tipos de Campos**
- **Valores Preenchidos** (se houver)

### 🔍 Fingerprinting Avançado
- **Canvas Fingerprint**
- **WebGL Fingerprint**
- **Audio Fingerprint**
- **Fonts Fingerprint**
- **Composite Fingerprint**
- **Hash Único** (baseado em múltiplas características)

### 📊 Headers HTTP
- **Accept**
- **Accept-Language**
- **Accept-Encoding**
- **User-Agent**
- **Referer**
- **Origin**
- **Sec-Fetch-*** (headers modernos)
- **X-Forwarded-For**
- **X-Real-IP**

## 🚨 Análise de Risco

O sistema calcula um **Score de Risco** (0-100) baseado em:

- **VPN/Proxy**: +30 pontos
- **Tor**: +50 pontos
- **Comportamento Suspeito**: +20 pontos
- **Automação Detectada**: +40 pontos
- **Bot Detectado**: +30 pontos
- **Modo Privado**: +10 pontos
- **Pouco Tempo na Página**: +15 pontos

**Níveis de Risco:**
- **LOW**: 0-39 pontos
- **MEDIUM**: 40-69 pontos
- **HIGH**: 70-100 pontos

## 🔒 Detecção de VPN/Proxy

O sistema usa múltiplas APIs para detectar:
- **ipapi.co** - Detecção básica
- **ip-api.com** - Detecção avançada
- **Análise de padrões** - IPs conhecidos

## 📈 APIs Disponíveis

### Endpoints Principais
- `POST /api/create-link` - Criar link de rastreamento
- `POST /api/track/:linkId` - Coletar dados
- `GET /api/link/:linkId` - Ver dados de um link
- `GET /api/links` - Listar todos os links
- `GET /api/stats` - Estatísticas gerais
- `GET /api/clicks-by-ip/:ip` - Buscar cliques por IP
- `GET /api/export/:linkId` - Exportar dados em CSV

## 🎯 Casos de Uso para Polícia

1. **Rastreamento de Golpes**: Identificar IPs, localização e comportamento
2. **Análise de Padrões**: Agrupar cliques por IP para identificar padrões
3. **Detecção de Bots**: Identificar automação em golpes
4. **Geolocalização**: Localizar suspeitos via GPS (se permitido)
5. **Análise de Risco**: Priorizar investigações baseado em score
6. **Exportação de Dados**: Gerar relatórios em CSV para análise

## ⚠️ Limitações Legais

- Alguns dados requerem **permissão explícita** do usuário
- Dados de GPS aparecem **pedido de permissão**
- Dados de clipboard podem ser **bloqueados**
- Alguns navegadores **limitam APIs** por segurança
- Extensões de privacidade podem **bloquear coleta**

## 🔧 Melhorias Futuras

- Integração com APIs de geolocalização mais precisas
- Machine Learning para detecção de padrões
- Análise de imagens (se screenshot completo disponível)
- Integração com bancos de dados de IPs suspeitos
- Alertas em tempo real para IPs de alto risco
