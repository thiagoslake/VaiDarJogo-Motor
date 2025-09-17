# Configuração do WhatsApp Business API

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Configurações do WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui

# Configurações do Supabase (se necessário)
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Configurações do bot (opcional)
ADMIN_DEFAULT_PHONE=5513981645787
ADMIN_DEFAULT_NAME=Administrador
```

## Como Obter as Credenciais

### 1. Phone Number ID
- Acesse o [Facebook Developers](https://developers.facebook.com/)
- Vá para seu app do WhatsApp Business
- Em "WhatsApp" > "Getting Started"
- Copie o "Phone number ID"

### 2. Access Token
- No mesmo local, copie o "Temporary access token"
- Para produção, gere um token permanente

## Instalação de Dependências

```bash
npm install axios
```

## Execução

```bash
node whatsapp_business_api.js
```

## Webhook (Opcional)

Para receber respostas dos botões automaticamente, configure um webhook:

1. No Facebook Developers, vá para "WhatsApp" > "Configuration"
2. Configure a URL do webhook
3. Use o método `processWebhookResponse()` para processar as respostas










