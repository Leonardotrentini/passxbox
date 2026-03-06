# Link Tracker Avançado

Ferramenta completa de rastreamento de links que coleta dados extensivos sobre usuários que clicam nos links gerados.

## 🚀 Funcionalidades

### Dados Coletados

- **Dados de Rede**: IP, ISP, ASN, País, Cidade, Coordenadas geográficas
- **Dados do Navegador**: User-Agent completo, versão, sistema operacional
- **Dados do Dispositivo**: Tipo, resolução de tela, orientação, suporte a touch
- **Dados Técnicos**: Plugins, WebGL, Canvas fingerprinting, timezone
- **Dados de Acesso**: URL, referrer, timestamp, fuso horário
- **Dados de Comportamento**: Tempo de carregamento, performance
- **Dados Adicionais**: Bateria, dispositivos de mídia, permissões, geolocalização
- **Fingerprinting**: Canvas, WebGL, Audio, Fonts

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

3. Acesse `http://localhost:3000` no navegador

## 🎯 Como Usar

1. **Criar Link de Rastreamento**:
   - Acesse a página inicial
   - Cole a URL de destino
   - Clique em "Gerar Link de Rastreamento"
   - Copie o link gerado (formato: `http://localhost:3000/t/XXXXX`)

2. **Visualizar Dados Coletados**:
   - Na lista de links criados, clique em qualquer link
   - Visualize os dados coletados de cada clique
   - Veja resumo ou dados brutos completos

## 📊 Estrutura do Projeto

```
.
├── server.js          # Servidor Express com APIs
├── package.json       # Dependências do projeto
├── tracker.db         # Banco de dados SQLite (criado automaticamente)
└── public/
    ├── index.html     # Interface principal
    └── collector.js   # Script de coleta de dados avançado
```

## 🔧 APIs Disponíveis

- `POST /api/create-link` - Criar novo link de rastreamento
- `POST /api/track/:linkId` - Coletar dados de um clique
- `GET /api/link/:linkId` - Obter dados de um link específico
- `GET /api/links` - Listar todos os links criados
- `GET /t/:linkId` - Página de rastreamento (coleta dados e redireciona)

## ⚠️ Avisos Legais

Esta ferramenta é fornecida apenas para fins educacionais e de pesquisa. O uso desta ferramenta deve estar em conformidade com:

- Leis de privacidade locais (LGPD no Brasil, GDPR na Europa)
- Termos de serviço dos sites visitados
- Políticas de privacidade

**IMPORTANTE**: Sempre obtenha consentimento explícito dos usuários antes de coletar dados pessoais. O uso não autorizado desta ferramenta pode violar leis de privacidade e segurança.

## 🔒 Segurança

- Dados são armazenados localmente em SQLite
- Não há autenticação por padrão (adicione se necessário)
- Use HTTPS em produção
- Implemente rate limiting para prevenir abuso

## 📝 Notas Técnicas

- Alguns dados requerem permissões explícitas do usuário (geolocalização, câmera, microfone)
- Canvas fingerprinting pode ser bloqueado por extensões de privacidade
- Dados de IP podem ser mascarados por VPNs/proxies
- Alguns navegadores limitam acesso a certas APIs por questões de segurança

## 🛠️ Tecnologias Utilizadas

- Node.js + Express
- SQLite3
- JavaScript (ES6+)
- HTML5 + CSS3
- APIs do navegador (WebGL, Canvas, Battery, Geolocation, etc.)
