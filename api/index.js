// Arquivo para Vercel Serverless Functions
// Exporta o app Express do server.js

const app = require('../server');

// Vercel espera um handler exportado
module.exports = app;
