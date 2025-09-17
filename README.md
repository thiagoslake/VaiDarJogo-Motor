# VaiDarJogo - Motor (Backend)

Este é o motor/backend do sistema VaiDarJogo, responsável pela lógica de negócio, processamento de dados e integração com serviços externos.

## ⚙️ Sobre o Motor

O motor é responsável por:
- Processamento de jogos e sessões
- Gerenciamento de notificações
- Integração com WhatsApp Business API
- Processamento de pagamentos
- Validação de dados e regras de negócio
- Comunicação com o banco de dados Supabase

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Supabase** - Backend como serviço (banco de dados PostgreSQL)
- **WhatsApp Business API** - Integração para notificações
- **SQLite/PostgreSQL** - Banco de dados
- **JavaScript** - Linguagem de programação

## 📁 Estrutura do Projeto

```
VaiDarJogo_Motor/
├── controllers/       # Controladores de lógica de negócio
│   ├── GameController.js
│   ├── NotificationController.js
│   ├── PaymentController.js
│   ├── PlayerController.js
│   └── TeamController.js
├── services/          # Serviços especializados
│   ├── AutoConfirmationService.js
│   ├── GameValidationService.js
│   └── SessionRecreationService.js
├── supabase/          # Configuração e schemas do Supabase
│   ├── config/
│   ├── migrations/
│   └── schema/
├── scripts/           # Scripts de teste e utilitários
│   ├── README.md      # Documentação dos scripts
│   ├── teste_*.js     # Scripts de teste
│   ├── testar_*.js    # Scripts de validação
│   ├── debug_*.js     # Scripts de debug
│   └── [outros]       # Outros utilitários
├── exports/           # Arquivos de exportação
└── [arquivos motor]   # Arquivos principais do motor
```

## 🛠️ Configuração e Instalação

1. **Pré-requisitos:**
   - Node.js (versão 16 ou superior)
   - npm ou yarn
   - Conta Supabase configurada
   - Credenciais WhatsApp Business API

2. **Instalação:**
   ```bash
   cd VaiDarJogo_Motor
   npm install
   ```

3. **Configuração:**
   - Copie `config.example` para `config.js` e configure as variáveis
   - Configure as variáveis de ambiente baseadas em `env.example`
   - Configure as credenciais do Supabase em `supabase/config/supabase.js`

4. **Execução:**
   ```bash
   # Para desenvolvimento
   npm run dev
   
   # Para produção
   npm start
   
   # Para executar scripts de teste
   node scripts/nome_do_script.js
   ```

## 🔧 Funcionalidades Principais

### Controllers
- **GameController:** Gerenciamento de jogos e sessões
- **NotificationController:** Processamento de notificações
- **PaymentController:** Processamento de pagamentos
- **PlayerController:** Gerenciamento de jogadores
- **TeamController:** Gerenciamento de equipes

### Services
- **AutoConfirmationService:** Confirmação automática de jogos
- **GameValidationService:** Validação de regras de negócio
- **SessionRecreationService:** Recriação de sessões

### Integrações
- **WhatsApp Business API:** Envio de notificações
- **Supabase:** Banco de dados e autenticação
- **Sistema de Pagamentos:** Processamento de transações

## 📊 Scripts de Teste

O projeto inclui uma pasta dedicada `scripts/` com diversos scripts organizados:

### 🧪 Scripts de Teste
- `teste_*.js` - Scripts de teste específicos
- `testar_*.js` - Scripts de validação e teste
- `criar_teste_*.js` - Criação de dados de teste

### 🔧 Scripts de Utilitários
- `debug_*.js` - Scripts de debug e diagnóstico
- `verificar_*.js` - Scripts de verificação
- `monitorar_*.js` - Scripts de monitoramento
- `limpar_*.js` - Scripts de limpeza de dados

### ⚙️ Scripts de Configuração
- `atualizar_*.js` - Scripts de atualização
- `criar_configuracoes_*.js` - Scripts de configuração
- `disable_*.js` - Scripts de desabilitação

**Consulte `scripts/README.md` para documentação detalhada de todos os scripts.**

## 🗄️ Banco de Dados

O sistema utiliza Supabase (PostgreSQL) com schemas organizados em:
- `supabase/schema/` - Definições de tabelas e relacionamentos
- `supabase/migrations/` - Scripts de migração
- `SQL_NOTIFICATION_TABLES.sql` - Tabelas de notificação

## 📚 Documentação

- `README.md` - Este arquivo
- `QUICKSTART.md` - Guia de início rápido
- `SETUP_REFATORACAO.md` - Guia de refatoração
- `SISTEMA_NOTIFICACOES.md` - Documentação do sistema de notificações
- `CONFIRMACAO_JOGO_README.md` - Sistema de confirmação de jogos

## 🔗 Integração com o Aplicativo

O motor se comunica com o **VaiDarJogo_Flutter** através de:
- API REST do Supabase
- WebSockets para notificações em tempo real
- Autenticação JWT compartilhada

## 🚀 Deploy

O projeto está configurado para deploy no Railway:
- `railway.json` - Configuração do Railway
- `package.json` - Scripts de build e start

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação específica em cada arquivo `.md`
2. Verifique os logs de erro
3. Execute os scripts de teste para diagnóstico
4. Entre em contato com a equipe de desenvolvimento

## 🔄 Fluxo de Trabalho

1. **Desenvolvimento:** Use os scripts de teste para validar funcionalidades
2. **Teste:** Execute os scripts de verificação antes do deploy
3. **Deploy:** Use o Railway para deploy automático
4. **Monitoramento:** Acompanhe logs e métricas de performance