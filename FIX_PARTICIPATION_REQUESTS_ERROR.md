# 🔧 Corrigir Erro "Could not find the 'player_id' column"

## 🎯 Problema
Erro: `PostgrestException(message: Could not find the 'player_id' column of 'participation_requests' in the schema cache, code: PGRST204)`

## 🔍 Causa
O PostgREST está usando um cache de schema que ainda referencia a coluna `player_id` em vez de `user_id` na tabela `participation_requests`.

## ✅ Soluções

### Solução 1: Limpar Cache do PostgREST (Recomendada)

#### 1. Reiniciar o Supabase
1. Vá para o painel do Supabase
2. Acesse **Settings > General**
3. Clique em **Restart** para reiniciar o projeto
4. Aguarde alguns minutos para o restart completo

#### 2. Verificar Schema
1. Vá para **SQL Editor**
2. Execute a consulta:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'participation_requests' 
AND table_schema = 'public';
```

### Solução 2: Executar Script de Migração

#### 1. Executar Script de Correção
1. Vá para **SQL Editor** no Supabase
2. Execute o script: `supabase/schema/07_fix_participation_requests.sql`
3. Aguarde a execução completa

#### 2. Verificar Resultado
```sql
-- Verificar se a coluna user_id existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'participation_requests' 
AND column_name = 'user_id';
```

### Solução 3: Recriar Tabela (Último Recurso)

⚠️ **ATENÇÃO**: Esta solução apagará todos os dados existentes!

```sql
-- 1. Fazer backup dos dados
CREATE TABLE participation_requests_backup AS 
SELECT * FROM participation_requests;

-- 2. Dropar a tabela
DROP TABLE participation_requests CASCADE;

-- 3. Recriar com estrutura correta
CREATE TABLE participation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- 4. Restaurar dados (se necessário)
INSERT INTO participation_requests 
SELECT * FROM participation_requests_backup;
```

## 🧪 Testando a Correção

### 1. Teste de Consulta
```sql
-- Testar consulta que estava falhando
SELECT * FROM participation_requests LIMIT 1;
```

### 2. Teste no Flutter
1. Abra o app Flutter
2. Tente enviar uma solicitação de participação
3. Verifique se o erro não aparece mais

## 📋 Checklist de Verificação

- [ ] Cache do PostgREST limpo
- [ ] Tabela `participation_requests` tem coluna `user_id`
- [ ] Consultas SQL funcionam corretamente
- [ ] App Flutter não apresenta erro
- [ ] Solicitações de participação funcionam

## 🆘 Solução de Problemas

### Erro persiste após restart
- Verifique se o schema está correto
- Execute o script de migração
- Verifique se não há outras referências a `player_id`

### Dados perdidos
- Verifique se há backup na tabela `participation_requests_backup`
- Restaure os dados se necessário

### Erro em outras tabelas
- Verifique se outras tabelas também precisam de correção
- Execute scripts de migração correspondentes

## 📞 Suporte

Se o problema persistir:
1. Verifique os logs do Supabase
2. Verifique os logs do Flutter
3. Execute os scripts de correção
4. Consulte a documentação do PostgREST

---

**Última atualização**: $(date)
**Status**: ✅ Soluções implementadas
