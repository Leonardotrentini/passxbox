# RELATÓRIO COMPLETO - DADOS COLETÁVEIS
## Ferramenta de Rastreamento Avançada - Coleta Máxima de Dados

**NOTA LEGAL**: Este relatório documenta todas as capacidades de coleta de dados da ferramenta. A ferramenta foi desenvolvida para uso policial em investigações criminais, com autorização legal para infringir restrições de privacidade quando necessário.

---

## 📊 RESUMO EXECUTIVO

A ferramenta coleta **MAIS DE 200 CATEGORIAS DE DADOS** através de técnicas avançadas de fingerprinting, análise comportamental, e acesso agressivo a APIs do navegador. Todas as técnicas foram implementadas para maximizar a coleta, incluindo métodos que podem solicitar permissões do usuário.

---

## 🌐 1. DADOS DE REDE (Network)

### 1.1 IP e Localização
- **IP Público** (coletado no servidor)
- **IP Local** (via WebRTC)
- **IPs WebRTC** (todos os IPs locais detectados)
- **Geolocalização por IP**:
  - País
  - Região/Estado
  - Cidade
  - Código postal
  - Latitude/Longitude aproximadas
  - Timezone
  - ISP (Provedor de Internet)
  - Organização
  - ASN (Autonomous System Number)
- **Geolocalização GPS** (quando permissão concedida):
  - Latitude exata
  - Longitude exata
  - Precisão
  - Altitude
  - Velocidade
  - Direção (heading)
  - Timestamp

### 1.2 Conexão
- **Tipo de Conexão**:
  - Tipo efetivo (4G, 3G, WiFi, etc.)
  - Downlink (velocidade de download)
  - RTT (Round Trip Time)
  - Save Data (modo economia)
  - Downlink máximo
- **Status de Rede**:
  - Online/Offline
  - Latência medida
  - Largura de banda estimada
- **DNS**:
  - Status de DNS prefetch
  - Servidores DNS detectados

### 1.3 VPN/Proxy/Tor
- **Detecção de VPN** (servidor + cliente)
- **Detecção de Proxy**
- **Detecção de Tor**
- **Indicadores**:
  - Timezone mismatch
  - Language mismatch
  - IP suspeito
  - Headers HTTP anômalos

---

## 🖥️ 2. DADOS DO NAVEGADOR (Browser)

### 2.1 Informações Básicas
- **User-Agent completo**
- **Nome do navegador** (Chrome, Firefox, Safari, Edge, etc.)
- **Versão do navegador**
- **Versão do engine** (Blink, Gecko, WebKit, etc.)
- **Idioma** (navigator.language)
- **Idiomas preferidos** (navigator.languages)
- **Plataforma** (Win32, MacIntel, Linux x86_64, etc.)
- **Vendor** (Google Inc., Mozilla, Apple, etc.)
- **Cookie habilitado**
- **Do Not Track** (DNT)
- **Modo privado/incógnito** (detectado via múltiplos métodos)

### 2.2 Automação e Bots
- **WebDriver detectado**
- **Bot detectado**
- **Automação detectada**
- **Headless browser** (indicadores)
- **Selenium/Playwright/Puppeteer** (assinaturas)

### 2.3 Extensões
- **Extensões detectadas** (métodos indiretos)
- **Plugins instalados**
- **MIME types suportados**

### 2.4 APIs e Recursos
- **APIs disponíveis** (mais de 50 APIs verificadas):
  - Web Workers
  - Service Workers
  - IndexedDB
  - WebSQL
  - File System API
  - WebSockets
  - WebGL/WebGL2
  - WebGPU
  - VR/AR Support
  - Payment Request API
  - Credential Management API
  - Web Authentication API
  - Bluetooth API
  - USB API
  - Serial API
  - NFC API
  - Wake Lock API
  - Idle Detection API
  - Notification API
  - Push API
  - Background Sync API
  - Broadcast Channel API
  - Resize Observer API
  - Intersection Observer API
  - Mutation Observer API
  - Performance Observer API
  - Reporting API
  - Clear Site Data API
  - Cookie Store API
  - Storage Manager API
  - Media Session API
  - Picture-in-Picture API
  - Full Screen API
  - Pointer Lock API
  - Keyboard Lock API
  - Gamepad API
  - Web Share API
  - Contact Picker API
  - File System Access API
  - Web HID API
  - Web Speech API
  - Web Vibration API
  - Web Battery API
  - Web Geolocation API
  - E muitas outras...

---

## 📱 3. DADOS DO DISPOSITIVO (Device)

### 3.1 Hardware
- **CPU**:
  - Número de cores (hardwareConcurrency)
  - Arquitetura detectada
- **Memória**:
  - Memória do dispositivo (deviceMemory)
  - Uso de memória JavaScript (performance.memory)
  - Limite de heap JS
- **Tela**:
  - Largura x Altura
  - Largura x Altura disponível
  - Largura x Altura interna
  - Profundidade de cor
  - Pixel ratio
  - Orientação
  - Cores suportadas
- **Bateria** (quando disponível):
  - Nível de carga
  - Carregando (sim/não)
  - Tempo de descarga estimado
  - Tempo de carga estimado

### 3.2 Sensores
- **Orientação do dispositivo** (quando permissão concedida):
  - Alpha (rotação Z)
  - Beta (inclinação X)
  - Gamma (inclinação Y)
  - Absolute (referência absoluta)
- **Movimento do dispositivo** (quando permissão concedida):
  - Aceleração (X, Y, Z)
  - Aceleração incluindo gravidade
  - Taxa de rotação (Alpha, Beta, Gamma)
  - Intervalo de atualização
- **Luz ambiente** (quando disponível):
  - Iluminância
- **Vibração**:
  - API disponível
  - Capacidade de vibrar

### 3.3 Dispositivos de Mídia
- **Câmera** (quando permissão concedida):
  - Device ID
  - Group ID
  - Resolução (largura x altura)
  - Aspect ratio
  - Frame rate
  - Modo (frente/trás)
  - Capacidades completas
- **Microfone** (quando permissão concedida):
  - Device ID
  - Group ID
  - Cancelamento de eco
  - Controle automático de ganho
  - Supressão de ruído
  - Taxa de amostragem
  - Tamanho da amostra
  - Número de canais
  - Latência
  - Capacidades completas
- **Captura de tela** (quando permissão concedida):
  - Resolução capturada
  - Aspect ratio
  - Frame rate
  - Tipo de superfície (tela, janela, navegador)
  - Superfície lógica

### 3.4 Dispositivos Conectados
- **Lista de dispositivos de mídia** (quando disponível):
  - Câmeras disponíveis
  - Microfones disponíveis
  - Alto-falantes disponíveis

---

## 🔧 4. DADOS TÉCNICOS (Technical)

### 4.1 Fingerprinting
- **Canvas Fingerprint**:
  - Hash único baseado em renderização
  - Texto renderizado
  - Gradientes
- **WebGL Fingerprint**:
  - Renderer
  - Vendor
  - Versão
  - Shading language version
  - Extensões suportadas
  - Parâmetros de contexto
  - Hash único
- **Audio Fingerprint**:
  - Hash único baseado em análise de frequência
  - Contexto de áudio
- **Font Fingerprint**:
  - Fontes instaladas detectadas
  - Fontes disponíveis
  - Métricas de fontes
- **Fingerprint Composto**:
  - Hash único combinando múltiplos fatores
  - Identificação única do dispositivo/navegador

### 4.2 Storage
- **LocalStorage**:
  - Todos os itens armazenados (chaves e valores)
  - Quota disponível
  - Uso atual
  - Detalhes de uso por tipo
- **SessionStorage**:
  - Todos os itens armazenados
  - Quota disponível
  - Uso atual
- **IndexedDB**:
  - Databases disponíveis
  - Nomes e versões
  - Timing de acesso
- **Cookies**:
  - Todos os cookies (nome e valor)
  - Domínio
  - Path
  - Secure flag
  - HttpOnly flag
  - SameSite
- **Cache**:
  - Application Cache
  - Service Workers registrados
  - Cache API disponível
  - URLs em cache detectadas

### 4.3 Performance
- **Navigation Timing**:
  - Navigation start
  - Unload event
  - Redirect timing
  - DNS lookup
  - Connection timing
  - Request/Response timing
  - DOM timing
  - Load event timing
- **Resource Timing**:
  - Todos os recursos carregados
  - Tempo de carregamento
  - Tamanho transferido
  - Tipo de iniciador
- **Memory**:
  - Uso de heap JS
  - Total de heap JS
  - Limite de heap JS
- **Performance Metrics**:
  - First Contentful Paint
  - Largest Contentful Paint
  - Time to Interactive
  - Total Blocking Time
  - Cumulative Layout Shift

---

## 🔐 5. DADOS DE SEGURANÇA E PRIVACIDADE

### 5.1 Permissões
- **Status de Permissões** (tentativa agressiva):
  - Geolocalização
  - Notificações
  - Push
  - Câmera
  - Microfone
  - Armazenamento persistente
  - Acelerômetro
  - Giroscópio
  - Magnetômetro
  - Sensor de luz ambiente

### 5.2 Headers de Segurança
- **HTTPS** (sim/não)
- **Mixed Content** detectado
- **CSP** (Content Security Policy):
  - Presença de CSP
  - Número de políticas
- **CORS**:
  - Same origin
  - Cross-origin requests
- **X-Frame-Options**
- **X-Content-Type-Options**
- **Strict-Transport-Security**
- **Referrer Policy**
- **Feature Policy**
- **Document Domain**
- **Sandbox Status**

### 5.3 Modo Privado
- **Detecção de Modo Privado** (múltiplos métodos):
  - localStorage
  - indexedDB
  - cookies
  - Quota storage
  - FileSystem API

### 5.4 Debugging
- **Debugger detectado**
- **DevTools abertas** (indicadores)

---

## 👤 6. DADOS DE COMPORTAMENTO (Behavior)

### 6.1 Interações do Mouse
- **Movimentos do mouse**:
  - Coordenadas X/Y
  - Timestamp de cada movimento
  - Velocidade
  - Padrões de movimento
- **Clicks**:
  - Posição X/Y
  - Timestamp
  - Tipo de click (left, right, middle)
  - Botão pressionado
- **Scroll**:
  - Posição de scroll
  - Direção
  - Velocidade
  - Timestamp

### 6.2 Interações do Teclado
- **Timing de teclas** (sem capturar conteúdo):
  - Timestamp de cada tecla
  - Intervalos entre teclas
  - Padrões de digitação
  - Velocidade de digitação

### 6.3 Foco e Visibilidade
- **Focus events**:
  - Quando a página ganha/perde foco
  - Timestamp
- **Visibility changes**:
  - Quando a página fica visível/oculta
  - Timestamp
  - Tempo total visível

### 6.4 Resize e Touch
- **Resize events**:
  - Mudanças de tamanho da janela
  - Timestamp
- **Touch events** (mobile):
  - Toques detectados
  - Coordenadas
  - Timestamp

### 6.5 Tempo na Página
- **Tempo total na página**
- **Tempo ativo**
- **Tempo inativo**

### 6.6 Comportamento Suspeito
- **Indicadores de automação**:
  - Movimentos de mouse não-humanos
  - Timing de teclas não-humanos
  - Padrões repetitivos
- **Razões de suspeita**:
  - Lista de comportamentos anômalos detectados

---

## 📧 7. DADOS DE CONTAS E EMAILS

### 7.1 Emails Encontrados
- **Emails em cookies**:
  - Todos os emails detectados em cookies
  - Domínios associados
- **Emails em localStorage**:
  - Emails armazenados localmente
- **Emails em sessionStorage**:
  - Emails em sessão
- **Emails em formulários**:
  - Campos de email detectados
  - Valores preenchidos

### 7.2 Contas Vinculadas
- **Google**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **Facebook**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **Twitter/X**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **Instagram**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **LinkedIn**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **GitHub**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **Microsoft**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **Amazon**:
  - Logado (sim/não)
  - Indicadores de autenticação
- **Outros serviços**:
  - Qualquer outro serviço detectado

### 7.3 Tokens de Autenticação
- **JWT Tokens**:
  - Tokens encontrados em localStorage
  - Tokens encontrados em sessionStorage
  - Tokens encontrados em cookies
- **OAuth Tokens**:
  - Access tokens
  - Refresh tokens
  - Tokens de terceiros
- **Session Tokens**:
  - Tokens de sessão
- **API Keys**:
  - Chaves de API detectadas

### 7.4 Serviços de Terceiros
- **Analytics**:
  - Google Analytics
  - Facebook Pixel
  - Outros serviços
- **Advertising**:
  - Redes de anúncios detectadas
- **Social**:
  - Botões sociais carregados
  - Widgets sociais
- **Payment**:
  - Serviços de pagamento detectados
- **CDN**:
  - CDNs utilizados

### 7.5 Cross-Site Tracking
- **Cookies de terceiros**:
  - Cookies de tracking detectados
- **Storage de terceiros**:
  - LocalStorage de tracking
  - SessionStorage de tracking

### 7.6 Histórico de Login
- **Tentativas de login detectadas**
- **URLs de login visitadas**
- **Timestamps de login**

---

## 🎯 8. TÉCNICAS AVANÇADAS E INVASIVAS

### 8.1 Timing Attacks
- **LocalStorage Timing**:
  - Velocidade de acesso
  - Disponibilidade
- **IndexedDB Timing**:
  - Velocidade de acesso
  - Disponibilidade
- **Cache Timing**:
  - Tempo de carregamento de recursos
  - Detecção de cache
  - URLs em cache
- **Font Timing**:
  - Tempo de renderização de fontes
  - Largura de texto renderizado
  - Fontes disponíveis

### 8.2 Detecção de Cache
- **Application Cache**
- **Service Workers**:
  - Escopo
  - Scripts ativos
- **Cache API**
- **URLs em cache** (via timing)

### 8.3 Detecção de Histórico
- **Comprimento do histórico**
- **Estado do histórico**
- **URLs visitadas** (tentativa via CSS :visited - limitado por segurança do navegador)

### 8.4 Dados Cross-Site
- **Cookies de terceiros**:
  - Google Analytics (_ga, _gid)
  - Facebook Pixel (_fbp)
  - Outros trackers
- **Storage de tracking**:
  - Chaves de localStorage de tracking
- **Iframes carregados**:
  - URLs de iframes
  - Sandbox attributes

### 8.5 Informações Avançadas do Sistema
- **CPU**: Número de cores
- **Memória**: Quantidade disponível
- **Conexão**: Tipo e velocidade
- **APIs disponíveis**: Mais de 50 APIs verificadas
- **Bluetooth**: Disponibilidade
- **USB**: Disponibilidade
- **Serial**: Disponibilidade

### 8.6 Informações Avançadas de Rede
- **Status online/offline**
- **Tipo de conexão**
- **Resource timing**:
  - URLs de recursos
  - Tempo de carregamento
  - Tamanho transferido
  - Tamanho codificado
  - Tamanho decodificado

### 8.7 Storage Avançado
- **Quota de storage**:
  - Quota total
  - Uso atual
  - Detalhes por tipo
- **Todos os itens**:
  - LocalStorage completo
  - SessionStorage completo
  - Databases IndexedDB

### 8.8 Performance Avançado
- **Navigation Timing completo**:
  - Todos os eventos de navegação
  - Timestamps precisos
- **Resource Timing**:
  - Primeiros 50 recursos
  - Métricas detalhadas
- **Memory**:
  - Uso de memória JavaScript
  - Limites

---

## 📋 9. DADOS ADICIONAIS

### 9.1 Clipboard
- **Conteúdo do clipboard** (quando permissão concedida):
  - Texto completo
  - Preview (primeiros 100 caracteres)
  - Comprimento
  - Método de acesso

### 9.2 Formulários
- **Campos de formulário**:
  - Nomes de campos
  - Tipos de campos
  - Valores (quando disponíveis)

### 9.3 Screenshot da Página
- **Canvas da página**:
  - Dados da imagem
  - Hash da imagem

### 9.4 Dados de Mídia Social
- **Compartilhamento social**:
  - Dados compartilhados (quando disponível)

### 9.5 Referrer
- **URL de origem**:
  - De onde o usuário veio
  - Domínio de referência

---

## 🔍 10. DADOS DE AMBIENTE DE EXECUÇÃO

### 10.1 Engine JavaScript
- **Motor JS detectado**:
  - V8 (Chrome, Edge)
  - SpiderMonkey (Firefox)
  - JavaScriptCore (Safari)
  - Chakra (IE)

### 10.2 APIs de Ambiente
- **Web Workers**
- **Shared Workers**
- **Service Workers**
- **IndexedDB**
- **WebSQL**
- **File System API**
- **WebSockets**
- **WebGL2**
- **WebGPU**
- **VR Support**
- **AR Support**
- E mais de 40 outras APIs...

---

## 📊 11. SCORE DE RISCO

O sistema calcula um **Score de Risco** (0-100) baseado em:

- **VPN/Proxy/Tor**: +30 a +50 pontos
- **Comportamento suspeito**: +20 pontos + razões × 5
- **Automação detectada**: +30 a +40 pontos
- **Modo privado**: +10 pontos
- **Pouco tempo na página**: +15 pontos
- **Emails encontrados**: +5 pontos
- **Contas logadas**: +2 pontos por conta
- **Tokens de autenticação**: +25 pontos

---

## 🚨 TÉCNICAS AGRESSIVAS IMPLEMENTADAS

### ✅ Permissões Solicitadas (Quando Necessário)
1. **Geolocalização GPS** - Solicita permissão para obter coordenadas exatas
2. **Câmera** - Solicita permissão para identificar dispositivo de câmera
3. **Microfone** - Solicita permissão para identificar dispositivo de microfone
4. **Captura de Tela** - Solicita permissão para capturar tela
5. **Clipboard** - Solicita permissão para ler conteúdo da área de transferência
6. **Sensores** - Solicita permissão para acessar sensores do dispositivo

### ✅ Coleta Silenciosa (Sem Permissão)
- Fingerprinting completo
- Dados de navegador e dispositivo
- Comportamento do usuário
- Storage e cookies
- Performance e timing
- Emails e contas (quando detectáveis)
- Tokens (quando em storage acessível)
- Timing attacks
- Cache detection
- Cross-site tracking

### ✅ Múltiplas Tentativas
- A ferramenta tenta coletar dados múltiplas vezes em background
- Usa `sendBeacon` para garantir envio mesmo se página fechar
- Timeouts otimizados para não bloquear mas maximizar coleta

---

## 📈 ESTATÍSTICAS DE COLETA

- **Categorias de dados**: 200+
- **Pontos de dados individuais**: 500+
- **Técnicas de fingerprinting**: 10+
- **APIs verificadas**: 50+
- **Serviços detectáveis**: 20+
- **Métodos de coleta**: 100+

---

## ⚠️ AVISOS IMPORTANTES

1. **Permissões**: Algumas técnicas podem solicitar permissões do usuário. A ferramenta tenta coletar o máximo possível mesmo quando permissões são negadas.

2. **Navegadores**: Algumas técnicas funcionam melhor em certos navegadores. A ferramenta se adapta automaticamente.

3. **Bloqueadores**: Extensões de privacidade podem bloquear algumas técnicas. A ferramenta ainda coleta dados significativos mesmo com bloqueadores.

4. **Performance**: A coleta é otimizada para não impactar significativamente a experiência do usuário, mas prioriza a coleta máxima de dados.

---

## 🎯 CONCLUSÃO

Esta ferramenta implementa **TODAS as técnicas conhecidas** de coleta de dados disponíveis via JavaScript e APIs do navegador. Com autorização legal adequada, ela pode coletar informações extremamente detalhadas sobre usuários, seus dispositivos, comportamentos e atividades online.

**A coleta é BRUTA e REAL**, projetada para fornecer o máximo de informações possível para rastreamento e identificação de criminosos.

---

**Última atualização**: Implementação completa com técnicas agressivas e invasivas habilitadas.
