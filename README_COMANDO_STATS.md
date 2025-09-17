# 📊 Comando de Estatísticas - VaiDarJogo Motor

## 🎯 Funcionalidades

O comando de estatísticas permite visualizar informações importantes sobre o funcionamento do motor de notificações:

### 1. **Próxima Notificação** 🔔
- Mostra quando será a próxima notificação agendada
- Exibe detalhes do jogo (nome, data, local)
- Calcula o tempo restante até a notificação
- Indica quantas horas antes do jogo a notificação será enviada

### 2. **Notificações Enviadas na Última Hora** 📤
- Conta quantas notificações foram enviadas na última hora
- Agrupa por jogo para facilitar a visualização
- Mostra as últimas 3 notificações enviadas com horário

### 3. **Notificações Não Lidas** 📬
- Lista todas as notificações que ainda não foram lidas pelos destinatários
- Agrupa por jogo
- Mostra as 5 notificações mais antigas não lidas
- Exibe há quanto tempo cada notificação foi enviada

## 🚀 Como Usar

### Opção 1: Comando Direto (Recomendado)
```bash
node comando_stats.js
```

### Opção 2: Comando com Parâmetro
```bash
node motor_com_stats.js --stats
# ou
node motor_com_stats.js -s
```

### Opção 3: Motor Completo + Estatísticas
```bash
node motor_com_stats.js
```

## 📋 Exemplo de Saída

```
📊 ===== ESTATÍSTICAS DO MOTOR VAIDARJOGO =====

🔔 1. PRÓXIMA NOTIFICAÇÃO:
   🎯 Jogo: Pelada do Bairro
   📅 Data: 15/01/2024 às 19:00
   📍 Local: Campo Municipal
   ⏰ Notificação em: 15/01/2024 18:00
   ⏳ Faltam: 45 minutos (1h antes do jogo)

📤 2. NOTIFICAÇÕES ENVIADAS NA ÚLTIMA HORA:
   📊 Total: 3 notificações
   🏈 Pelada do Bairro: 2 notificação(ões)
   🏈 Futebol da Galera: 1 notificação(ões)

   📋 Últimas notificações:
   1. [19:30:15] Pelada do Bairro - Lembrete: Pelada do Bairro
   2. [19:25:42] Futebol da Galera - Lembrete: Futebol da Galera
   3. [19:20:18] Pelada do Bairro - Lembrete: Pelada do Bairro

📬 3. NOTIFICAÇÕES NÃO LIDAS:
   📊 Total: 5 notificações não lidas
   🏈 Pelada do Bairro: 3 notificação(ões) não lida(s)
   🏈 Futebol da Galera: 2 notificação(ões) não lida(s)

   📋 Notificações não lidas (mais antigas):
   1. [14/01 18:00] Pelada do Bairro - Lembrete: Pelada do Bairro (há 2 horas)
   2. [14/01 17:30] Futebol da Galera - Lembrete: Futebol da Galera (há 2 horas)
   3. [14/01 16:00] Pelada do Bairro - Lembrete: Pelada do Bairro (há 4 horas)

📊 ===== FIM DAS ESTATÍSTICAS =====
```

## 🔧 Requisitos

- Node.js instalado
- Dependências do projeto instaladas (`npm install`)
- Conexão com o Supabase (mesmas configurações do Flutter)

## 📁 Arquivos Relacionados

- `comando_stats.js` - Script principal para executar apenas estatísticas
- `motor_com_stats.js` - Motor completo com funcionalidade de estatísticas
- `motor_final.js` - Motor básico sem estatísticas

## 🎯 Casos de Uso

### Monitoramento Diário
```bash
# Executar a cada hora para monitorar o status
node comando_stats.js
```

### Verificação Rápida
```bash
# Verificar se há notificações pendentes
node comando_stats.js | grep "PRÓXIMA NOTIFICAÇÃO"
```

### Análise de Performance
```bash
# Verificar quantas notificações foram enviadas
node comando_stats.js | grep "Total:"
```

## 🚨 Tratamento de Erros

O comando trata automaticamente:
- ✅ Conexão com Supabase indisponível
- ✅ Tabelas vazias ou sem dados
- ✅ Erros de parsing de JSON
- ✅ Sessões sem configurações de notificação

## 📊 Dados Analisados

### Tabelas Consultadas:
- `game_sessions` - Sessões de jogo agendadas
- `games` - Informações dos jogos
- `notification_configs` - Configurações de notificação
- `notifications` - Log de notificações enviadas

### Filtros Aplicados:
- ✅ Apenas sessões com status 'scheduled'
- ✅ Apenas configurações ativas (`is_active = true`)
- ✅ Apenas sessões futuras (data >= hoje)
- ✅ Apenas notificações enviadas (`status = 'sent'`)

## 🔄 Atualizações

O comando sempre mostra dados em tempo real, consultando diretamente o banco de dados Supabase. Não há cache ou dados armazenados localmente.

---

**💡 Dica:** Execute o comando regularmente para monitorar o funcionamento do motor e identificar possíveis problemas nas notificações.
