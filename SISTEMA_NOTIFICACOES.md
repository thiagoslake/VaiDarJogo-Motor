# 📱 Sistema de Notificações - Bot VaiDarJogo

## 🎯 Visão Geral

O sistema de notificações permite aos administradores configurar e gerenciar notificações automáticas para os participantes dos jogos, com controle total sobre frequência, horários e destinatários.

## ✨ Funcionalidades Principais

### 1. 🎛️ Configuração de Notificações
- **Tipo de Notificação**: Individual, grupo ou ambos
- **Quantidade**: Configurável (padrão: 3 notificações)
- **Horário**: Primeira notificação personalizável
- **Intervalo**: Tempo entre notificações configurável
- **Prioridade**: Mensalistas recebem primeiro, depois avulsos

### 2. 📨 Sistema de Envio
- **Notificações Individuais**: Enviadas diretamente para cada jogador
- **Notificações em Grupo**: Enviadas no grupo do WhatsApp (se configurado)
- **Agendamento Automático**: Sistema calcula e agenda horários automaticamente
- **Controle de Spam**: Intervalo entre mensagens para evitar bloqueios

### 3. ✅ Confirmação de Participação
- **Resposta Simples**: Jogadores respondem "confirmar [ID]" ou "recusar [ID]"
- **Sem Autenticação**: Qualquer jogador pode confirmar/recusar
- **Notas Opcionais**: Possibilidade de adicionar observações
- **Status em Tempo Real**: Controle de confirmados, recusados e pendentes

### 4. 📋 Lista de Espera Inteligente
- **Controle de Vagas**: Sistema calcula automaticamente vagas disponíveis
- **Adição Automática**: Jogadores são adicionados à lista quando não há vagas
- **Posicionamento**: Ordem baseada na hora da confirmação
- **Promoção**: Jogadores podem ser promovidos quando vagas abrem

## 🗄️ Estrutura do Banco de Dados

### Tabela `notification_configs`
```sql
- id: Identificador único
- game_id: Referência ao jogo
- session_id: Referência à sessão específica
- notification_type: 'individual', 'group', 'both'
- total_notifications: Número total de notificações
- first_notification_time: Horário da primeira notificação
- notification_interval_hours: Intervalo entre notificações
- mensal_notifications: Quantas notificações para mensalistas
- group_chat_id: ID do grupo do WhatsApp (se aplicável)
```

### Tabela `notifications_sent`
```sql
- id: Identificador único
- notification_config_id: Referência à configuração
- notification_number: Número da notificação (1ª, 2ª, 3ª...)
- target_type: 'mensal', 'avulso', 'group'
- message_content: Conteúdo da mensagem enviada
- status: 'sent', 'delivered', 'failed'
```

### Tabela `participation_confirmations`
```sql
- id: Identificador único
- session_id: Referência à sessão
- player_id: Referência ao jogador
- confirmation_status: 'confirmed', 'declined', 'pending'
- confirmed_at: Timestamp da confirmação
- declined_at: Timestamp da recusa
- notes: Observações adicionais
```

### Tabela `waiting_list`
```sql
- id: Identificador único
- session_id: Referência à sessão
- player_id: Referência ao jogador
- position: Posição na lista de espera
- status: 'waiting', 'promoted', 'removed'
```

## 🚀 Como Usar

### 1. Configurar Notificações (Opção 11)
```
1. Digite "11" ou "configurar notificações"
2. Escolha a sessão desejada
3. Configure os parâmetros:
   - Tipo de notificação
   - Quantidade de notificações
   - Horário da primeira notificação
   - Intervalo entre notificações
   - Quantas notificações para mensalistas
   - ID do grupo (se aplicável)
```

### 2. Ver Status (Opção 12)
```
1. Digite "12" ou "status notificações"
2. Visualize:
   - Jogadores confirmados
   - Jogadores que recusaram
   - Confirmações pendentes
   - Vagas restantes
   - Lista de espera
```

### 3. Jogadores Confirmando Participação
```
Para confirmar:
"confirmar 123" (onde 123 é o ID da sessão)

Para recusar:
"recusar 123"

Com observações:
"confirmar 123 Vou chegar 10 min atrasado"
```

## 📅 Fluxo de Notificações

### Exemplo: Jogo Semanal com 3 Notificações
```
Configuração:
- 1ª notificação: 72h antes (apenas mensalistas)
- 2ª notificação: 48h antes (mensalistas + avulsos)
- 3ª notificação: 24h antes (todos os jogadores)

Cronograma:
- Segunda-feira 19:00: Jogo
- Sexta-feira 19:00: 1ª notificação (mensalistas)
- Sábado 19:00: 2ª notificação (todos)
- Domingo 19:00: 3ª notificação (todos)
```

## 🎯 Lógica de Prioridades

### 1. Primeira Notificação
- ✅ **Apenas mensalistas** recebem
- 🎯 Objetivo: Garantir base de jogadores fiéis
- ⏰ Horário: Configurável pelo administrador

### 2. Notificações Subsequentes
- 🔄 **Mensalistas + Avulsos** recebem
- 📊 **Baseado na configuração**:
  - Se `mensal_notifications = 2`: 2 primeiras só para mensalistas
  - Se `mensal_notifications = 1`: 1ª para mensalistas, 2ª+ para todos

### 3. Controle de Vagas
- 🎯 **Sistema calcula automaticamente**:
  - Vagas = (jogadores_linha + reservas) × número_times
  - Quando cheio → lista de espera
  - Quando vaga abre → próximo da lista é promovido

## 🔧 Configurações Avançadas

### Tipos de Notificação
```
individual: Apenas mensagens individuais
group: Apenas no grupo do WhatsApp
both: Individual + grupo simultaneamente
```

### Intervalos Recomendados
```
Jogo diário: 6-12 horas
Jogo semanal: 24-48 horas
Jogo mensal: 72-168 horas
Jogo anual: 1-2 semanas
```

### Configuração de Grupo
```
Para usar notificações em grupo:
1. Adicione o bot ao grupo do futebol
2. Configure o group_chat_id
3. Escolha notification_type: 'group' ou 'both'
```

## 📊 Monitoramento e Relatórios

### Status em Tempo Real
- ✅ Jogadores confirmados
- ❌ Jogadores que recusaram
- ⏳ Confirmações pendentes
- 📋 Lista de espera
- 🎯 Vagas restantes

### Logs de Notificações
- 📅 Data/hora de envio
- 👥 Destinatários
- 📱 Status de entrega
- 🔄 Tentativas de reenvio

## 🚨 Tratamento de Erros

### Cenários de Falha
1. **Jogador não encontrado**: Mensagem de erro específica
2. **Sessão inválida**: Verificação de ID
3. **Falha no envio**: Log de erro e retry automático
4. **Grupo não encontrado**: Fallback para notificações individuais

### Recuperação Automática
- 🔄 Retry em caso de falha
- 📱 Fallback para método alternativo
- 📊 Logs detalhados para debugging
- ⚠️ Alertas para administradores

## 🔮 Próximas Melhorias

### Funcionalidades Planejadas
- 🕐 **Agendamento visual**: Interface para configurar horários
- 📊 **Relatórios avançados**: Estatísticas de participação
- 🔔 **Lembretes personalizados**: Configuração por jogador
- 📱 **Notificações push**: Integração com outros canais
- 🤖 **IA para otimização**: Sugestões de horários ideais

### Integrações Futuras
- 📅 **Google Calendar**: Sincronização automática
- 📧 **Email**: Notificações por email
- 📱 **SMS**: Fallback para jogadores sem WhatsApp
- 🌐 **Webhook**: Integração com sistemas externos

---

## 📝 Exemplo de Configuração Completa

```
🏢 Organização: VaiDarJogo
📍 Local: Campo do Flamengo
📅 Dia: Segundas-feiras
⏰ Horário: 19:00 - 21:00
👥 Jogadores: 7 por time + 3 reservas
🏟️ Times: 4

📱 Configuração de Notificações:
- Tipo: Individual + Grupo
- Quantidade: 3 notificações
- 1ª notificação: 72h antes (apenas mensalistas)
- 2ª notificação: 48h antes (todos)
- 3ª notificação: 24h antes (todos)
- Grupo: ID do grupo do futebol

📊 Resultado:
- Mensalistas recebem 3 notificações
- Avulsos recebem 2 notificações
- Grupo recebe todas as notificações
- Sistema de confirmação automático
- Lista de espera quando necessário
```

*Sistema desenvolvido para maximizar a participação e facilitar a gestão de jogos de futebol amador* ⚽🎯
