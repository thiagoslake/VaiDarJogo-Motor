# 📧 Desabilitar Confirmação de Email para Testes

## 🎯 Objetivo
Desabilitar a confirmação de email no Supabase para facilitar os testes durante o desenvolvimento.

## 🚀 Passos para Desabilitar

### 1. Acessar o Painel do Supabase
1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **VaiDarJogo**

### 2. Configurar Authentication
1. No menu lateral, clique em **Authentication**
2. Clique em **Settings** (Configurações)
3. Role para baixo até a seção **Email Confirmation**

### 3. Desabilitar Confirmações
Desabilite as seguintes opções:

- ✅ **Email Confirmation**: `OFF`
- ✅ **Email Change Confirmation**: `OFF` 
- ✅ **Phone Confirmation**: `OFF`

### 4. Salvar Configurações
1. Clique em **Save** (Salvar)
2. Aguarde a confirmação de que as configurações foram salvas

## 🧪 Testando a Configuração

### 1. Teste de Login
1. Abra o app Flutter
2. Tente fazer login com um usuário existente
3. O login deve funcionar sem pedir confirmação de email

### 2. Teste de Registro
1. Tente criar um novo usuário
2. O registro deve funcionar sem enviar email de confirmação
3. O usuário deve poder fazer login imediatamente

## 📋 Configurações Recomendadas para Desenvolvimento

```
Email Confirmation: OFF
Email Change Confirmation: OFF
Phone Confirmation: OFF
```

## ⚠️ Importante para Produção

**ATENÇÃO**: Estas configurações são apenas para desenvolvimento e testes. Para produção:

1. **Reabilite** a confirmação de email
2. **Configure** um provedor de email (SendGrid, Mailgun, etc.)
3. **Teste** o fluxo completo de confirmação
4. **Configure** templates de email personalizados

## 🔧 Scripts Disponíveis

Se preferir usar scripts SQL, execute no **SQL Editor** do Supabase:

### Script Simples (Recomendado)
```sql
-- Execute: flutter_app/database/confirm_emails_simple.sql
```

### Script Completo
```sql
-- Execute: flutter_app/database/disable_email_confirmation.sql
```

## ✅ Verificação

Após desabilitar a confirmação de email:

1. ✅ Login funciona sem confirmação
2. ✅ Registro funciona sem confirmação
3. ✅ Novos usuários podem fazer login imediatamente
4. ✅ Testes são mais rápidos e simples

## 🆘 Solução de Problemas

### Erro: "Email not confirmed"
- Verifique se a confirmação de email está desabilitada
- Execute o script SQL para confirmar emails existentes
- Verifique se as configurações foram salvas

### Erro: "User not found"
- Verifique se o usuário existe na tabela `users`
- Verifique se o email está correto
- Verifique se o usuário não foi deletado

### Erro: "Invalid credentials"
- Verifique se a senha está correta
- Verifique se o usuário está ativo
- Verifique se não há problemas de RLS

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do Supabase
2. Verifique os logs do Flutter
3. Execute os scripts de correção
4. Consulte a documentação do Supabase

---

**Última atualização**: $(date)
**Status**: ✅ Configurado para testes
