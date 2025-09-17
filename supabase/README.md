# 🗄️ SUPABASE - VAIDARJOGO

## 📋 **MIGRAÇÃO DE SQLITE PARA POSTGRESQL**

Este diretório contém todos os arquivos relacionados à migração do banco SQLite para Supabase (PostgreSQL).

### 🚀 **ESTRUTURA DO PROJETO**

```
supabase/
├── migrations/          # Scripts de migração
├── schema/             # Schema do banco
├── api/                # APIs e funções
├── config/             # Configurações
└── docs/               # Documentação
```

### 🔄 **PLANO DE MIGRAÇÃO**

1. **Setup Supabase** - Configuração inicial
2. **Schema Migration** - Conversão SQLite → PostgreSQL
3. **Data Migration** - Transferência de dados existentes
4. **API Development** - Criação das APIs REST
5. **Bot Integration** - Refatoração do bot para usar APIs

### 📊 **TABELAS PRINCIPAIS**

- `games` - Configurações dos jogos
- `players` - Cadastro de jogadores
- `teams` - Times formados
- `payments` - Sistema de pagamentos
- `notifications` - Sistema de notificações
- `game_sessions` - Sessões de jogo
- `app_users` - Usuários do aplicativo

### 🛠️ **TECNOLOGIAS**

- **Database**: PostgreSQL (Supabase)
- **APIs**: REST + GraphQL (opcional)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### 📱 **INTEGRAÇÃO**

- **WhatsApp Bot**: Node.js + APIs
- **Mobile App**: Flutter + APIs
- **Web Dashboard**: React/Next.js + APIs (futuro)

---

**Status**: 🟡 Em Desenvolvimento  
**Última Atualização**: $(date)  
**Versão**: 1.0.0
