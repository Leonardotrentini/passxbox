// Arquivo para Vercel Serverless Functions
const express = require('express');
const app = express();

// Importar todas as rotas do server.js
// Por enquanto, vamos criar uma versão simplificada para Vercel

// Nota: SQLite pode ter limitações na Vercel (serverless)
// Considere usar um banco de dados externo para produção

app.use(express.json());
app.use(express.static('public'));

// Redirecionar para o server principal
// Na Vercel, vamos usar uma abordagem diferente
module.exports = require('../server');
