# 🚀 Início Rápido - Bot VaiDarJogo

## ⚡ Execução em 3 Passos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Bot
```bash
npm run dev
```

### 3. Escanear QR Code
- Um QR Code aparecerá no terminal
- Escaneie com seu WhatsApp
- Envie "menu" para o bot

## 📱 Primeiro Uso

### Configurar Jogo
1. Envie `1` ou `configurar`
2. Siga os 7 passos:
   - Local do jogo
   - Nome da organização
   - Jogadores por time
   - Reservas por time
   - Número de times
   - Horário de início
   - Horário de fim

### Adicionar Jogadores
1. Envie `4` ou `incluir`
2. Escolha tipo: `1` (mensalista) ou `2` (avulso)
3. Preencha as informações solicitadas

### Sortear Times
1. Envie `8` ou `sorteio`
2. O bot distribuirá automaticamente os jogadores

## 🎯 Comandos Essenciais

| Comando | Função |
|---------|---------|
| `menu` | Menu principal |
| `1` | Configurar jogo |
| `4` | Incluir jogador |
| `8` | Sortear times |
| `5` | Ver mensalistas |
| `6` | Ver avulsos |

## ⚠️ Importante

- **Número Admin**: Por padrão `5513981645787`
- **Banco**: Criado automaticamente na primeira execução
- **Sessão**: Salva localmente para próximos usos
- **QR Code**: Aparece apenas na primeira vez

## 🆘 Problemas Comuns

### Bot não responde
- Verifique se o QR Code foi escaneado
- Confirme se o número está na lista de admins

### Erro de banco
- Delete o arquivo `vaidarjogo.db`
- Execute novamente

### Erro de autenticação
- Delete a pasta `sessions/`
- Escaneie o QR Code novamente

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no terminal
2. Consulte o README completo
3. Abra uma issue no projeto

---

**🎉 Pronto! Seu bot está funcionando!**
